import { NextRequest, NextResponse } from 'next/server'
import { redis, incrementVote } from '@/lib/redis'
import { getScenario } from '@/lib/scenarios'
import { getDynamicScenario } from '@/lib/dynamic-scenarios'

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

    // ── Cookie-based deduplication (per scenario per browser) ──
    const cookieName = `sv_voted_${id}`
    const alreadyVoted = request.cookies.get(cookieName)
    if (alreadyVoted) {
      return NextResponse.json({ ok: true, alreadyVoted: true })
    }

    // ── IP-based rate limiting (anti-bot, per hour) ──
    const ip = getClientIp(request)
    if (ip !== 'unknown') {
      const rateKey = `ratelimit:${ip}`
      const count = await redis.incr(rateKey)
      if (count === 1) {
        // Set expiry on first increment so the key auto-cleans
        await redis.expire(rateKey, IP_WINDOW_SECONDS)
      }
      if (count > IP_RATE_LIMIT) {
        return NextResponse.json(
          { error: 'Too many requests. Try again later.' },
          { status: 429 }
        )
      }
    }

    await incrementVote(id, option)

    const response = NextResponse.json({ ok: true })
    response.cookies.set(cookieName, option, {
      maxAge: COOKIE_MAX_AGE,
      httpOnly: false, // client needs to read it for redirect
      sameSite: 'lax',
      path: '/',
    })
    return response
  } catch (err) {
    console.error('[vote]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
