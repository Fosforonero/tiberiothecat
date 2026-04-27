/**
 * POST /api/events/track
 *
 * Records a user action event for server-side mission verification.
 * Requires authentication — anonymous users are silently rejected (401).
 * Allowlisted event types only. Dedup: skips if identical (user+type+scenario)
 * inserted in the last 60 seconds.
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

const ALLOWED_EVENT_TYPES = new Set([
  'share_result',
  'copy_result_link',
  'story_card_share',
  'story_card_download',
])

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { eventType, scenarioId, metadata } = body as {
      eventType?: string
      scenarioId?: string
      metadata?: Record<string, unknown>
    }

    if (!eventType || !ALLOWED_EVENT_TYPES.has(eventType)) {
      return NextResponse.json({ error: 'Unknown event type' }, { status: 400 })
    }

    // Dedup: skip if same (user, type, scenario) inserted in last 60s
    const oneMinuteAgo = new Date(Date.now() - 60_000).toISOString()
    const { count } = scenarioId
      ? await supabase
          .from('user_events')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('event_type', eventType)
          .eq('scenario_id', scenarioId)
          .gte('created_at', oneMinuteAgo)
      : await supabase
          .from('user_events')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('event_type', eventType)
          .gte('created_at', oneMinuteAgo)

    if ((count ?? 0) > 0) {
      return NextResponse.json({ ok: true, skipped: true })
    }

    await supabase.from('user_events').insert({
      user_id:    user.id,
      event_type: eventType,
      scenario_id: scenarioId ?? null,
      metadata:   metadata ?? {},
    })

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
