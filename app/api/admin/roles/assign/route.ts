import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/admin-guard'
import { ASSIGNABLE_ROLES } from '@/lib/admin-auth'
import type { UserRole } from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'

/**
 * POST /api/admin/roles/assign
 * Body: { targetUserId: string, newRole: UserRole, reason?: string }
 *
 * Requires super_admin (canManageRoles). Cannot assign 'super_admin' via API — only via SQL migration.
 * Writes an audit log entry for every successful role change; returns a warning if audit write fails.
 */
export async function POST(req: Request) {
  try {
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth

    if (!auth.entitlements.canManageRoles) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json() as { targetUserId?: string; newRole?: string; reason?: string }
    const { targetUserId, newRole, reason } = body

    if (!targetUserId || typeof targetUserId !== 'string') {
      return NextResponse.json({ error: 'Missing targetUserId' }, { status: 400 })
    }

    if (!newRole || !(ASSIGNABLE_ROLES as string[]).includes(newRole)) {
      return NextResponse.json(
        { error: `Invalid role. Assignable roles: ${ASSIGNABLE_ROLES.join(', ')}` },
        { status: 400 },
      )
    }

    // Prevent self-demotion via API (super_admin can use SQL if needed)
    if (targetUserId === auth.userId) {
      return NextResponse.json({ error: 'Cannot change your own role via API' }, { status: 400 })
    }

    const admin = createAdminClient()

    const { data: target, error: fetchErr } = await admin
      .from('profiles')
      .select('id, role')
      .eq('id', targetUserId)
      .single()

    if (fetchErr || !target) {
      return NextResponse.json({ error: 'Target user not found' }, { status: 404 })
    }

    const oldRole = target.role as UserRole

    if (oldRole === newRole) {
      return NextResponse.json({ message: 'No change', role: oldRole })
    }

    const { error: updateErr } = await admin
      .from('profiles')
      .update({ role: newRole })
      .eq('id', targetUserId)

    if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 })

    const { error: auditErr } = await admin.from('role_audit_log').insert({
      actor_id: auth.userId,
      target_id: targetUserId,
      old_role: oldRole,
      new_role: newRole,
      reason: reason ?? null,
    })

    if (auditErr) {
      return NextResponse.json({
        success: true, oldRole, newRole,
        auditWarning: 'Role updated but audit log write failed',
      })
    }

    return NextResponse.json({ success: true, oldRole, newRole })
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
