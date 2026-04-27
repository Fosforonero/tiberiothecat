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
