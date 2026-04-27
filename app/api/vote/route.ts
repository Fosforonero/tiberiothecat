import crypto from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'
import { redis, incrementVote, replaceVote } from '@/lib/redis'
import { getScenario } from '@/lib/scenarios'
import { getDynamicScenario } from '@/lib/dynamic-scenarios'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const COOKIE_MAX_AGE = 60 * 60 * 24 * 365 // 1 year

// Rate limit tiers (all use Redis keys with TTL, no external library)
const IP_LIMIT_GLOBAL   = 60   // per IP per hour across all dilemmas — raised from 20 to be NAT-friendly
const IP_WINDOW         = 3600 // 1 hour
const IP_LIMIT_SCENARIO = 5    // per IP per dilemma per 10 min — catches single-scenario hammering
const SCENARIO_WINDOW   = 600  // 10 minutes
const USER_LIMIT        = 120  // per logged-in user per hour — high enough for normal use
const USER_WINDOW       = 3600 // 1 hour

type VoteEventType = 'vote_success' | 'vote_change' | 'vote_duplicate' | 'vote_rate_limited'

/**
 * Insert a vote funnel event for a logged-in user.
 * Non-blocking — errors are swallowed, never fail the vote response.
 * No IP or sensitive data stored; only option + reason metadata.
 */
async function trackVoteEvent(
  userId: string,
  eventType: VoteEventType,
  scenarioId: string,
  option: string,
  reason?: string,
): Promise<void> {
  try {
    const admin = createAdminClient()
    await admin.from('user_events').insert({
      user_id:    userId,
      event_type: eventType,
      scenario_id: scenarioId,
      metadata: {
        option,
        anonymous: false,
        ...(reason ? { reason } : {}),
      },
    })
  } catch {
    // Non-blocking: never fail a vote because of analytics
  }
}

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    'unknown'
  )
}

// Hash the IP before using it in Redis keys so raw IPs are never stored.
// RATE_LIMIT_SALT is optional — hashing without salt is still better than raw.
function getRateLimitIdentity(ip: string): string {
  if (ip === 'unknown') return 'unknown'
  const salt = process.env.RATE_LIMIT_SALT ?? ''
  return crypto.createHash('sha256').update(salt + ip).digest('hex').slice(0, 16)
}

function setCookieOnResponse(
  res: NextResponse,
  cookieName: string,
  value: string,
): void {
  res.cookies.set(cookieName, value, {
    maxAge: COOKIE_MAX_AGE,
    httpOnly: false,
    sameSite: 'lax',
    path: '/',
  })
}

/**
 * Track aggregate vote stats (anon + logged-in) via service_role client.
 * Non-blocking — errors are logged but never fail the vote response.
 * No personal data stored: only dilemma_id, option, date, anon flag.
 */
