import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { getFreshNextScenarioId, scenarios, getScenario } from '@/lib/scenarios'

// Structural shape matching the unexported `ScoredItem` in lib/scenarios.ts.
// Kept loose on `category` to mirror what real dynamic AI scenarios serialize.
type ScoredFixture = {
  id: string
  category?: string
  scores?: { finalScore?: number }
}

// Sprint NEXT-DILEMMA-CATEGORY-AFFINITY-01:
//   getFreshNextScenarioId now applies a soft same-category preference.
//   - If currentCategory resolves AND (same-cat dynamic + same-cat static) ≥ 3,
//     route within that pool. Dynamic top-half-by-finalScore wins when any
//     dynamic same-cat items exist; otherwise pick a random same-cat static.
//   - Otherwise fall through to the existing cross-category behavior.
//
// Math.random is spied so picks are deterministic. The function uses
// `Math.floor(Math.random() * pool.length)` so a mocked 0 always returns the
// first item of the resolved pool (after sorting, where applicable).

describe('getFreshNextScenarioId — same-category affinity', () => {
  beforeEach(() => {
    vi.spyOn(Math, 'random').mockReturnValue(0)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns a same-category static id when no dynamicPool is provided', () => {
    const result = getFreshNextScenarioId('trolley', new Set())
    expect(result).not.toBeNull()
    expect(result).not.toBe('trolley')
    const picked = getScenario(result!)
    expect(picked).toBeDefined()
    expect(picked!.category).toBe('morality')
  })

  it('falls back to cross-category when same-category pool is exhausted (< 3)', () => {
    // Voting all 7 other morality static dilemmas + trolley as current → 0 fresh
    // morality items, so the primary pool collapses and we should land on a
    // non-morality scenario.
    const moralityStaticIds = scenarios
      .filter(s => s.category === 'morality' && s.id !== 'trolley')
      .map(s => s.id)
    const votedIds = new Set(moralityStaticIds)
    const result = getFreshNextScenarioId('trolley', votedIds)
    expect(result).not.toBeNull()
    expect(result).not.toBe('trolley')
    const picked = getScenario(result!)
    expect(picked).toBeDefined()
    expect(picked!.category).not.toBe('morality')
  })

  it('prefers same-category dynamic top-half by finalScore when available', () => {
    // 5 morality dynamics with descending finalScore. topHalf = ceil(5/2) = 3.
    // Math.random=0 → index 0 of the sorted top half → highest-score dynamic.
    const dynamicPool: ScoredFixture[] = [
      { id: 'dyn-mor-low',  category: 'morality', scores: { finalScore: 50 } },
      { id: 'dyn-mor-mid',  category: 'morality', scores: { finalScore: 70 } },
      { id: 'dyn-mor-top',  category: 'morality', scores: { finalScore: 90 } },
      { id: 'dyn-mor-mid2', category: 'morality', scores: { finalScore: 60 } },
      { id: 'dyn-mor-mid3', category: 'morality', scores: { finalScore: 80 } },
    ]
    const result = getFreshNextScenarioId('trolley', new Set(), dynamicPool)
    expect(result).toBe('dyn-mor-top')
  })

  it('routes to morality when dynamicPool has 5 lifestyle + 2 morality dynamics (primary pool ≥ 3 via static)', () => {
    // The morality static pool (7 fresh after excluding trolley) makes the
    // primary pool reach 9 items total. Since sameCatDynamic.length > 0, the
    // function picks from the dynamic morality top half (ceil(2/2) = 1 → the
    // higher-scored morality dynamic).
    const dynamicPool: ScoredFixture[] = [
      { id: 'dyn-life-1', category: 'lifestyle', scores: { finalScore: 95 } },
      { id: 'dyn-life-2', category: 'lifestyle', scores: { finalScore: 90 } },
      { id: 'dyn-life-3', category: 'lifestyle', scores: { finalScore: 85 } },
      { id: 'dyn-life-4', category: 'lifestyle', scores: { finalScore: 80 } },
      { id: 'dyn-life-5', category: 'lifestyle', scores: { finalScore: 75 } },
      { id: 'dyn-mor-a',  category: 'morality',  scores: { finalScore: 55 } },
      { id: 'dyn-mor-b',  category: 'morality',  scores: { finalScore: 65 } },
    ]
    const result = getFreshNextScenarioId('trolley', new Set(), dynamicPool)
    expect(result).toBe('dyn-mor-b')
  })

  it('falls through to cross-category logic when currentId category cannot be resolved', () => {
    // Unknown current id → no category → primary pool block skipped entirely.
    // With no dynamicPool, the cross-category path picks a random static.
    // Math.random=0 → index 0 of static `scenarios` (trolley by source order).
    const result = getFreshNextScenarioId('nonexistent-id', new Set())
    expect(result).not.toBeNull()
    // Specifically the first scenario in the static array (trolley).
    expect(result).toBe(scenarios[0].id)
  })

  it('returns null when every static scenario is excluded', () => {
    const votedIds = new Set(scenarios.map(s => s.id))
    const result = getFreshNextScenarioId('trolley', votedIds)
    expect(result).toBeNull()
  })

  it('falls through to cross-category dynamic top-half when category resolves but primary pool has < 3', () => {
    // Pick relationships and vote ALL but one (excluding the current id)
    // so the fresh same-cat pool has exactly 1 item < 3 regardless of how
    // many relationships dilemmas the corpus grows to. Add a dynamicPool
    // with 0 same-cat dynamics → primary pool size stays 1 → fall through.
    const relStaticIds = scenarios
      .filter(s => s.category === 'relationships')
      .map(s => s.id)
    const currentId = relStaticIds[0]
    // voted = all relationships from index 2 onwards.
    // excluded = {current=[0]} ∪ {voted=[2..N-1]} → fresh same-cat = {[1]} → size 1 < 3.
    const votedIds = new Set(relStaticIds.slice(2))
    const dynamicPool: ScoredFixture[] = [
      { id: 'dyn-other-1', category: 'society',   scores: { finalScore: 90 } },
      { id: 'dyn-other-2', category: 'freedom',   scores: { finalScore: 80 } },
      { id: 'dyn-other-3', category: 'technology', scores: { finalScore: 70 } },
    ]
    const result = getFreshNextScenarioId(currentId, votedIds, dynamicPool)
    // Same-cat primary pool = 1 < 3 → cross-category dynamic top-half kicks in.
    // topHalf = ceil(3/2) = 2 → [dyn-other-1 (90), dyn-other-2 (80)].
    // Math.random=0 → dyn-other-1.
    expect(result).toBe('dyn-other-1')
  })
})
