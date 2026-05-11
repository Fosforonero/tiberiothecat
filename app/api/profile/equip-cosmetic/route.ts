/**
 * POST /api/profile/equip-cosmetic
 *
 * Equips (or unequips) a cosmetic item — frame, glow, or name color slug.
 * Validates ownership server-side: rejects if the user does not own the
 * underlying product in user_purchases (status = 'completed').
 *
 * Body schema:
 *   { kind: 'frame', productId: 'frame_gold' | null }    // null = unequip
 *   { kind: 'glow',  productId: 'glow_fire'  | null }
 *   { kind: 'name_color', slug: 'aurora' | null }        // requires name_color_bundle owned
 *
 * Returns:
 *   200 { ok: true, equipped: { ... } }
 *   401 unauthorized
 *   400 bad request (unknown kind/value)
 *   403 not-owned (user does not own the underlying product)
 *   500 server error
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isFrameId, isGlowId, isNameColorSlug } from '@/lib/cosmetics'
import { type ProductId } from '@/lib/purchases'

export const dynamic = 'force-dynamic'

type Body =
  | { kind: 'frame';      productId: string | null }
  | { kind: 'glow';       productId: string | null }
  | { kind: 'name_color'; slug:      string | null }

function isBody(value: unknown): value is Body {
  if (typeof value !== 'object' || value === null) return false
  const v = value as { kind?: unknown }
  return v.kind === 'frame' || v.kind === 'glow' || v.kind === 'name_color'
}

export async function POST(req: NextRequest) {
  // ── Auth ──────────────────────────────────────────────────────────────
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // ── Body validation ───────────────────────────────────────────────────
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  if (!isBody(body)) {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  // ── Fetch ownership ──────────────────────────────────────────────────
  // We pull the entire owned set once, then check the relevant product(s)
  // synchronously. Cheap (a few rows) and avoids race conditions.
  const { data: purchases, error: purchasesErr } = await supabase
    .from('user_purchases')
    .select('product_id')
    .eq('user_id', user.id)
    .eq('status', 'completed')

  if (purchasesErr) {
    console.error('[equip-cosmetic] user_purchases fetch failed:', purchasesErr.code)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
  const owned = new Set<ProductId>((purchases ?? []).map(p => p.product_id as ProductId))

  // ── Per-kind validation + update payload ─────────────────────────────
  const updatePayload: Record<string, string | null> = {}

  if (body.kind === 'frame') {
    if (body.productId === null) {
      updatePayload.equipped_frame = null
    } else if (!isFrameId(body.productId)) {
      return NextResponse.json({ error: 'Unknown frame' }, { status: 400 })
    } else if (!owned.has(body.productId)) {
      return NextResponse.json({ error: 'You do not own this frame' }, { status: 403 })
    } else {
      updatePayload.equipped_frame = body.productId
    }
  }

  if (body.kind === 'glow') {
    if (body.productId === null) {
      updatePayload.equipped_glow = null
    } else if (!isGlowId(body.productId)) {
      return NextResponse.json({ error: 'Unknown glow' }, { status: 400 })
    } else if (!owned.has(body.productId)) {
      return NextResponse.json({ error: 'You do not own this glow' }, { status: 403 })
    } else {
      updatePayload.equipped_glow = body.productId
    }
  }

  if (body.kind === 'name_color') {
    if (body.slug === null) {
      updatePayload.name_color = null
    } else if (!isNameColorSlug(body.slug)) {
      return NextResponse.json({ error: 'Unknown color' }, { status: 400 })
    } else if (!owned.has('name_color_bundle')) {
      return NextResponse.json({ error: 'Name color bundle required' }, { status: 403 })
    } else {
      updatePayload.name_color = body.slug
    }
  }

  // ── Persist ──────────────────────────────────────────────────────────
  const { error: updateErr } = await supabase
    .from('profiles')
    .update(updatePayload)
    .eq('id', user.id)

  if (updateErr) {
    console.error('[equip-cosmetic] update failed:', updateErr.code)
    return NextResponse.json({ error: 'Update failed' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, equipped: updatePayload })
}
