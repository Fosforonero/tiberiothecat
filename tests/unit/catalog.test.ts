import { describe, it, expect } from 'vitest'
import {
  buildCatalogItems,
  filterCatalog,
  sortCatalog,
  categoryCounts,
  searchCatalog,
  filterByVoteState,
  filterByDivisivity,
  divisivityOf,
  pickDaily,
  pickMostDivisive,
  categoryFromSlug,
  slugFromCategory,
  DIVISIVE_MIN_VOTES,
  type CatalogItem,
  type VoteDetail,
} from '@/lib/catalog'
import type { Scenario } from '@/lib/scenarios'
import type { DynamicScenario } from '@/lib/dynamic-scenarios'

function makeStatic(over: Partial<Scenario> = {}): Scenario {
  return {
    id:       'static-a',
    question: 'static question',
    optionA:  'Yes. Reason A.',
    optionB:  'No. Reason B.',
    emoji:    '⚖️',
    category: 'morality',
    ...over,
  }
}

function makeDynamic(over: Partial<DynamicScenario> = {}): DynamicScenario {
  return {
    id:           'dyn-a',
    question:     'dyn question',
    optionA:      'Edit. Save.',
    optionB:      'Refuse. Protect.',
    emoji:        '🤖',
    category:     'technology',
    generatedAt:  '2026-05-20T10:00:00.000Z',
    approvedAt:   '2026-05-21T10:00:00.000Z',
    trend:        'test-trend',
    locale:       'en',
    status:       'approved',
    ...over,
  }
}

describe('buildCatalogItems — dedup static-wins', () => {
  it('merges static then dynamic and drops dynamic entries that collide on id', () => {
    const staticArr = [makeStatic({ id: 'shared' }), makeStatic({ id: 'only-static' })]
    const dynamicArr = [
      makeDynamic({ id: 'shared', question: 'should not appear' }),
      makeDynamic({ id: 'only-dynamic' }),
    ]
    const items = buildCatalogItems(staticArr, dynamicArr, 'en')

    const ids = items.map(i => i.id)
    expect(ids).toContain('shared')
    expect(ids).toContain('only-static')
    expect(ids).toContain('only-dynamic')
    expect(ids.filter(id => id === 'shared')).toHaveLength(1)
    // static wins → no dynamic version of 'shared' in output
    const shared = items.find(i => i.id === 'shared')!
    expect(shared.isDynamic).toBe(false)
    expect(shared.question).toBe('static question')
  })

  it('puts dynamic items before static items in the merged order', () => {
    const items = buildCatalogItems(
      [makeStatic({ id: 's1' })],
      [makeDynamic({ id: 'd1' })],
      'en',
    )
    expect(items[0].id).toBe('d1')
    expect(items[1].id).toBe('s1')
  })

  it('marks lifestyle items via category fallback when dilemmaStyle absent', () => {
    const items = buildCatalogItems(
      [makeStatic({ id: 's-life', category: 'lifestyle' })],
      [],
      'en',
    )
    expect(items[0].isLifestyle).toBe(true)
  })

  it('respects explicit dilemmaStyle override even if category is non-lifestyle', () => {
    const items = buildCatalogItems(
      [],
      [makeDynamic({ id: 'd1', category: 'morality', dilemmaStyle: 'lifestyle' })],
      'en',
    )
    expect(items[0].isLifestyle).toBe(true)
  })

  it('uses approvedAt > generatedAt for freshnessTs and falls back to 0 on missing', () => {
    const items = buildCatalogItems(
      [],
      [
        makeDynamic({ id: 'd-approved', approvedAt: '2026-05-25T00:00:00.000Z', generatedAt: '2026-05-20T00:00:00.000Z' }),
        makeDynamic({ id: 'd-gen-only', approvedAt: undefined, generatedAt: '2026-05-22T00:00:00.000Z' }),
        makeDynamic({ id: 'd-broken',  approvedAt: undefined, generatedAt: 'not-a-date' }),
      ],
      'en',
    )
    expect(items.find(i => i.id === 'd-approved')!.freshnessTs).toBe(Date.parse('2026-05-25T00:00:00.000Z'))
    expect(items.find(i => i.id === 'd-gen-only')!.freshnessTs).toBe(Date.parse('2026-05-22T00:00:00.000Z'))
    expect(items.find(i => i.id === 'd-broken')!.freshnessTs).toBe(0)
  })

  it('handles empty dynamic array gracefully', () => {
    const items = buildCatalogItems([makeStatic({ id: 's1' })], [], 'en')
    expect(items).toHaveLength(1)
    expect(items[0].isDynamic).toBe(false)
  })
})

