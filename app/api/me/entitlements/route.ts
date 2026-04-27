import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUserEntitlements, ANON_ENTITLEMENTS } from '@/lib/entitlements'

export const dynamic = 'force-dynamic'

/**
 * GET /api/me/entitlements
 *
 * Server-computed entitlements for the current session.
 * Used by client components that cannot access server-only env vars directly
 * (e.g. AdSlot, SubmitPoll) to gate features without leaking ADMIN_EMAILS.
 */
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json(ANON_ENTITLEMENTS)

    const { data: profile } = await supabase
      .from('profiles')
      .select('is_premium')
      .eq('id', user.id)
      .single()

    return NextResponse.json(
      getUserEntitlements({ email: user.email, is_premium: profile?.is_premium ?? false })
    )
  } catch {
    return NextResponse.json(ANON_ENTITLEMENTS)
  }
}