async function trackDailyVote(
  dilemmaId: string,
  choice: 'A' | 'B',
  isAnonymous: boolean,
): Promise<void> {
  try {
    const admin = createAdminClient()
    const today = new Date().toISOString().slice(0, 10) // 'YYYY-MM-DD'
    await admin.rpc('upsert_vote_daily_stat', {
      p_date: today,
      p_dilemma_id: dilemmaId,
      p_option: choice,
      p_is_anonymous: isAnonymous,
    })
  } catch (err) {
    // Non-blocking: never fail a vote because of analytics
    console.error('[vote] trackDailyVote error (non-blocking):', err)
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, option } = body

    if (!id || (option !== 'a' && option !== 'b')) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    // Accept both static and AI-generated dynamic scenario IDs
    const scenario = getScenario(id) ?? await getDynamicScenario(id)
    if (!scenario) {
      return NextResponse.json({ error: 'Scenario not found' }, { status: 404 })
    }

    const ip = getClientIp(request)
    const ipHash = getRateLimitIdentity(ip)

    // ── Tier 1: global IP rate limit — coarse anti-bot, runs before auth ──
    if (ip !== 'unknown') {
      const globalKey = `ratelimit:${ipHash}`
      const globalCount = await redis.incr(globalKey)
      if (globalCount === 1) await redis.expire(globalKey, IP_WINDOW)
      if (globalCount > IP_LIMIT_GLOBAL) {
        return NextResponse.json({ error: 'Too many requests. Try again later.' }, { status: 429 })
      }
    }

    // ── Tier 2: per-scenario+IP rate limit — catches single-dilemma hammering ──
    if (ip !== 'unknown') {
      const scenarioKey = `ratelimit:scenario:${id}:${ipHash}`
      const scenarioCount = await redis.incr(scenarioKey)
      if (scenarioCount === 1) await redis.expire(scenarioKey, SCENARIO_WINDOW)
      if (scenarioCount > IP_LIMIT_SCENARIO) {
        return NextResponse.json({ error: 'Too many requests. Try again later.' }, { status: 429 })
      }
    }

    const cookieName = `sv_voted_${id}`
    const choice = option.toUpperCase() as 'A' | 'B'
    const newWindow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

    // ────────────────────────────────────────────────────────────────
    // LOGGED-IN PATH: Supabase is the authoritative source of truth.
    // Cookie dedup is NOT used for authenticated users — a user may
    // log in on a different device and the cookie would wrongly block.
    // ────────────────────────────────────────────────────────────────
    try {
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        // ── Tier 3: per-user rate limit — runs after auth, before dedup ──
        const userKey = `ratelimit:user:${user.id}`
        const userCount = await redis.incr(userKey)
        if (userCount === 1) await redis.expire(userKey, USER_WINDOW)
        if (userCount > USER_LIMIT) {
          void trackVoteEvent(user.id, 'vote_rate_limited', id, option, 'user_limit')
          return NextResponse.json({ error: 'Too many requests. Try again later.' }, { status: 429 })
        }

        // Check existing vote in Supabase (cross-device dedup)
        const { data: existing } = await supabase
          .from('dilemma_votes')
          .select('choice, can_change_until')
          .eq('user_id', user.id)
          .eq('dilemma_id', id)
          .maybeSingle()

        if (existing) {
          const prevOption = existing.choice.toLowerCase() as 'a' | 'b'
          const withinWindow = new Date(existing.can_change_until) > new Date()

          // ── Same option: no-op ──
          if (prevOption === option) {
            void trackVoteEvent(user.id, 'vote_duplicate', id, option, 'same_option')
            const res = NextResponse.json({ ok: true, alreadyVoted: true })
            setCookieOnResponse(res, cookieName, option)
            return res
          }

          // ── Different option but outside 24h window: locked ──
          if (!withinWindow) {
            void trackVoteEvent(user.id, 'vote_duplicate', id, option, 'locked')
            const res = NextResponse.json({ ok: true, alreadyVoted: true, locked: true })
            setCookieOnResponse(res, cookieName, prevOption)
            return res
          }

          // ── Different option within 24h: atomic Redis swap, update Supabase ──
          // votes_count does NOT change on a vote change — the user already counted
          await replaceVote(id, prevOption, option)
          await supabase
            .from('dilemma_votes')
            .update({ choice, can_change_until: newWindow })
            .eq('user_id', user.id)
            .eq('dilemma_id', id)

          void trackVoteEvent(user.id, 'vote_change', id, option)

          const res = NextResponse.json({ ok: true, changed: true })
          setCookieOnResponse(res, cookieName, option)
          return res
        }

        // ── First vote for this dilemma by this user ──
        // INSERT to Supabase FIRST — only then increment Redis.
        // This prevents double-counting if the INSERT fails or if a race
        // condition causes a duplicate unique-constraint violation.
        const { error: voteError } = await supabase
          .from('dilemma_votes')
          .insert({ user_id: user.id, dilemma_id: id, choice, can_change_until: newWindow })

        if (voteError) {
          if (voteError.code === '23505') {
            // Race condition: another concurrent request already inserted this vote.
            // Treat as alreadyVoted — do NOT increment Redis.
            void trackVoteEvent(user.id, 'vote_duplicate', id, option, 'race_condition')
            const res = NextResponse.json({ ok: true, alreadyVoted: true })
            setCookieOnResponse(res, cookieName, option)
            return res
          }
          console.error('[vote] insert error:', voteError)
          return NextResponse.json({ error: 'Vote failed' }, { status: 500 })
        }

        // Supabase insert confirmed → safe to increment Redis vote count
        await incrementVote(id, option)

        void trackVoteEvent(user.id, 'vote_success', id, option)

        // Track in daily stats — logged-in user, non-blocking
        void trackDailyVote(id, choice, false)

        // Increment votes_count + award XP/streak (non-blocking)
        try {
          await supabase.rpc('increment_user_vote_count', { p_user_id: user.id })
        } catch { /* migration_v3 not applied yet — non-blocking */ }

        const res = NextResponse.json({ ok: true })
        setCookieOnResponse(res, cookieName, option)
        return res
      }
      // user is null → fall through to anonymous path below
    } catch (supabaseErr) {
      console.error('[vote] supabase error, falling through to anonymous path:', supabaseErr)
      // Fall through to anonymous path
    }

    // ────────────────────────────────────────────────────────────────
    // ANONYMOUS PATH (no auth or Supabase unavailable):
    // Cookie is the only dedup mechanism. No user_events inserted.
    // ────────────────────────────────────────────────────────────────
    if (request.cookies.get(cookieName)) {
      return NextResponse.json({ ok: true, alreadyVoted: true })
    }

    await incrementVote(id, option)

    // Track in daily stats — anonymous, non-blocking
    void trackDailyVote(id, choice, true)

    const res = NextResponse.json({ ok: true })
    setCookieOnResponse(res, cookieName, option)
    return res

  } catch (err) {
    console.error('[vote]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
