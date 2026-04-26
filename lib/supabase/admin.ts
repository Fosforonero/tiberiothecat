import { createClient } from '@supabase/supabase-js'

/**
 * Supabase admin client — uses the service role key, bypasses RLS.
 * ONLY use in server components / API routes, never in client code.
 *
 * Required Vercel env vars:
 *   NEXT_PUBLIC_SUPABASE_URL      — project URL (public, safe to expose)
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY — anon/public key (public, safe to expose)
 *   SUPABASE_SERVICE_ROLE_KEY     — service role key (SECRET — never expose to browser)
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    const missing = [
      !url && 'NEXT_PUBLIC_SUPABASE_URL',
      !key && 'SUPABASE_SERVICE_ROLE_KEY',
    ].filter(Boolean).join(', ')
    throw new Error(
      `[admin] Missing required Vercel env var(s): ${missing}. ` +
      'Add them at: Vercel Dashboard → Project → Settings → Environment Variables'
    )
  }

  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

/**
 * Safe variant — returns { client, error } instead of throwing.
 * Use in contexts where a missing key should degrade gracefully
 * instead of crashing a server component.
 */
export function tryCreateAdminClient():
  | { client: ReturnType<typeof createAdminClient>; error: null }
  | { client: null; error: string }
{
  try {
    const client = createAdminClient()
    return { client, error: null }
  } catch (err) {
    return { client: null, error: err instanceof Error ? err.message : String(err) }
  }
}
