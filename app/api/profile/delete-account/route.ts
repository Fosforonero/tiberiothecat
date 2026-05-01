import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function DELETE(req: NextRequest) {
  // Require JSON Content-Type — forces a CORS preflight on cross-origin requests,
  // preventing CSRF via browser form submissions (which use application/x-www-form-urlencoded).
  const ct = req.headers.get('content-type') ?? ''
  if (!ct.includes('application/json')) {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 })
  }
  await req.json().catch(() => null)

  // supabase.auth.getUser() validates the JWT with the Supabase Auth server on every call.
  // We must NOT use getSession() here — it reads the cookie locally and cannot detect
  // tokens that Supabase has already revoked. Mandatory for any destructive operation.
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Block deletion if user has an active Premium subscription — they must cancel first
  // so Stripe's subscription lifecycle is not bypassed.
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_premium, subscription_status, stripe_subscription_id')
    .eq('id', user.id)
    .single()

  const hasActiveSubscription =
    profile?.is_premium === true &&
    profile?.subscription_status === 'active' &&
    Boolean(profile?.stripe_subscription_id)

  if (hasActiveSubscription) {
    return NextResponse.json({ error: 'active_subscription' }, { status: 409 })
  }

  const admin = createAdminClient()

  // ── Pre-deletion: handle FK references without ON DELETE CASCADE ──────────────
  //
  // organizations.owner_id references auth.users with no cascade — delete owned orgs
  // first so their org_members and promoted_polls cascade automatically.
  // user_polls FK cascade behavior is unconfirmed — delete explicitly to be safe.
  //
  // These steps run before deleteUser so FK violations cannot block auth deletion.
  await admin.from('organizations').delete().eq('owner_id', user.id)
  await admin.from('user_polls').delete().eq('user_id', user.id)

  // ── Delete auth user (cascades all remaining FK relations) ────────────────────
  //
  // Deleting auth.users cascades to:
  //   profiles, dilemma_votes, user_badges, mission_completions, user_events,
  //   role_audit_log.target_id, org_members (orgs user did not own).
  // dilemma_feedback.user_id is SET NULL automatically — anonymous aggregate rows
  // are preserved for platform integrity (vote quality signals).
  const { error } = await admin.auth.admin.deleteUser(user.id)
  if (error) {
    console.error('[delete-account] deleteUser failed:', error.message)
    return NextResponse.json({ error: 'Deletion failed' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
