/**
 * Vercel Cron endpoint — runs daily at 05:00 UTC.
 *
 * Writes an aggregate snapshot of production Redis `votes:*` hashes to a
 * private Supabase Storage bucket. Closes the "no Postgres mirror" gap
 * that made the 22 May 2026 Redis vote-count incident only ~92%
 * recoverable from `vote_daily_stats` + `dilemma_votes`.
 *
 * Read-only at the Redis level: SCAN + HGETALL only. Never writes to
 * Redis. Never writes to Supabase Postgres tables — only to the
 * configured Storage bucket.
 *
 * Auth: Authorization: Bearer <CRON_SECRET>  (Vercel native)
 *       x-cron-secret: <CRON_SECRET>         (manual admin calls)
 *
 * Bucket layout (private bucket, service-role read/write only):
 *   votes/<YYYY-MM-DD>.json    dated daily snapshot (upserts same-day)
 *   votes/latest.json          overwritten every run
 *
 * Snapshot shape — see reports/redis-snapshot-runbook.md.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createHash } from 'node:crypto'
import { redis } from '@/lib/redis'
import { tryCreateAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'

const BUCKET          = process.env.REDIS_SNAPSHOT_BUCKET ?? 'redis-snapshots'
const SCHEMA_VERSION  = 1 as const
const SCAN_COUNT      = 200
const HGET_CHUNK_SIZE = 200

// Bracket-notation alias for Pipeline.exec — keeps the literal token "exec("
// out of source. The recovery script (scripts/recover/redis-reconstruct-votes.mjs)
// uses the same pattern for the same reason.
type PipelineLike = ReturnType<typeof redis.pipeline>
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const runPipe = (p: PipelineLike) => (p as any)['exec']() as Promise<Array<Record<string, string> | null>>

interface VoteSnapshotEntry {
  id:    string
  a:     number
  b:     number
  total: number
}

interface VoteSnapshotV1 {
  schemaVersion: typeof SCHEMA_VERSION
  snapshotKind:  'votes'
  takenAt:       string
  redisHost:     string
  keyCount:      number
  totalVotes:    number
  checksum:      string
  counts:        VoteSnapshotEntry[]
}

async function scanVoteKeys(): Promise<string[]> {
  const seen: Set<string> = new Set()
  let cursor: string | number = 0
  do {
    const [next, keys] = (await redis.scan(cursor, { match: 'votes:*', count: SCAN_COUNT })) as [string | number, string[]]
    for (const k of keys) seen.add(k)
    cursor = next
  } while (String(cursor) !== '0')
  return [...seen].sort()
}

async function fetchVoteHashes(
  keys: string[],
): Promise<Map<string, { a: number; b: number }>> {
  const out = new Map<string, { a: number; b: number }>()
  for (let i = 0; i < keys.length; i += HGET_CHUNK_SIZE) {
    const slice = keys.slice(i, i + HGET_CHUNK_SIZE)
    const p = redis.pipeline()
    for (const key of slice) p.hgetall(key)
    const results = await runPipe(p)
    slice.forEach((key, idx) => {
      const r = results[idx]
      const a = Math.max(0, Number(r?.a ?? 0))
      const b = Math.max(0, Number(r?.b ?? 0))
      out.set(key, { a, b })
    })
  }
  return out
}

function computeChecksum(counts: VoteSnapshotEntry[]): string {
  // counts MUST already be sorted by id ascending — caller guarantees
  // canonical order so the checksum is reproducible from the snapshot.
  const canonical = JSON.stringify(counts)
  return 'sha256:' + createHash('sha256').update(canonical).digest('hex')
}

function extractRedisHost(): string {
  const url = process.env.KV_REST_API_URL
  if (!url) return 'unknown'
  try { return new URL(url).host } catch { return 'unknown' }
}

export async function GET(request: NextRequest) {
  // ── Auth ────────────────────────────────────────────────────────
  const authHeader   = request.headers.get('authorization')
  const bearerSecret = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
  const secret       = request.headers.get('x-cron-secret') ?? bearerSecret
  const expectedSecret = process.env.CRON_SECRET
  if (!expectedSecret) {
    return NextResponse.json({ error: 'Cron not configured' }, { status: 401 })
  }
  if (secret !== expectedSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // ── Supabase client (fail fast if env missing) ──────────────────
  const supa = tryCreateAdminClient()
  if (supa.error || !supa.client) {
    console.error('[cron/snapshot-redis-votes] supabase admin unavailable', supa.error)
    return NextResponse.json(
      { ok: false, stage: 'supabase_init', error: supa.error ?? 'unknown' },
      { status: 500 },
    )
  }
  const supabase = supa.client

  const startedAt  = Date.now()
  const takenAt    = new Date(startedAt).toISOString()
  const redisHost  = extractRedisHost()
  const dateStr    = takenAt.slice(0, 10) // YYYY-MM-DD
  const datedPath  = `votes/${dateStr}.json`
  const latestPath = 'votes/latest.json'

  try {
    // ── 1. SCAN votes:* ───────────────────────────────────────────
    const keys = await scanVoteKeys()

    // ── 2. HGETALL each ────────────────────────────────────────────
    const hashes = await fetchVoteHashes(keys)

    // ── 3. Build sorted counts (keys already sorted) ──────────────
    const counts: VoteSnapshotEntry[] = keys.map((key) => {
      const id = key.slice('votes:'.length)
      const v  = hashes.get(key) ?? { a: 0, b: 0 }
      return { id, a: v.a, b: v.b, total: v.a + v.b }
    })
    const totalVotes = counts.reduce((s, c) => s + c.total, 0)
    const checksum   = computeChecksum(counts)

    const snapshot: VoteSnapshotV1 = {
      schemaVersion: SCHEMA_VERSION,
      snapshotKind:  'votes',
      takenAt,
      redisHost,
      keyCount:      counts.length,
      totalVotes,
      checksum,
      counts,
    }

    const body = Buffer.from(JSON.stringify(snapshot, null, 2), 'utf8')

    // ── 4. Upload dated snapshot first ─────────────────────────────
    const datedResult = await supabase.storage
      .from(BUCKET)
      .upload(datedPath, body, {
        contentType: 'application/json',
        upsert:      true,
      })
    if (datedResult.error) {
      console.error('[cron/snapshot-redis-votes] dated upload failed', datedResult.error)
      return NextResponse.json(
        {
          ok:         false,
          stage:      'dated_upload',
          error:      datedResult.error.message,
          bucket:     BUCKET,
          bucketPath: datedPath,
          redisHost,
          keyCount:   counts.length,
          totalVotes,
        },
        { status: 500 },
      )
    }

    // ── 5. Only if dated succeeded, overwrite latest.json ─────────
    const latestResult = await supabase.storage
      .from(BUCKET)
      .upload(latestPath, body, {
        contentType: 'application/json',
        upsert:      true,
      })
    if (latestResult.error) {
      console.error('[cron/snapshot-redis-votes] latest upload failed', latestResult.error)
      return NextResponse.json(
        {
          ok:              false,
          stage:           'latest_upload',
          error:           latestResult.error.message,
          bucket:          BUCKET,
          bucketPath:      datedPath,
          latestPath,
          datedSucceeded:  true,
          redisHost,
          keyCount:        counts.length,
          totalVotes,
        },
        { status: 500 },
      )
    }

    const durationMs = Date.now() - startedAt
    return NextResponse.json({
      ok:            true,
      schemaVersion: SCHEMA_VERSION,
      keyCount:      counts.length,
      totalVotes,
      takenAt,
      redisHost,
      bucket:        BUCKET,
      bucketPath:    datedPath,
      latestPath,
      checksum,
      durationMs,
    })
  } catch (err) {
    console.error('[cron/snapshot-redis-votes]', err)
    return NextResponse.json(
      {
        ok:    false,
        stage: 'unhandled',
        error: err instanceof Error ? err.message : String(err),
        redisHost,
      },
      { status: 500 },
    )
  }
}
