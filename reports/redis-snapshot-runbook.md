# SplitVote — Redis Vote-Count Snapshot Runbook

> Operational runbook for the daily Redis `votes:*` snapshot cron.
> Created 22 May 2026. Owner: Matteo.
> Complements `reports/disaster-recovery-runbook.md §1` (Redis outage / data loss).

## 1. Purpose

The 22 May 2026 production Redis incident lost the historical `votes:*` hashes. Recovery via `scripts/recover/redis-reconstruct-votes.mjs` rebuilt 217 votes from Supabase `vote_daily_stats` + `dilemma_votes`, but the reconstruction was conservative (≤ ~18 ghost auth votes irrecoverable). This cron closes that gap by writing an aggregate snapshot of `votes:*` to durable Supabase Storage every day.

The snapshot is **aggregate-only**: per-dilemma `{ a, b, total }` integers. No user IDs, no per-vote records, no IPs, no choices, no timestamps per vote. Same data class as the public `/results/[id]` percentages and the existing `vote_daily_stats` table — no new legal surface.

## 2. Schema

`schemaVersion: 1`.

```jsonc
{
  "schemaVersion": 1,
  "snapshotKind": "votes",
  "takenAt": "2026-05-23T05:00:12.345Z",
  "redisHost": "superb-sheepdog-80533.upstash.io",
  "keyCount": 134,
  "totalVotes": 217,
  "checksum": "sha256:c0ffeec0ffeec0ffeec0ffeec0ffeec0ffeec0ffeec0ffeec0ffeec0ffeec0ffeec0ff",
  "counts": [
    { "id": "ai-art-copyright", "a": 1, "b": 2, "total": 3 },
    { "id": "trolley",          "a": 4, "b": 2, "total": 6 },
    { "id": "…",                "a": 0, "b": 0, "total": 0 }
  ]
}
```

`counts` is **sorted by `id` ascending** so the SHA-256 checksum is reproducible. The checksum is computed over `JSON.stringify(counts)` exactly.

Hosts are URL-host only; **tokens never appear** in snapshots or responses.

## 3. Bucket layout

Private Supabase Storage bucket. Default name `redis-snapshots`, overridable via `REDIS_SNAPSHOT_BUCKET` env var.

```
redis-snapshots/                       (private bucket)
└── votes/
    ├── 2026-05-23.json                dated snapshot (upserts same-day)
    ├── 2026-05-24.json
    ├── …
    └── latest.json                    overwritten every run
```

No retention cleanup in v1 — files accumulate. At ~5 KB/day with 134 dilemmas, this is ~1.8 MB/year, comfortably free-tier.

## 4. Schedule

`vercel.json`:

```json
{ "path": "/api/cron/snapshot-redis-votes", "schedule": "0 5 * * *" }
```

Runs daily at 05:00 UTC — 1 hour before the `generate-dilemmas` cron (06:00 UTC). The 1-hour offset avoids any contention with the dilemma-generation pipeline and captures end-of-day vote totals before the next-day cron cycle starts.

## 5. Manual trigger

Vercel auto-runs the cron at the scheduled time. To trigger manually (e.g. ad-hoc snapshot, post-incident verification):

```bash
# Production
curl -sS -X GET https://splitvote.io/api/cron/snapshot-redis-votes \
  -H "Authorization: Bearer <CRON_SECRET>"

# Local dev
curl -sS -X GET http://localhost:3000/api/cron/snapshot-redis-votes \
  -H "Authorization: Bearer <CRON_SECRET>"
```

Successful response shape:

```json
{
  "ok": true,
  "schemaVersion": 1,
  "keyCount": 134,
  "totalVotes": 217,
  "takenAt": "2026-05-23T05:00:12.345Z",
  "redisHost": "superb-sheepdog-80533.upstash.io",
  "bucket": "redis-snapshots",
  "bucketPath": "votes/2026-05-23.json",
  "latestPath": "votes/latest.json",
  "checksum": "sha256:…",
  "durationMs": 423
}
```

Failure responses always have `ok: false` and a `stage` field identifying which step failed (`supabase_init`, `dated_upload`, `latest_upload`, or `unhandled`).

## 6. Inspecting snapshots in the Supabase dashboard

1. Supabase Dashboard → Project → Storage → `redis-snapshots`
2. Navigate to the `votes/` folder
3. Click `latest.json` to view the most recent snapshot, or any dated file
4. Use the dashboard's download button to fetch the JSON locally

Direct download from the dashboard is service-role-authenticated through the browser session. **The bucket is not publicly accessible** — anon and authenticated client roles have no read or write permissions by default.

## 7. Failure modes

