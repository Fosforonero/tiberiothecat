import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getUserEntitlements } from '@/lib/entitlements'
import type { UserEntitlements } from '@/lib/entitlements'
import type { UserRole } from '@/lib/admin-auth'

export type AdminContext = {
  userId: string
  email: string
  entitlements: UserEntitlements
}

/**
 * Phase-1 admin gate: ADMIN_EMAILS env var (fallback) OR DB role >= admin.
 * Returns AdminContext if authorized, NextResponse (401/403) if not.
 *
 * Usage in API routes:
 *   const auth = await requireAdmin()
 *   if (auth instanceof NextResponse) return auth
 */
export async function requireAdmin(): Promise<AdminContext | NextResponse> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Use admin client so auth check is never blocked by RLS SELECT policies on profiles
  const adminDb = createAdminClient()
  const { data: profile } = await adminDb
    .from('profiles')
    .select('is_premium, role')
    .eq('id', user.id)
    .single()

  const entitlements = getUserEntitlements({
    email: user.email,
    is_premium: profile?.is_premium ?? false,
    role: (profile?.role ?? 'user') as UserRole,
  })

  if (!entitlements.canAccessAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  return { userId: user.id, email: user.email, entitlements }
}
