/**
 * GET /api/me/voted-ids
 * Returns the list of dilemma IDs the authenticated user has voted on.
 * Read-only — no DB writes, no vote counting, no dedup side-effects.
 * Anonymous / unauthenticated callers receive { ids: [] }.
 */
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ ids: [] })
    }

    const { data, error } = await supabase
      .from('dilemma_votes')
      .select('dilemma_id')
      .eq('user_id', user.id)

    if (error) {
      console.error('[voted-ids]', error)
      return NextResponse.json({ ids: [] })
    }

    const ids = (data ?? []).map((r: { dilemma_id: string }) => r.dilemma_id)
    return NextResponse.json({ ids })
  } catch (err) {
    console.error('[voted-ids]', err)
    return NextResponse.json({ ids: [] })
  }
}
