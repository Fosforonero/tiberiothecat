import { isAdminEmail, isRoleAtLeast } from '@/lib/admin-auth'
import type { UserRole } from '@/lib/admin-auth'

export type { UserRole }

/**
 * Entitlements are the canonical source of truth for what a user can do.
 *
 * Design:
 *   - `is_premium` in the DB is BILLING state only (Stripe subscription active).
 *   - Admin identity: composite of ADMIN_EMAILS env var (Phase 1 fallback) OR DB role >= admin.
 *   - `isSuperAdmin` is derived exclusively from DB role === 'super_admin'.
 *   - `effectivePremium` = admin OR billing premium. Use this for feature gates.
 *   - This module is server-side only. Client components must use /api/me/entitlements.
 */

export interface UserEntitlements {
  isAdmin: boolean
  isSuperAdmin: boolean
  role: UserRole
  /** admin OR billing premium — use this for feature gates, not is_premium directly */
  effectivePremium: boolean
  noAds: boolean
  unlimitedNameChanges: boolean
  canAccessAdmin: boolean
  canSubmitPoll: boolean
  canManageRoles: boolean
}

export function getUserEntitlements({
  email,
  is_premium,
  role = 'user',
}: {
  email: string | null | undefined
  is_premium: boolean
  role?: UserRole
}): UserEntitlements {
  const isAdminByEmail = isAdminEmail(email)
  const isAdmin = isAdminByEmail || isRoleAtLeast(role, 'admin')
  const isSuperAdmin = role === 'super_admin'
  const effectivePremium = isAdmin || is_premium
  return {
    isAdmin,
    isSuperAdmin,
    role,
    effectivePremium,
    noAds: effectivePremium,
    unlimitedNameChanges: effectivePremium,
    canAccessAdmin: isAdmin,
    canSubmitPoll: effectivePremium,
    canManageRoles: isSuperAdmin,
  }
}

/** Fallback for unauthenticated users or error paths. */
export const ANON_ENTITLEMENTS: UserEntitlements = {
  isAdmin: false,
  isSuperAdmin: false,
  role: 'user',
  effectivePremium: false,
  noAds: false,
  unlimitedNameChanges: false,
  canAccessAdmin: false,
  canSubmitPoll: false,
  canManageRoles: false,
}
