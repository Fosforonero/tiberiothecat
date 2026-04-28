/**
 * Validates a user-supplied redirect target to a safe internal path.
 *
 * Blocks: absolute URLs (https://...), protocol-relative (//...), backslash paths,
 *         redirects into /api/* (prevents auth bypass via API routes)
 * Allows: paths starting with / (but not //)
 * Falls back to `fallback` if invalid.
 */
export function safeRedirect(
  input: string | null | undefined,
  fallback = '/dashboard',
): string {
  if (!input) return fallback
  if (
    input.startsWith('/') &&
    !input.startsWith('//') &&
    !input.includes('\\') &&
    !input.startsWith('/api/')
  ) {
    return input
  }
  return fallback
}
