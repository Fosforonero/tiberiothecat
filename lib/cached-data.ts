/**
 * unstable_cache wrappers for public Redis/Supabase reads.
 *
 * WHY: The Upstash Redis SDK emits fetch() calls with cache: 'no-store'.
 * Next.js propagates that to the route's Cache-Control header, overriding
 * export const revalidate on public pages. unstable_cache isolates these
 * fetches inside the Next.js Data Cache so ISR headers are applied correctly.
 *
 * Return types use plain objects (not Maps) for JSON serialisation compatibility.
 * Callers convert back to Maps with new Map(Object.entries(obj)).
 */
import { unstable_cache } from 'next/cache'
import { getDynamicScenarios, getDynamicScenariosByLocale } from './dynamic-scenarios'
import { getVotesBatch, getVotesBatchDetail } from './redis'
import { getTrendingScenarioIds24h } from './trending'
import type { DynamicScenario } from './dynamic-scenarios'

// Approved dynamic scenario list — refreshed hourly.
export const getCachedDynamicScenarios = unstable_cache(
  (): Promise<DynamicScenario[]> => getDynamicScenarios(),
  ['dynamic-scenarios'],
  { revalidate: 3600 },
)

// Locale-filtered approved scenarios — refreshed hourly.
export const getCachedDynamicScenariosByLocale = unstable_cache(
  (locale: string): Promise<DynamicScenario[]> => getDynamicScenariosByLocale(locale),
  ['dynamic-scenarios-by-locale'],
  { revalidate: 3600 },
)

// Vote totals for homepage cards — refreshed every 5 minutes.
export const getCachedVotesBatch = unstable_cache(
  async (ids: string[]): Promise<Record<string, number>> => {
    const map = await getVotesBatch(ids)
    return Object.fromEntries(map)
  },
  ['votes-batch'],
  { revalidate: 300 },
)

// Per-option vote detail for leaderboards — refreshed hourly.
export const getCachedVotesBatchDetail = unstable_cache(
  async (ids: string[]): Promise<Record<string, { a: number; b: number }>> => {
    const map = await getVotesBatchDetail(ids)
    return Object.fromEntries(map)
  },
  ['votes-batch-detail'],
  { revalidate: 3600 },
)

// Trending scenario IDs — refreshed hourly.
export const getCachedTrendingIds = unstable_cache(
  (candidateIds: string[], limit: number): Promise<string[]> =>
    getTrendingScenarioIds24h(candidateIds, limit),
  ['trending-ids'],
  { revalidate: 3600 },
)
