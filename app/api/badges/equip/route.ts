import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { badgeId, equip } = await request.json()

    if (typeof badgeId !== 'string' || typeof equip !== 'boolean') {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    if (equip) {
      // Unequip all badges first, then equip the selected one
      await supabase
        .from('user_badges')
        .update({ is_equipped: false })
        .eq('user_id', user.id)

      await supabase
        .from('user_badges')
        .update({ is_equipped: true })
        .eq('user_id', user.id)
        .eq('badge_id', badgeId)

      await supabase
        .from('profiles')
        .update({ equipped_badge: badgeId })
        .eq('id', user.id)
    } else {
      // Unequip this badge
      await supabase
        .from('user_badges')
        .update({ is_equipped: false })
        .eq('user_id', user.id)
        .eq('badge_id', badgeId)

      await supabase
        .from('profiles')
        .update({ equipped_badge: null })
        .eq('id', user.id)
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[equip-badge]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
