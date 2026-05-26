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

export const DIVISIVE_MIN_VOTES = 50

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
