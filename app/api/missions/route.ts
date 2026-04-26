import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

/** GET /api/missions — returns today's completed mission IDs for the logged-in user */
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ completed: [] })

    const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD

    const { data } = await supabase
      .from('mission_completions')
      .select('mission_id')
      .eq('user_id', user.id)
      .eq('completed_at', today)

    const completed = (data ?? []).map((r: { mission_id: string }) => r.mission_id)
    return NextResponse.json({ completed })
  } catch {
    return NextResponse.json({ completed: [] })
  }
}
