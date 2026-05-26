/**
 * Catalog helpers for /moral-dilemmas + /it/dilemmi-morali.
 *
 * Pure functions used by the catalog server component to unify, filter,
 * and sort the merged static + dynamic dilemma corpus.
 *
 * Design contract:
 *   - Static wins on ID collision with dynamic (same pattern as home + /category)
 *   - Lifestyle items are included in the catalog with a flag; UI shows a badge
 *   - Sort + filter logic is exposed for both server pre-compute and client-side
 *     re-evaluation when filter/sort state changes
 */

import type { Scenario, Category } from './scenarios'
import type { DynamicScenario } from './dynamic-scenarios'

export type SortMode = 'popular' | 'fresh' | 'divisive'
export const SORT_MODES: SortMode[] = ['popular', 'fresh', 'divisive']

export type VoteState = 'all' | 'unvoted' | 'voted'
export const VOTE_STATES: VoteState[] = ['all', 'unvoted', 'voted']

export const DIVISIVE_MIN_VOTES = 50

// OKLCH hue per category for the disciplined-neon dot in chips + cards.
// Distances ≥ 25° between adjacent categories so they remain distinguishable
// at a glance (per HANDOFF "regola d'oro").
export const CATEGORY_HUE: Record<Category, number> = {
  morality:      45,
  survival:      25,
  loyalty:       90,
  justice:       0,
  freedom:       150,
  technology:    200,
  society:       280,
  relationships: 330,
  lifestyle:     60,
}

// IT slug ↔ category key mapping. The catalog URL on IT must use Italian
// slugs (HANDOFF: "Slug categoria localizzati"). EN slugs == category keys.
export const IT_CATEGORY_SLUG: Record<Category, string> = {
  morality:      'moralita',
  survival:      'sopravvivenza',
  loyalty:       'lealta',
  justice:       'giustizia',
  freedom:       'liberta',
  technology:    'tecnologia',
  society:       'societa',
  relationships: 'relazioni',
  lifestyle:     'stile-di-vita',
}

const IT_SLUG_TO_CATEGORY: Record<string, Category> = Object.fromEntries(
  (Object.entries(IT_CATEGORY_SLUG) as Array<[Category, string]>).map(([k, v]) => [v, k]),
)

export function categoryFromSlug(slug: string | null | undefined, locale: 'en' | 'it'): Category | 'all' {
  if (!slug || slug === 'all') return 'all'
  if (locale === 'it') return IT_SLUG_TO_CATEGORY[slug] ?? 'all'
  // EN uses raw category keys as slug.
  if (slug in CATEGORY_HUE) return slug as Category
  return 'all'
}

export function slugFromCategory(category: Category | 'all', locale: 'en' | 'it'): string {
  if (category === 'all') return 'all'
  return locale === 'it' ? IT_CATEGORY_SLUG[category] : category
}

export interface CatalogItem {
  id:          string
  question:    string
  optionA:     string
  optionB:     string
  emoji:       string
  category:    Category
  locale:      'en' | 'it'
  isDynamic:   boolean
  isLifestyle: boolean
  freshnessTs: number   // epoch ms; 0 for static
}

export interface VoteDetail { a: number; b: number }

function isLifestyle(category: Category, dilemmaStyle?: 'moral' | 'lifestyle'): boolean {
  if (dilemmaStyle === 'lifestyle') return true
  if (dilemmaStyle === 'moral') return false
  return category === 'lifestyle'
}

function freshnessForDynamic(d: DynamicScenario): number {
  const raw = d.approvedAt ?? d.generatedAt
  if (!raw) return 0
  const ts = Date.parse(raw)
  return Number.isNaN(ts) ? 0 : ts
}

/**
 * Unify static + dynamic into a single CatalogItem[] for the given locale.
 * Static wins on ID collision (dynamic with same id is dropped — matches
 * the dedup pattern used by app/page.tsx and app/category/[category]).
 *
 * Dynamic order is preserved (newest-first as stored in Redis); static
 * order is the source-file order from lib/scenarios.ts.
 */
export function buildCatalogItems(
  staticArr: Scenario[],
  dynamicArr: DynamicScenario[],
  locale: 'en' | 'it',
): CatalogItem[] {
  const staticIds = new Set(staticArr.map(s => s.id))
  const uniqueDynamic = dynamicArr.filter(d => !staticIds.has(d.id))

  const dynamicItems: CatalogItem[] = uniqueDynamic.map(d => ({
    id:          d.id,
    question:    d.question,
    optionA:     d.optionA,
    optionB:     d.optionB,
    emoji:       d.emoji,
    category:    d.category as Category,
    locale,
    isDynamic:   true,
    isLifestyle: isLifestyle(d.category as Category, d.dilemmaStyle),
    freshnessTs: freshnessForDynamic(d),
  }))

  const staticItems: CatalogItem[] = staticArr.map(s => ({
    id:          s.id,
    question:    s.question,
    optionA:     s.optionA,
    optionB:     s.optionB,
    emoji:       s.emoji,
    category:    s.category,
    locale,
    isDynamic:   false,
    isLifestyle: isLifestyle(s.category),
    freshnessTs: 0,
  }))

  return [...dynamicItems, ...staticItems]
}

/**
 * Filter the catalog by a single category. 'all' is a no-op.
 */
export function filterCatalog(items: CatalogItem[], category: Category | 'all'): CatalogItem[] {
  if (category === 'all') return items
  return items.filter(i => i.category === category)
}