| Symptom | Likely cause | Recovery |
|---|---|---|
| HTTP 401 `Cron not configured` | `CRON_SECRET` env var missing on Vercel | Set in Vercel → Project → Settings → Environment Variables |
| HTTP 401 `Unauthorized` | Wrong Bearer or `x-cron-secret` header | Use the value from Vercel env vars |
| HTTP 500 `stage: "supabase_init"` | `NEXT_PUBLIC_SUPABASE_URL` or `SUPABASE_SERVICE_ROLE_KEY` missing | Verify both env vars on Vercel |
| HTTP 500 `stage: "dated_upload"` | Bucket missing, name mismatch, or service-role lacks write | Create the bucket; check `REDIS_SNAPSHOT_BUCKET` env (defaults to `redis-snapshots`) |
| HTTP 500 `stage: "latest_upload"` with `datedSucceeded: true` | Transient Supabase Storage issue affecting overwrite | The dated file already exists in the bucket; re-run the cron to update `latest.json` |
| HTTP 500 `stage: "unhandled"` | Redis SCAN/pipeline error, unexpected exception | Check Vercel logs (`[cron/snapshot-redis-votes]`); inspect Upstash dashboard for connectivity / quota issues |
| `keyCount: 0`, `totalVotes: 0` | Production Redis is empty (e.g. fresh reset) | The snapshot is still uploaded (valid empty snapshot). Compare against `latest.json` from the day before to detect data loss. |

## 8. Restore from snapshot (future sprint)

The restore tool is **out of this sprint**. When implemented, it will live at `scripts/recover/redis-restore-from-snapshot.mjs` and mirror the safety pattern of `scripts/recover/redis-reconstruct-votes.mjs`:

- `--env-file=<path>` mandatory
- Dry-run by default
- Write mode requires `--confirm` + `--max-keys=<n>` + `--i-understand-this-writes-production-redis`
- Never downgrades — target = `MAX(snapshot, current Redis)` per field
- HSET only — never `DEL`, `FLUSHDB`, `FLUSHALL`, `EXPIRE`, `RESTORE`
- Verifies snapshot `checksum` before any write
- Refuses to apply a snapshot whose `redisHost` does not match the target

Until the restore tool ships, recovery from a Redis reset uses `scripts/recover/redis-reconstruct-votes.mjs` (Supabase aggregates), which is conservative but proven.

## 9. v1 limitations (intentional)

- **No retention cleanup.** Files accumulate. Cleanup is a later sprint when storage growth warrants it.
- **No monitoring alarm.** PM manually checks `votes/latest.json` after the first successful run, and weekly thereafter until trust is established.
- **No restore endpoint.** Restore is HUMAN_ONLY local script execution — not a Vercel route.
- **`votes:*` only.** `feedback:*`, `dynamic:scenarios`, `dynamic:drafts` are out of scope for this sprint. They have different recovery semantics (feedback aggregates already mirror to `dilemma_feedback`; drafts can be regenerated; approved scenarios can be re-approved). Each gets its own snapshot sprint if needed.

## 10. Verification after first cron run

After 05:00 UTC on the next scheduled day:

1. Supabase Dashboard → Storage → `redis-snapshots` → `votes/`
2. Confirm `latest.json` exists and `takenAt` is from the most recent 05:00 UTC window
3. Confirm `keyCount` and `totalVotes` are reasonable vs production Redis (currently ~134 keys, ~217 votes)
4. Sanity-check a few entries in `counts[]` against the live `/results/<id>` pages
5. Confirm a `votes/<YYYY-MM-DD>.json` dated copy also exists
6. Once verified, mark `[x] Daily Redis snapshot to long-term storage` in `reports/disaster-recovery-runbook.md §8` (separate sprint — not in this one)

## 11. First-run verification log

### Manual trigger — 22 May 2026

The first invocation of this cron was a manual `curl` trigger immediately after deploy, before the scheduled 05:00 UTC slot. It succeeded.

| Field | Value |
|---|---|
| `ok` | `true` |
| `schemaVersion` | `1` |
| `keyCount` | `136` |
| `totalVotes` | `219` |
| `takenAt` | `2026-05-22T12:49:43.739Z` |
| `redisHost` | `superb-sheepdog-80533.upstash.io` |
| `bucket` | `redis-snapshots` |
| `bucketPath` | `votes/2026-05-22.json` |
| `latestPath` | `votes/latest.json` |
| `checksum` | `sha256:f22e0d0a855e9ff4058b88b783fa59aa2829a26e02ea56ff1fd038375d862896` |
| `durationMs` | `764` |

`keyCount=136` and `totalVotes=219` — the +2 keys and +2 votes vs the 22 May post-recovery state (134 keys / 217 votes per `reports/incidents/redis-vote-count-incident-2026-05-22.md`) reflect normal vote activity between the recovery and this manual snapshot.

Next scheduled run: **05:00 UTC daily** (every day going forward, per `vercel.json`).

The corresponding mitigation box in `reports/disaster-recovery-runbook.md §8` is checked as of 22 May 2026.