describe('filterCatalog', () => {
  const items: CatalogItem[] = [
    { id: 'a', question: 'q', optionA: 'a', optionB: 'b', emoji: '⚖️', category: 'morality',  locale: 'en', isDynamic: false, isLifestyle: false, freshnessTs: 0 },
    { id: 'b', question: 'q', optionA: 'a', optionB: 'b', emoji: '🤖', category: 'technology', locale: 'en', isDynamic: true,  isLifestyle: false, freshnessTs: 1 },
    { id: 'c', question: 'q', optionA: 'a', optionB: 'b', emoji: '🍕', category: 'lifestyle',  locale: 'en', isDynamic: true,  isLifestyle: true,  freshnessTs: 2 },
  ]

  it('returns all items unchanged when category is "all"', () => {
    expect(filterCatalog(items, 'all')).toEqual(items)
  })

  it('returns only items matching the requested category', () => {
    expect(filterCatalog(items, 'morality').map(i => i.id)).toEqual(['a'])
    expect(filterCatalog(items, 'lifestyle').map(i => i.id)).toEqual(['c'])
  })

  it('returns empty array when no items match', () => {
    expect(filterCatalog(items, 'survival')).toEqual([])
  })
})

describe('sortCatalog — popular', () => {
  it('sorts by vote count DESC, tiebreaks by freshness DESC then id ASC', () => {
    const items: CatalogItem[] = [
      { id: 'a', question: 'q', optionA: 'a', optionB: 'b', emoji: '⚖️', category: 'morality', locale: 'en', isDynamic: false, isLifestyle: false, freshnessTs: 0   },
      { id: 'b', question: 'q', optionA: 'a', optionB: 'b', emoji: '⚖️', category: 'morality', locale: 'en', isDynamic: true,  isLifestyle: false, freshnessTs: 100 },
      { id: 'c', question: 'q', optionA: 'a', optionB: 'b', emoji: '⚖️', category: 'morality', locale: 'en', isDynamic: true,  isLifestyle: false, freshnessTs: 200 },
    ]
    const voteMap = new Map<string, number>([['a', 5], ['b', 10], ['c', 10]])
    const sorted = sortCatalog(items, 'popular', voteMap)
    // b and c both have 10 votes; c has higher freshness → c first
    expect(sorted.map(i => i.id)).toEqual(['c', 'b', 'a'])
  })

  it('treats missing vote entries as 0', () => {
    const items: CatalogItem[] = [
      { id: 'a', question: 'q', optionA: 'a', optionB: 'b', emoji: '⚖️', category: 'morality', locale: 'en', isDynamic: false, isLifestyle: false, freshnessTs: 100 },
      { id: 'b', question: 'q', optionA: 'a', optionB: 'b', emoji: '⚖️', category: 'morality', locale: 'en', isDynamic: false, isLifestyle: false, freshnessTs: 200 },
    ]
    const sorted = sortCatalog(items, 'popular', new Map())
    // both 0 votes → freshness tiebreak → b first
    expect(sorted.map(i => i.id)).toEqual(['b', 'a'])
  })
})

describe('sortCatalog — fresh', () => {
  it('puts dynamic items (high freshnessTs) before static items (freshnessTs=0)', () => {
    const items: CatalogItem[] = [
      { id: 'static', question: 'q', optionA: 'a', optionB: 'b', emoji: '⚖️', category: 'morality', locale: 'en', isDynamic: false, isLifestyle: false, freshnessTs: 0    },
      { id: 'dyn1',   question: 'q', optionA: 'a', optionB: 'b', emoji: '⚖️', category: 'morality', locale: 'en', isDynamic: true,  isLifestyle: false, freshnessTs: 100  },
      { id: 'dyn2',   question: 'q', optionA: 'a', optionB: 'b', emoji: '⚖️', category: 'morality', locale: 'en', isDynamic: true,  isLifestyle: false, freshnessTs: 200  },
    ]
    const sorted = sortCatalog(items, 'fresh', new Map())
    expect(sorted.map(i => i.id)).toEqual(['dyn2', 'dyn1', 'static'])
  })
})