/**
 * Sort the catalog by the chosen mode.
 *
 * - popular: voteMap DESC → freshnessTs DESC → id ASC
 * - fresh:   freshnessTs DESC → voteMap DESC → id ASC
 *            (static items, with freshnessTs=0, fall to the bottom)
 * - divisive: only items with >= DIVISIVE_MIN_VOTES total votes are kept;
 *             sorted by |0.5 - a/(a+b)| ASC (closer to 50/50 = more divisive),
 *             tiebreak by total votes DESC, then id ASC
 */
export function sortCatalog(
  items: CatalogItem[],
  mode: SortMode,
  voteMap: ReadonlyMap<string, number>,
  voteDetailMap?: ReadonlyMap<string, VoteDetail>,
): CatalogItem[] {
  const votes = (id: string) => voteMap.get(id) ?? 0

  if (mode === 'popular') {
    return [...items].sort((x, y) => {
      const dv = votes(y.id) - votes(x.id)
      if (dv !== 0) return dv
      const df = y.freshnessTs - x.freshnessTs
      if (df !== 0) return df
      return x.id.localeCompare(y.id)
    })
  }

  if (mode === 'fresh') {
    return [...items].sort((x, y) => {
      const df = y.freshnessTs - x.freshnessTs
      if (df !== 0) return df
      const dv = votes(y.id) - votes(x.id)
      if (dv !== 0) return dv
      return x.id.localeCompare(y.id)
    })
  }

  // divisive
  const detail = voteDetailMap ?? new Map<string, VoteDetail>()
  const eligible = items.filter(i => {
    const d = detail.get(i.id)
    if (!d) return false
    return d.a + d.b >= DIVISIVE_MIN_VOTES
  })
  return eligible.sort((x, y) => {
    const dx = detail.get(x.id)!
    const dy = detail.get(y.id)!
    const tx = dx.a + dx.b
    const ty = dy.a + dy.b
    const sx = Math.abs(0.5 - dx.a / tx)
    const sy = Math.abs(0.5 - dy.a / ty)
    if (sx !== sy) return sx - sy
    if (tx !== ty) return ty - tx
    return x.id.localeCompare(y.id)
  })
}

/**
 * Compute per-category counts for the unfiltered catalog. Returned as a
 * Map so the caller can render the "(N)" suffix on each chip and the
 * "All ({total})" pseudo-category. Lifestyle is included as a regular
 * category — UI decides whether to badge it.
 */
export function categoryCounts(items: CatalogItem[]): Map<Category | 'all', number> {
  const counts = new Map<Category | 'all', number>()
  counts.set('all', items.length)
  for (const i of items) {
    counts.set(i.category, (counts.get(i.category) ?? 0) + 1)
  }
  return counts
}

/**
 * Substring search over question + optionA + optionB. Case-insensitive,
 * accent-naive (browsers handle that themselves). Empty query is no-op.
 */
export function searchCatalog(items: CatalogItem[], query: string): CatalogItem[] {
  const q = query.trim().toLowerCase()
  if (!q) return items
  return items.filter(i =>
    i.question.toLowerCase().includes(q) ||
    i.optionA.toLowerCase().includes(q) ||
    i.optionB.toLowerCase().includes(q),
  )
}

/**
 * Filter by user vote state. 'all' is a no-op. 'voted' requires the id
 * to be in the votedIds set; 'unvoted' is the complement.
 */
export function filterByVoteState(
  items: CatalogItem[],
  state: VoteState,
  votedIds: ReadonlySet<string>,
): CatalogItem[] {
  if (state === 'all') return items
  if (state === 'voted')   return items.filter(i => votedIds.has(i.id))
  return items.filter(i => !votedIds.has(i.id))
}

/**
 * Compute divisivity 0..100 from vote detail. 100 = exact 50/50, 0 = 100/0.
 * Returns 0 if the item has no detail (treated as not-divisive).
 */
export function divisivityOf(detail: VoteDetail | undefined): number {
  if (!detail) return 0
  const total = detail.a + detail.b
  if (total === 0) return 0
  const pctA = (detail.a / total) * 100
  return Math.round(100 - 2 * Math.abs(50 - pctA))
}

/**
 * Filter by minimum divisivity. 0 is a no-op. Items without vote detail
 * are excluded (we can't compute divisivity for them).
 */
export function filterByDivisivity(
  items: CatalogItem[],
  minDivisivity: number,
  voteDetailMap: ReadonlyMap<string, VoteDetail>,
): CatalogItem[] {
  if (minDivisivity <= 0) return items
  return items.filter(i => divisivityOf(voteDetailMap.get(i.id)) >= minDivisivity)
}

/**
 * Pick the deterministic daily dilemma from a moral-only pool.
 * Uses `daysSinceEpoch % poolLength` so it rotates once per day UTC.
 */
export function pickDaily(items: CatalogItem[]): CatalogItem | undefined {
  const pool = items.filter(i => !i.isLifestyle)
  if (pool.length === 0) return undefined
  const days = Math.floor(Date.now() / 86_400_000)
  return pool[days % pool.length]
}

/**
 * Pick the most divisive of the week — the item with divisivity closest
 * to 50/50 and >= DIVISIVE_MIN_VOTES total votes. Used for the featured row.
 * Excludes the daily pick so the two cards don't collide.
 */
export function pickMostDivisive(
  items: CatalogItem[],
  voteDetailMap: ReadonlyMap<string, VoteDetail>,
  excludeId?: string,
): CatalogItem | undefined {
  let best: CatalogItem | undefined
  let bestDivisivity = -1
  for (const item of items) {
    if (item.id === excludeId) continue
    if (item.isLifestyle) continue
    const detail = voteDetailMap.get(item.id)
    if (!detail) continue
    if (detail.a + detail.b < DIVISIVE_MIN_VOTES) continue
    const div = divisivityOf(detail)
    if (div > bestDivisivity) {
      bestDivisivity = div
      best = item
    }
  }
  return best
}
