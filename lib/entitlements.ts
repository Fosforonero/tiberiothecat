import { isAdminEmail } from '@/lib/admin-auth'

/**
 * Entitlements are the canonical source of truth for what a user can do.
 *
 * Design:
 *   - `is_premium` in the DB is BILLING state only (Stripe subscription active).
 *   - Admin identity is derived from ADMIN_EMAILS env var — never from DB.
 *   - `effectivePremium` = admin OR billing premium. Use this for feature gates.
 *   - This module is server-side only (reads process.env via isAdminEmail).
 *     Client components must use /api/me/entitlements to get these values.
 */

export interface UserEntitlements {
  isAdmin: boolean
  /** admin OR billing premium — use this for feature gates, not is_premium directly */
  effectivePremium: boolean
  noAds: boolean
  unlimitedNameChanges: boolean
  canAccessAdmin: boolean
  canSubmitPoll: boolean
}

export function getUserEntitlements({
  email,
  is_premium,
}: {
  email: string | null | undefined
  is_premium: boolean
}): UserEntitlements {
  const isAdmin = isAdminEmail(email)
  const effectivePremium = isAdmin || is_premium
  return {
    isAdmin,
    effectivePremium,
    noAds: effectivePremium,
    unlimitedNameChanges: effectivePremium,
    canAccessAdmin: isAdmin,
    canSubmitPoll: effectivePremium,
  }
}

/** Fallback for unauthenticated users or error paths. */
export const ANON_ENTITLEMENTS: UserEntitlements = {
  isAdmin: false,
  effectivePremium: false,
  noAds: false,
  unlimitedNameChanges: false,
  canAccessAdmin: false,
  canSubmitPoll: false,
}