describe('sortCatalog — divisive', () => {
  const items: CatalogItem[] = [
    { id: 'fifty',    question: 'q', optionA: 'a', optionB: 'b', emoji: '⚖️', category: 'morality', locale: 'en', isDynamic: false, isLifestyle: false, freshnessTs: 0 },
    { id: 'lopsided', question: 'q', optionA: 'a', optionB: 'b', emoji: '⚖️', category: 'morality', locale: 'en', isDynamic: false, isLifestyle: false, freshnessTs: 0 },
    { id: 'tiny',     question: 'q', optionA: 'a', optionB: 'b', emoji: '⚖️', category: 'morality', locale: 'en', isDynamic: false, isLifestyle: false, freshnessTs: 0 },
  ]

  it('excludes items below DIVISIVE_MIN_VOTES total votes', () => {
    const detail = new Map<string, VoteDetail>([
      ['fifty',    { a: 50, b: 50 }],
      ['lopsided', { a: 90, b: 10 }],
      ['tiny',     { a: 5,  b: 5  }],   // total = 10 < threshold
    ])
    const sorted = sortCatalog(items, 'divisive', new Map(), detail)
    expect(sorted.map(i => i.id)).not.toContain('tiny')
  })

  it('orders eligible items by |0.5 - a/(a+b)| ascending (closer to 50/50 first)', () => {
    const detail = new Map<string, VoteDetail>([
      ['fifty',    { a: 50, b: 50 }],   // 0.50 → distance 0
      ['lopsided', { a: 90, b: 10 }],   // 0.90 → distance 0.40
    ])
    const sorted = sortCatalog(items.filter(i => i.id !== 'tiny'), 'divisive', new Map(), detail)
    expect(sorted.map(i => i.id)).toEqual(['fifty', 'lopsided'])
  })

  it('returns empty array when no items meet the min-vote floor', () => {
    const detail = new Map<string, VoteDetail>([
      ['fifty', { a: 5, b: 5 }],
    ])
    const sorted = sortCatalog([items[0]], 'divisive', new Map(), detail)
    expect(sorted).toEqual([])
  })

  it('returns empty array when voteDetailMap is undefined', () => {
    const sorted = sortCatalog(items, 'divisive', new Map())
    expect(sorted).toEqual([])
  })
})

describe('searchCatalog', () => {
  const items: CatalogItem[] = [
    { id: 'trolley', question: 'A trolley is heading toward five people', optionA: 'Pull the lever', optionB: 'Do nothing', emoji: '🚋', category: 'morality', locale: 'en', isDynamic: false, isLifestyle: false, freshnessTs: 0 },
    { id: 'ai-job',  question: 'An AI can do your job at 90% of the cost', optionA: 'Replace you', optionB: 'Keep you',    emoji: '🤖', category: 'technology', locale: 'en', isDynamic: false, isLifestyle: false, freshnessTs: 0 },
  ]

  it('returns all items when query is empty or whitespace', () => {
    expect(searchCatalog(items, '')).toHaveLength(2)
    expect(searchCatalog(items, '   ')).toHaveLength(2)
  })

  it('matches case-insensitive substring on question', () => {
    expect(searchCatalog(items, 'TROLLEY').map(i => i.id)).toEqual(['trolley'])
  })

  it('matches on optionA / optionB too', () => {
    expect(searchCatalog(items, 'lever').map(i => i.id)).toEqual(['trolley'])
    expect(searchCatalog(items, 'replace').map(i => i.id)).toEqual(['ai-job'])
  })

  it('returns empty when no item matches', () => {
    expect(searchCatalog(items, 'spaghetti')).toEqual([])
  })
})

