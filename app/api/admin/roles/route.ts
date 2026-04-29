import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/admin-guard'
import type { UserRole } from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/roles
 *
 * Returns all profiles with role != 'user', ordered by role desc.
 * Requires super_admin entitlement (canManageRoles).
 */
export async function GET() {
  try {
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth

    if (!auth.entitlements.canManageRoles) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const admin = createAdminClient()
    const { data: privilegedUsers, error } = await admin
      .from('profiles')
      .select('id, display_name, role, created_at')
      .neq('role', 'user')
      .order('role', { ascending: false })
      .order('created_at', { ascending: true })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Fetch emails from auth.users for display
    const ids = (privilegedUsers ?? []).map(p => p.id)
    const emailMap: Record<string, string> = {}
    if (ids.length > 0) {
      const { data: authUsers } = await admin.auth.admin.listUsers({ perPage: 200 })
      for (const au of authUsers?.users ?? []) {
        if (ids.includes(au.id)) emailMap[au.id] = au.email ?? ''
      }
    }

    const result = (privilegedUsers ?? []).map(p => ({
      id: p.id,
      display_name: p.display_name,
      email: emailMap[p.id] ?? '',
      role: p.role as UserRole,
      created_at: p.created_at,
    }))

    return NextResponse.json({ users: result })
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
