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

    // ── Cookie-based deduplication (fast path, per scenario per browser) ──
    const cookieName = `sv_voted_${id}`
    if (request.cookies.get(cookieName)) {
      return NextResponse.json({ ok: true, alreadyVoted: true })
    }

    // ── IP-based rate limiting (anti-bot, per hour) ──
    const ip = getClientIp(request)
    if (ip !== 'unknown') {
      const rateKey = `ratelimit:${ip}`
      const count = await redis.incr(rateKey)
      if (count === 1) await redis.expire(rateKey, IP_WINDOW_SECONDS)
      if (count > IP_RATE_LIMIT) {
        return NextResponse.json({ error: 'Too many requests. Try again later.' }, { status: 429 })
      }
    }

    // Track whether Redis has already been incremented to avoid double-counting
    let redisIncremented = false

    // ── Logged-in user: Supabase is the authoritative source for dedup & vote changes ──
    try {
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        const choice = option.toUpperCase() as 'A' | 'B'
        const newWindow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

        // Check for an existing vote for this dilemma (handles multi-device dedup)
        const { data: existing } = await supabase
          .from('dilemma_votes')
          .select('choice, can_change_until')
          .eq('user_id', user.id)
          .eq('dilemma_id', id)
          .maybeSingle()

        if (existing) {
          // Already voted — allow change only within the 24h window and for a different option
          const canChange = new Date(existing.can_change_until) > new Date()
          const prevOption = existing.choice.toLowerCase() as 'a' | 'b'

          if (canChange && prevOption !== option) {
            // Atomically swap Redis counts so totals stay accurate
            await replaceVote(id, prevOption, option)
            redisIncremented = true
            await supabase
              .from('dilemma_votes')
              .update({ choice, can_change_until: newWindow })
              .eq('user_id', user.id)
              .eq('dilemma_id', id)
          }
          // Same option or outside 24h window: no-op — cookie will block the browser
        } else {
          // First vote for this dilemma by this user
          await incrementVote(id, option)
          redisIncremented = true

          const { error: voteError } = await supabase
            .from('dilemma_votes')
            .insert({ user_id: user.id, dilemma_id: id, choice, can_change_until: newWindow })

          if (!voteError) {
            // Increment votes_count. xp is awarded inside the RPC when migration_v3 is applied.
            try {
              await supabase.rpc('increment_user_vote_count', { p_user_id: user.id })
            } catch { /* migration not yet applied — non-blocking */ }
          }
        }
      } else {
        // Anonymous user: Redis only
        await incrementVote(id, option)
        redisIncremented = true
      }
    } catch {
      // Supabase unavailable: ensure Redis always gets the count
      if (!redisIncremented) {
        await incrementVote(id, option)
        redisIncremented = true
      }
    }

    // Final safety net
    if (!redisIncremented) await incrementVote(id, option)

    const response = NextResponse.json({ ok: true })
    response.cookies.set(cookieName, option, {
      maxAge: COOKIE_MAX_AGE,
      httpOnly: false,
      sameSite: 'lax',
      path: '/',
    })
    return response
  } catch (err) {
    console.error('[vote]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