describe('filterByVoteState', () => {
  const items: CatalogItem[] = [
    { id: 'a', question: 'q', optionA: 'a', optionB: 'b', emoji: '⚖️', category: 'morality', locale: 'en', isDynamic: false, isLifestyle: false, freshnessTs: 0 },
    { id: 'b', question: 'q', optionA: 'a', optionB: 'b', emoji: '⚖️', category: 'morality', locale: 'en', isDynamic: false, isLifestyle: false, freshnessTs: 0 },
    { id: 'c', question: 'q', optionA: 'a', optionB: 'b', emoji: '⚖️', category: 'morality', locale: 'en', isDynamic: false, isLifestyle: false, freshnessTs: 0 },
  ]
  const voted = new Set(['a', 'c'])

  it('returns all on "all"', () => {
    expect(filterByVoteState(items, 'all', voted)).toHaveLength(3)
  })

  it('returns only voted ids on "voted"', () => {
    expect(filterByVoteState(items, 'voted', voted).map(i => i.id)).toEqual(['a', 'c'])
  })

  it('returns only unvoted ids on "unvoted"', () => {
    expect(filterByVoteState(items, 'unvoted', voted).map(i => i.id)).toEqual(['b'])
  })

  it('handles empty voted set correctly', () => {
    const empty = new Set<string>()
    expect(filterByVoteState(items, 'voted', empty)).toEqual([])
    expect(filterByVoteState(items, 'unvoted', empty)).toHaveLength(3)
  })
})

describe('divisivityOf', () => {
  it('returns 100 for exact 50/50 split', () => {
    expect(divisivityOf({ a: 50, b: 50 })).toBe(100)
  })

  it('returns 0 for 100/0 split (or empty)', () => {
    expect(divisivityOf({ a: 100, b: 0 })).toBe(0)
    expect(divisivityOf({ a: 0, b: 0 })).toBe(0)
    expect(divisivityOf(undefined)).toBe(0)
  })

  it('returns roughly 80 for 60/40 split', () => {
    expect(divisivityOf({ a: 60, b: 40 })).toBe(80)
  })
})

describe('filterByDivisivity', () => {
  const items: CatalogItem[] = [
    { id: 'fifty',    question: 'q', optionA: 'a', optionB: 'b', emoji: '⚖️', category: 'morality', locale: 'en', isDynamic: false, isLifestyle: false, freshnessTs: 0 },
    { id: 'sixty',    question: 'q', optionA: 'a', optionB: 'b', emoji: '⚖️', category: 'morality', locale: 'en', isDynamic: false, isLifestyle: false, freshnessTs: 0 },
    { id: 'lopsided', question: 'q', optionA: 'a', optionB: 'b', emoji: '⚖️', category: 'morality', locale: 'en', isDynamic: false, isLifestyle: false, freshnessTs: 0 },
  ]
  const detail = new Map<string, VoteDetail>([
    ['fifty',    { a: 50, b: 50 }],   // div = 100
    ['sixty',    { a: 60, b: 40 }],   // div = 80
    ['lopsided', { a: 95, b: 5 }],    // div = 10
  ])

  it('no-op when threshold is 0', () => {
    expect(filterByDivisivity(items, 0, detail)).toHaveLength(3)
  })

  it('keeps items at or above threshold', () => {
    expect(filterByDivisivity(items, 70, detail).map(i => i.id)).toEqual(['fifty', 'sixty'])
    expect(filterByDivisivity(items, 90, detail).map(i => i.id)).toEqual(['fifty'])
  })

  it('excludes items missing vote detail', () => {
    const partial = new Map<string, VoteDetail>([['fifty', { a: 50, b: 50 }]])
    expect(filterByDivisivity(items, 50, partial).map(i => i.id)).toEqual(['fifty'])
  })
})

describe('pickDaily', () => {
  it('returns undefined for empty pool', () => {
    expect(pickDaily([])).toBeUndefined()
  })

  it('excludes lifestyle items from rotation', () => {
    const items: CatalogItem[] = [
      { id: 'life', question: 'q', optionA: 'a', optionB: 'b', emoji: '🎭', category: 'lifestyle', locale: 'en', isDynamic: false, isLifestyle: true, freshnessTs: 0 },
    ]
    expect(pickDaily(items)).toBeUndefined()
  })

  it('returns deterministically the same item on the same UTC day', () => {
    const items: CatalogItem[] = [
      { id: 'a', question: 'q', optionA: 'a', optionB: 'b', emoji: '⚖️', category: 'morality', locale: 'en', isDynamic: false, isLifestyle: false, freshnessTs: 0 },
      { id: 'b', question: 'q', optionA: 'a', optionB: 'b', emoji: '⚖️', category: 'morality', locale: 'en', isDynamic: false, isLifestyle: false, freshnessTs: 0 },
    ]
    expect(pickDaily(items)).toBe(pickDaily(items))
  })
})

