/**
 * POST /api/dilemmas/[id]/feedback  — submit 🔥 or 👎 on a dilemma
 * GET  /api/dilemmas/[id]/feedback  — get aggregate counts (public)
 *
 * Anti-spam: one feedback per (user|anon-cookie) per dilemma.
 * Storage: Redis hashes `feedback:{id}` {fire, down} for fast aggregates.
 */

import { NextRequest, NextResponse } from 'next/server'
import { redis } from '@/lib/redis'
import { createClient } from '@/lib/supabase/server'
import { updateFeedbackScore } from '@/lib/dynamic-scenarios'

const COOKIE_MAX_AGE = 60 * 60 * 24 * 365 // 1 year

function feedbackKey(id: string) {
  return `feedback:${id}`
}

async function getFeedbackCounts(id: string): Promise<{ fire: number; down: number }> {
  const raw = await redis.hgetall(feedbackKey(id))
  return {
    fire: Math.max(0, Number(raw?.fire ?? 0)),
    down: Math.max(0, Number(raw?.down ?? 0)),
  }
}

async function incrementFeedback(id: string, type: 'fire' | 'down') {
  await redis.hincrby(feedbackKey(id), type, 1)
  const counts = await getFeedbackCounts(id)
  await updateFeedbackScore(id, counts.fire, counts.down).catch(() => null)
  return counts
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const { id } = params
  try {
    return NextResponse.json(await getFeedbackCounts(id))
  } catch {
    return NextResponse.json({ fire: 0, down: 0 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const { id } = params
  const body = await request.json().catch(() => ({}))
  const { type } = body as { type?: string }

  if (type !== 'fire' && type !== 'down') {
    return NextResponse.json({ error: 'type must be fire or down' }, { status: 400 })
  }

  const cookieName = `sv_fb_${id}`

  // ── Authenticated: use user_id for dedup ──
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      // Check existing feedback in Supabase
      const { data: existing } = await supabase
        .from('dilemma_feedback')
        .select('feedback')
        .eq('user_id', user.id)
        .eq('dilemma_id', id)
        .maybeSingle()

      if (existing) {
        return NextResponse.json({ ok: true, alreadyFeedback: true, feedback: existing.feedback })
      }

      // Insert feedback
      const { error } = await supabase
        .from('dilemma_feedback')
        .insert({ user_id: user.id, dilemma_id: id, feedback: type })

      if (error?.code === '23505') {
        return NextResponse.json({ ok: true, alreadyFeedback: true })
      }

      if (error) {
        console.error('[feedback] insert error:', error)
        return NextResponse.json({ error: 'Could not save feedback' }, { status: 500 })
      }

      // Increment Redis counter and update dynamic scenario feedback score.
      await incrementFeedback(id, type).catch(() => null)

      const res = NextResponse.json({ ok: true })
      res.cookies.set(cookieName, type, { maxAge: COOKIE_MAX_AGE, httpOnly: false, sameSite: 'lax', path: '/' })
      return res
    }
  } catch {
    // Supabase unavailable — fall through to anonymous path
  }

  // ── Anonymous: cookie dedup ──
  const existing = request.cookies.get(cookieName)
  if (existing) {
    return NextResponse.json({ ok: true, alreadyFeedback: true, feedback: existing.value })
  }

  await incrementFeedback(id, type).catch(() => null)

  const res = NextResponse.json({ ok: true })
  res.cookies.set(cookieName, type, { maxAge: COOKIE_MAX_AGE, httpOnly: false, sameSite: 'lax', path: '/' })
  return res
}
