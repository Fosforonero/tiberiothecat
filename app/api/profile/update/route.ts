import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { displayName, birthYear, gender, countryCode, avatarEmoji } = body

  // Validate display name
  if (displayName !== undefined) {
    const name = String(displayName).trim()
    if (name.length < 2 || name.length > 32) {
      return NextResponse.json({ error: 'Name must be 2–32 characters' }, { status: 400 })
    }
    // Basic profanity guard (extend as needed)
    const forbidden = ['admin', 'splitvote', 'moderator']
    if (forbidden.some(w => name.toLowerCase().includes(w))) {
      return NextResponse.json({ error: 'That name is reserved' }, { status: 400 })
    }
  }

  // Fetch current profile to check name_changes count
  const { data: currentProfile } = await supabase
    .from('profiles')
    .select('display_name, name_changes')
    .eq('id', user.id)
    .single()

  // Name change logic: first set is free, subsequent changes tracked
  // name_changes column: if null (old profiles) treat as 0
  const currentChanges = currentProfile?.name_changes ?? 0
  const isFirstNameSet = !currentProfile?.display_name

  const updatePayload: Record<string, unknown> = {}

  if (displayName !== undefined) {
    updatePayload.display_name = String(displayName).trim()
    // Increment only if changing an existing name (not setting for the first time)
    if (!isFirstNameSet) {
      updatePayload.name_changes = currentChanges + 1
    } else {
      updatePayload.name_changes = 1 // Mark as "used first free change"
    }
  }

  if (birthYear !== undefined) {
    const yr = parseInt(birthYear)
    if (yr >= 1920 && yr <= 2015) updatePayload.birth_year = yr
  }

  if (gender !== undefined && ['male', 'female', 'nonbinary', 'prefer_not'].includes(gender)) {
    updatePayload.gender = gender
  }

  if (countryCode !== undefined && String(countryCode).length === 2) {
    updatePayload.country_code = String(countryCode).toUpperCase()
  }

  if (avatarEmoji !== undefined) {
    updatePayload.avatar_emoji = String(avatarEmoji)
  }

  if (Object.keys(updatePayload).length === 0) {
    return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
  }

  const { error } = await supabase
    .from('profiles')
    .update(updatePayload)
    .eq('id', user.id)

  if (error) {
    console.error('Profile update error:', error)
    return NextResponse.json({ error: 'Update failed' }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    nameChangesUsed: updatePayload.name_changes ?? currentChanges,
    firstNameSet: isFirstNameSet,
  })
}