describe('pickMostDivisive', () => {
  const items: CatalogItem[] = [
    { id: 'fifty',    question: 'q', optionA: 'a', optionB: 'b', emoji: '⚖️', category: 'morality', locale: 'en', isDynamic: false, isLifestyle: false, freshnessTs: 0 },
    { id: 'sixty',    question: 'q', optionA: 'a', optionB: 'b', emoji: '⚖️', category: 'morality', locale: 'en', isDynamic: false, isLifestyle: false, freshnessTs: 0 },
    { id: 'tiny',     question: 'q', optionA: 'a', optionB: 'b', emoji: '⚖️', category: 'morality', locale: 'en', isDynamic: false, isLifestyle: false, freshnessTs: 0 },
  ]
  const detail = new Map<string, VoteDetail>([
    ['fifty', { a: 50, b: 50 }],
    ['sixty', { a: 60, b: 40 }],
    ['tiny',  { a: 25, b: 5  }],   // below threshold
  ])

  it('returns the item with highest divisivity above min-votes floor', () => {
    expect(pickMostDivisive(items, detail)?.id).toBe('fifty')
  })

  it('respects excludeId', () => {
    expect(pickMostDivisive(items, detail, 'fifty')?.id).toBe('sixty')
  })

  it('returns undefined when no eligible item', () => {
    const onlyTiny = new Map<string, VoteDetail>([['tiny', { a: 25, b: 5 }]])
    expect(pickMostDivisive([items[2]], onlyTiny)).toBeUndefined()
  })
})

describe('categoryFromSlug / slugFromCategory', () => {
  it('handles "all" round-trip', () => {
    expect(categoryFromSlug('all', 'en')).toBe('all')
    expect(categoryFromSlug('all', 'it')).toBe('all')
    expect(slugFromCategory('all', 'en')).toBe('all')
    expect(slugFromCategory('all', 'it')).toBe('all')
  })

  it('uses raw key as EN slug', () => {
    expect(categoryFromSlug('technology', 'en')).toBe('technology')
    expect(slugFromCategory('technology', 'en')).toBe('technology')
  })

  it('maps IT slug to category and back', () => {
    expect(categoryFromSlug('tecnologia', 'it')).toBe('technology')
    expect(slugFromCategory('technology', 'it')).toBe('tecnologia')
    expect(categoryFromSlug('moralita', 'it')).toBe('morality')
    expect(categoryFromSlug('relazioni', 'it')).toBe('relationships')
  })

  it('falls back to "all" for unknown slug', () => {
    expect(categoryFromSlug('spaghetti', 'en')).toBe('all')
    expect(categoryFromSlug('spaghetti', 'it')).toBe('all')
    expect(categoryFromSlug(null, 'en')).toBe('all')
    expect(categoryFromSlug(undefined, 'it')).toBe('all')
  })
})

describe('categoryCounts', () => {
  it('returns total under "all" plus one entry per category present', () => {
    const items: CatalogItem[] = [
      { id: 'a', question: 'q', optionA: 'a', optionB: 'b', emoji: '⚖️', category: 'morality',  locale: 'en', isDynamic: false, isLifestyle: false, freshnessTs: 0 },
      { id: 'b', question: 'q', optionA: 'a', optionB: 'b', emoji: '⚖️', category: 'morality',  locale: 'en', isDynamic: false, isLifestyle: false, freshnessTs: 0 },
      { id: 'c', question: 'q', optionA: 'a', optionB: 'b', emoji: '🤖', category: 'technology', locale: 'en', isDynamic: false, isLifestyle: false, freshnessTs: 0 },
    ]
    const counts = categoryCounts(items)
    expect(counts.get('all')).toBe(3)
    expect(counts.get('morality')).toBe(2)
    expect(counts.get('technology')).toBe(1)
    expect(counts.has('survival')).toBe(false)
  })
})
