import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'

/**
 * Returns the set of dilemma IDs the current viewer has already voted on.
 *
 * - Logged-in users: read from Supabase `dilemma_votes` (cross-device).
 * - Anonymous viewers: parse `sv_voted_<id>` cookies from this device.
 *
 * Server Component / route handler only — uses next/headers cookies().
 * Safe to call on `force-dynamic` routes; do NOT use on ISR-cached routes
 * (would defeat caching). For ISR routes, resolve voted IDs client-side
 * via `getServerVotedIds()` in lib/client-voted-ids.ts.
 */
export async function getServerVotedIds(): Promise<Set<string>> {
  const votedIds = new Set<string>()
  let userDetected = false
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      userDetected = true
      const { data } = await supabase
        .from('dilemma_votes')
        .select('dilemma_id')
        .eq('user_id', user.id)
      if (data) data.forEach((r: { dilemma_id: string }) => votedIds.add(r.dilemma_id))
    }
  } catch {
    // Supabase unavailable — fall through to cookies
  }
  if (!userDetected) {
    const cookieStore = await cookies()
    for (const c of cookieStore.getAll()) {
      if (c.name.startsWith('sv_voted_')) {
        votedIds.add(c.name.slice('sv_voted_'.length))
      }
    }
  }
  return votedIds
}

/**
 * Partition a scenario list so unvoted items come first, voted items go
 * to the end, both halves preserving their relative input order.
 *
 * Pure — safe to call on the client too. The home page composes its
 * "Trending", "Most Voted", and "Latest" sections from the global
 * catalog without knowing the viewer; this helper re-orders the result
 * once the viewer's voted IDs are known. Approach 3 of the
 * COSMETIC-PARITY-01 audit: position-0 is always a fresh dilemma when
 * the section contains any.
 */
export function freshFirst<T extends { id: string }>(
  items: T[],
  votedIds: Set<string>,
): T[] {
  if (votedIds.size === 0) return items
  const unvoted: T[] = []
  const voted: T[] = []
  for (const item of items) {
    if (votedIds.has(item.id)) voted.push(item)
    else unvoted.push(item)
  }
  return [...unvoted, ...voted]
}
