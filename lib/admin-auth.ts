// Set ADMIN_EMAILS in Vercel env as a comma-separated list, e.g. "you@example.com,other@example.com"
export const ADMIN_EMAILS: string[] =
  (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map(e => e.trim())
    .filter(Boolean)

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false
  return ADMIN_EMAILS.includes(email)
}

// ── Role hierarchy ────────────────────────────────────────────────────────────

export type UserRole = 'user' | 'creator' | 'moderator' | 'admin' | 'super_admin'

export const ROLE_HIERARCHY: Record<UserRole, number> = {
  user: 0, creator: 1, moderator: 2, admin: 3, super_admin: 4,
}

export function isRoleAtLeast(role: UserRole, minimum: UserRole): boolean {
  return ROLE_HIERARCHY[role] >= ROLE_HIERARCHY[minimum]
}

export const ASSIGNABLE_ROLES: UserRole[] = ['user', 'moderator', 'admin']
