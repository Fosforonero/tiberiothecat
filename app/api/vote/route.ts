import { NextRequest, NextResponse } from 'next/server'
import { redis, incrementVote, replaceVote } from '@/lib/redis'
import { getScenario } from '@/lib/scenarios'
import { getDynamicScenario } from '@/lib/dynamic-scenarios'
import { createClient } from '@/lib/supabase/server'

const COOKIE_MAX_AGE = 60 * 60 * 24 * 365 // 1 year

// IP rate limit: max 20 votes per IP per hour across ALL dilemmas
const IP_RATE_LIMIT = 20
const IP_WINDOW_SECONDS = 60 * 60 // 1 hour

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    'unknown'
  )
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

    // ── IP-based rate limiting (anti-bot, per hour) ──
    // Runs before auth to protect even the auth lookup from flood
    const ip = getClientIp(request)
    if (ip !== 'unknown') {
      const rateKey = `ratelimit:${ip}`
      const count = await redis.incr(rateKey)
      if (count === 1) await redis.expire(rateKey, IP_WINDOW_SECONDS)
      if (count > IP_RATE_LIMIT) {
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
            const res = NextResponse.json({ ok: true, alreadyVoted: true })
            setCookieOnResponse(res, cookieName, option)
            return res
          }

          // ── Different option but outside 24h window: locked ──
          if (!withinWindow) {
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
            const res = NextResponse.json({ ok: true, alreadyVoted: true })
            setCookieOnResponse(res, cookieName, option)
            return res
          }
          console.error('[vote] insert error:', voteError)
          return NextResponse.json({ error: 'Vote failed' }, { status: 500 })
        }

        // Supabase insert confirmed → safe to increment Redis vote count
        await incrementVote(id, option)

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
    // Cookie is the only dedup mechanism.
    // ────────────────────────────────────────────────────────────────
    if (request.cookies.get(cookieName)) {
      return NextResponse.json({ ok: true, alreadyVoted: true })
    }

    await incrementVote(id, option)

    const res = NextResponse.json({ ok: true })
    setCookieOnResponse(res, cookieName, option)
    return res

  } catch (err) {
    console.error('[vote]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
