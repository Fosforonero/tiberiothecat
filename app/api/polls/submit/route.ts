import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getUserEntitlements } from '@/lib/entitlements'
import type { UserRole } from '@/lib/admin-auth'

const VALID_CATEGORIES = new Set([
  'morality', 'technology', 'society', 'relationships', 'survival', 'philosophy',
])

// Reject ASCII control characters (0x00–0x1F, 0x7F)
const CONTROL_CHAR_RE = /[\x00-\x1F\x7F]/

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Server-side entitlement check — never trust client
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_premium, role')
      .eq('id', user.id)
      .single()

    const ents = getUserEntitlements({
      email: user.email,
      is_premium: profile?.is_premium ?? false,
      role: (profile?.role ?? 'user') as UserRole,
    })
    if (!ents.canSubmitPoll) {
      return NextResponse.json({ error: 'Premium required to submit polls' }, { status: 403 })
    }

    // Parse body
    let body: unknown
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }
    if (typeof body !== 'object' || body === null) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    const raw = body as Record<string, unknown>

    // Validate question
    if (typeof raw.question !== 'string') {
      return NextResponse.json({ error: 'question required' }, { status: 400 })
    }
    const question = raw.question.trim()
    if (question.length < 10 || question.length > 300) {
      return NextResponse.json({ error: 'question must be 10–300 characters' }, { status: 400 })
    }
    if (CONTROL_CHAR_RE.test(question)) {
      return NextResponse.json({ error: 'Invalid characters in question' }, { status: 400 })
    }

    // Validate option_a
    if (typeof raw.option_a !== 'string') {
      return NextResponse.json({ error: 'option_a required' }, { status: 400 })
    }
    const option_a = raw.option_a.trim()
    if (option_a.length < 2 || option_a.length > 150) {
      return NextResponse.json({ error: 'option_a must be 2–150 characters' }, { status: 400 })
    }
    if (CONTROL_CHAR_RE.test(option_a)) {
      return NextResponse.json({ error: 'Invalid characters in option_a' }, { status: 400 })
    }

    // Validate option_b
    if (typeof raw.option_b !== 'string') {
      return NextResponse.json({ error: 'option_b required' }, { status: 400 })
    }
    const option_b = raw.option_b.trim()
    if (option_b.length < 2 || option_b.length > 150) {
      return NextResponse.json({ error: 'option_b must be 2–150 characters' }, { status: 400 })
    }
    if (CONTROL_CHAR_RE.test(option_b)) {
      return NextResponse.json({ error: 'Invalid characters in option_b' }, { status: 400 })
    }

    // Validate category against allowlist
    if (typeof raw.category !== 'string' || !VALID_CATEGORIES.has(raw.category)) {
      return NextResponse.json({ error: 'Invalid category' }, { status: 400 })
    }
    const category = raw.category

    // Validate emoji — optional, safe default, loose length bound
    let emoji = '🤔'
    if (typeof raw.emoji === 'string') {
      const trimmed = raw.emoji.trim()
      if (trimmed.length > 0 && trimmed.length <= 8 && !CONTROL_CHAR_RE.test(trimmed)) {
        emoji = trimmed
      }
    }

    // Insert using admin client — bypasses RLS, enforces status=pending and
    // user_id from the verified auth session (never from the request body)
    const admin = createAdminClient()
    const { error: insertError } = await admin.from('user_polls').insert({
      user_id: user.id,
      question,
      option_a,
      option_b,
      category,
      emoji,
      status: 'pending',
    })

    if (insertError) {
      console.error('[polls/submit] insert error:', insertError.code)
      return NextResponse.json({ error: 'Failed to submit poll' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[polls/submit] unexpected error:', err instanceof Error ? err.message : String(err))
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
