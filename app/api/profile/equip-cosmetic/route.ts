import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { COSMETIC_MAP, isCosmeticItemId } from '@/lib/cosmetics-store'
import { isNameColorSlug } from '@/lib/cosmetics'
import { getUserEntitlements } from '@/lib/entitlements'
import type { UserRole } from '@/lib/admin-auth'

/** Re-validate every server-rendered surface that reads cosmetic state. */
function invalidateCosmeticSurfaces(userId: string): void {
  revalidatePath('/dashboard')
  revalidatePath('/profile')
  revalidatePath(`/u/${userId}`)
}

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { itemId, nameColor, unequip } = body as {
    itemId?: string
    nameColor?: string
    /** Set to "frame" or "glow" to clear that cosmetic slot (no ownership check). */
    unequip?: 'frame' | 'glow'
  }

  let admin: ReturnType<typeof createAdminClient>
  try {
    admin = createAdminClient()
  } catch {
    return NextResponse.json({ error: 'Server config error' }, { status: 500 })
  }

  const { data: profile } = await admin
    .from('profiles')
    .select('is_premium, role')
    .eq('id', user.id)
    .single()

  const entitlements = getUserEntitlements({
    email: user.email,
    is_premium: profile?.is_premium ?? false,
    role: (profile?.role ?? 'user') as UserRole,
  })

  // ── unequip frame/glow (clears the cosmetic slot, no ownership check) ───────
  // Users always retain the right to remove an equipped cosmetic — no purchase
  // gate makes sense here, only auth.
  if (unequip === 'frame' || unequip === 'glow') {
    const column = unequip === 'frame' ? 'equipped_frame' : 'equipped_glow'
    const { error } = await admin
      .from('profiles')
      .update({ [column]: null })
      .eq('id', user.id)

    if (error) {
      console.error('[equip-cosmetic] unequip update failed:', error)
      return NextResponse.json({ error: 'DB update failed' }, { status: 500 })
    }

    invalidateCosmeticSurfaces(user.id)
    return NextResponse.json({ success: true, unequipped: unequip })
  }

  // ── name_color selection (uses owned bundle, picks a specific color) ─────────
  if (nameColor !== undefined) {
    // Validate against the canonical allowlist before doing any DB work.
    // Without this an attacker (or a stale client) could write arbitrary
    // strings into profiles.name_color and break the renderer (worst case
    // injecting Tailwind class fragments that ship in the HTML).
    if (typeof nameColor !== 'string' || !isNameColorSlug(nameColor)) {
      return NextResponse.json({ error: 'Invalid name color' }, { status: 400 })
    }

    let ownsNameColorBundle = entitlements.isAdmin
    if (!ownsNameColorBundle) {
      const { data: bundle } = await admin
        .from('user_purchases')
        .select('id')
        .eq('user_id', user.id)
        .eq('product_id', 'name_color_bundle')
        .eq('status', 'completed')
        .maybeSingle()
      ownsNameColorBundle = !!bundle
    }

    if (!ownsNameColorBundle) {
      return NextResponse.json({ error: 'Name Color Bundle not owned' }, { status: 403 })
    }

    const { error } = await admin
      .from('profiles')
      .update({ name_color: nameColor })
      .eq('id', user.id)

    if (error) {
      console.error('[equip-cosmetic] name_color update failed:', error)
      return NextResponse.json({ error: 'DB update failed' }, { status: 500 })
    }

    invalidateCosmeticSurfaces(user.id)
    return NextResponse.json({ success: true, nameColor })
  }

  // ── frame / glow equip ───────────────────────────────────────────────────────
  if (!itemId || !isCosmeticItemId(itemId)) {
    return NextResponse.json({ error: 'Invalid item ID' }, { status: 400 })
  }

  const item = COSMETIC_MAP[itemId]

  if (item.category !== 'frame' && item.category !== 'glow') {
    return NextResponse.json({ error: 'Use equip-pixie for pixie skins' }, { status: 400 })
  }

  let ownsItem = entitlements.isAdmin
  if (!ownsItem) {
    const { data: purchase } = await admin
      .from('user_purchases')
      .select('id')
      .eq('user_id', user.id)
      .eq('product_id', itemId)
      .eq('status', 'completed')
      .maybeSingle()
    ownsItem = !!purchase
  }

  if (!ownsItem) {
    return NextResponse.json({ error: 'Item not owned' }, { status: 403 })
  }

  const column = item.category === 'frame' ? 'equipped_frame' : 'equipped_glow'

  const { error } = await admin
    .from('profiles')
    .update({ [column]: itemId })
    .eq('id', user.id)

  if (error) {
    console.error('[equip-cosmetic] DB update failed:', error)
    return NextResponse.json({ error: 'DB update failed' }, { status: 500 })
  }

  console.log(`✅ Equip [${item.category}]: user=${user.id.slice(0, 8)} → "${itemId}"`)
  invalidateCosmeticSurfaces(user.id)
  return NextResponse.json({ success: true, equipped: itemId, category: item.category })
}
