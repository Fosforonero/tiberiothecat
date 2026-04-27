import { getVotesBatch } from './redis'

// In-process cache: avoids a Supabase round-trip on every page request within the same process
let _cache: { key: string; ids: string[]; expiresAt: number } | null = null
const CACHE_TTL_MS = 120_000 // 2 minutes

/**
 * Returns up to `limit` scenario IDs ranked by recent votes.
 * Window: today + yesterday (two calendar days, not a rolling 24h window).
 * Primary source: vote_daily_stats. Fallback: Redis all-time counts. Last resort: first N IDs.
 */
export async function getTrendingScenarioIds24h(
  candidateIds: string[],
  limit = 6,
): Promise<string[]> {
  if (candidateIds.length === 0) return []

  const cacheKey = `${limit}:${candidateIds.slice(0, 10).join(',')}`
  if (_cache && _cache.key === cacheKey && _cache.expiresAt > Date.now()) {
    return _cache.ids
  }

  try {
    const { createAdminClient } = await import('./supabase/admin')
    const admin = createAdminClient()
    const today = new Date().toISOString().slice(0, 10)
    const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10)

    const { data, error } = await admin
      .from('vote_daily_stats')
      .select('dilemma_id, total_count')
      .in('dilemma_id', candidateIds.slice(0, 200))
      .gte('date', yesterday)
      .lte('date', today)

    if (!error && data && data.length > 0) {
      const aggregated = new Map<string, number>()
      for (const row of data as { dilemma_id: string; total_count: number }[]) {
        aggregated.set(row.dilemma_id, (aggregated.get(row.dilemma_id) ?? 0) + row.total_count)
      }
      const topIds = [...aggregated.entries()]
        .filter(([, count]) => count > 0)
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([id]) => id)

      if (topIds.length >= Math.min(2, limit)) {
        _cache = { key: cacheKey, ids: topIds, expiresAt: Date.now() + CACHE_TTL_MS }
        return topIds
      }
    }
  } catch {
    // Admin client unavailable or service role key missing
  }

  // Fallback: all-time Redis vote counts
  try {
    const voteMap = await getVotesBatch(candidateIds.slice(0, 100))
    const sorted = [...candidateIds]
      .sort((a, b) => (voteMap.get(b) ?? 0) - (voteMap.get(a) ?? 0))
      .filter(id => (voteMap.get(id) ?? 0) > 0)
      .slice(0, limit)
    if (sorted.length > 0) return sorted
  } catch {
    // Redis unavailable
  }

  return candidateIds.slice(0, limit)
}
