import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { MISSIONS } from '@/lib/missions'

export const dynamic = 'force-dynamic'

/** POST /api/missions/complete — mark a mission as complete and award XP */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { missionId } = await req.json()
    const mission = MISSIONS.find(m => m.id === missionId)
    if (!mission) return NextResponse.json({ error: 'Unknown mission' }, { status: 400 })

    const today = new Date().toISOString().split('T')[0]

    // Insert with conflict ignore — idempotent
    const { error } = await supabase
      .from('mission_completions')
      .insert({
        user_id: user.id,
        mission_id: missionId,
        completed_at: today,
        xp_awarded: mission.xp,
      })
      .select()
      .single()

    // If already completed today, still return OK (idempotent)
    if (error && !error.message.includes('unique')) {
      console.error('[missions/complete]', error)
      return NextResponse.json({ error: 'DB error' }, { status: 500 })
    }

    // Award XP (non-blocking if migration_v3 not applied yet)
    if (!error) {
      try {
        await supabase.rpc('award_mission_xp', {
          p_user_id: user.id,
          p_xp: mission.xp,
        })
      } catch { /* migration_v3 not applied yet */ }
    }

    return NextResponse.json({ ok: true, xpAwarded: mission.xp })
  } catch (err) {
    console.error('[missions/complete]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
