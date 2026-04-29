import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUserEntitlements } from '@/lib/entitlements'
import type { UserRole } from '@/lib/admin-auth'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { displayName, birthYear, gender, countryCode, avatarEmoji } = body

  if (displayName !== undefined) {
    const name = String(displayName).trim()
    if (name.length < 2 || name.length > 32) {
      return NextResponse.json({ error: 'Name must be 2–32 characters' }, { status: 400 })
    }
    // Reject control characters (null bytes, newlines, etc.)
    if (/[\x00-\x1f\x7f]/.test(name)) {
      return NextResponse.json({ error: 'Name contains invalid characters' }, { status: 400 })
    }
    const forbidden = ['admin', 'splitvote', 'moderator']
    if (forbidden.some(w => name.toLowerCase().includes(w))) {
      return NextResponse.json({ error: 'That name is reserved' }, { status: 400 })
    }
  }

  const { data: currentProfile } = await supabase
    .from('profiles')
    .select('display_name, name_changes, is_premium, role')
    .eq('id', user.id)
    .single()

  const ents = getUserEntitlements({
    email: user.email,
    is_premium: currentProfile?.is_premium ?? false,
    role: (currentProfile?.role ?? 'user') as UserRole,
  })

  const currentChanges = currentProfile?.name_changes ?? 0

  const updatePayload: Record<string, unknown> = {}

  if (displayName !== undefined) {
    const newName = String(displayName).trim()
    const currentName = (currentProfile?.display_name ?? '').trim()
    const nameChanged = newName !== currentName

    if (!nameChanged) {
      // Saving other profile fields should not consume a rename or trigger Stripe.
    } else if (ents.isAdmin) {
      // Admin: always allowed, name_changes is not consumed
      updatePayload.display_name = newName
    } else if (ents.effectivePremium) {
      // Premium (billing): unlimited renames, track count
      updatePayload.display_name = newName
      updatePayload.name_changes = currentChanges + 1
    } else if (currentChanges === 0) {
      // Free user: one free rename
      updatePayload.display_name = newName
      updatePayload.name_changes = 1
    } else {
      // Free user exhausted free rename — Stripe required
      return NextResponse.json(
        { error: 'paid_required', message: 'Name change costs €0.99 — redirecting to payment.' },
        { status: 402 }
      )
    }
  }

  if (birthYear !== undefined) {
    const yr = parseInt(birthYear)
    if (yr >= 1920 && yr <= 2015) updatePayload.birth_year = yr
  }

  if (gender !== undefined && ['male', 'female', 'non_binary', 'prefer_not'].includes(gender)) {
    updatePayload.gender = gender
  }

  if (countryCode !== undefined && /^[A-Z]{2}$/.test(String(countryCode).toUpperCase())) {
    updatePayload.country_code = String(countryCode).toUpperCase()
  }

  if (avatarEmoji !== undefined) {
    const emoji = String(avatarEmoji)
    // Cap to 8 chars — allows multi-codepoint emoji (flags, ZWJ sequences) while blocking abuse
    if (emoji.length <= 8) {
      updatePayload.avatar_emoji = emoji
    }
  }

  if (Object.keys(updatePayload).length === 0) {
    return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
  }

  const { error } = await supabase
    .from('profiles')
    .update(updatePayload)
    .eq('id', user.id)

  if (error) {
    console.error('Profile update error:', (error as { code?: string }).code ?? 'db_error')
    return NextResponse.json({ error: 'Update failed' }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    nameChangesUsed: updatePayload.name_changes ?? currentChanges,
  })
}
