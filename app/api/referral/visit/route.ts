import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

// ref must be exactly 10 lowercase hex chars (format from gen_random_uuid backfill)
const REF_PATTERN = /^[0-9a-f]{10}$/

/** POST /api/referral/visit — record that someone visited a referrer's challenge link.
 *  - No visitor authentication required.
 *  - Resolves ref → referrer user_id server-side (admin client, bypasses RLS).
 *  - Self-referral blocked (visitor authenticated as same user).
 *  - Dedup: one referral_visit per (referrer, scenario) per day.
 *  - No IP or visitor identity stored.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { ref, scenarioId } = body as { ref?: string; scenarioId?: string }

    if (!ref || !REF_PATTERN.test(ref)) {
      return NextResponse.json({ ok: false, reason: 'invalid_ref' })
    }

    const admin = createAdminClient()

    // Resolve ref → referrer user_id (service role key — never exposed to client)
    const { data: profile } = await admin
      .from('profiles')
      .select('user_id')
      .eq('referral_code', ref)
      .single()

    if (!profile) {
      return NextResponse.json({ ok: false, reason: 'not_found' })
    }

    const referrerId = profile.user_id as string

    // Self-referral block: if visitor is logged in as the same user, skip
    try {
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user?.id === referrerId) {
        return NextResponse.json({ ok: false, reason: 'self_referral' })
      }
    } catch { /* visitor not authenticated — OK to proceed */ }

    // Dedup: one event per (referrer, scenario_id) per calendar day
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)

    const dedupBase = admin
      .from('user_events')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', referrerId)
      .eq('event_type', 'referral_visit')
      .gte('created_at', todayStart.toISOString())

    const dedupQuery = scenarioId
      ? dedupBase.eq('scenario_id', scenarioId)
      : dedupBase.is('scenario_id', null)

    const { count } = await dedupQuery
    if ((count ?? 0) > 0) {
      return NextResponse.json({ ok: true, deduplicated: true })
    }

    await admin.from('user_events').insert({
      user_id: referrerId,
      event_type: 'referral_visit',
      scenario_id: scenarioId ?? null,
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[referral/visit]', err)
    return NextResponse.json({ ok: false, reason: 'server_error' }, { status: 500 })
  }
}
