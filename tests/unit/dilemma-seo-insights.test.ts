import { describe, it, expect } from 'vitest'
import {
  getDilemmaCategoryContext,
  getDilemmaSeoSummary,
  getDilemmaDiscussionPrompts,
  getResultsInsight,
  type InsightScenario,
} from '@/lib/dilemma-seo-insights'
import type { Category } from '@/lib/scenarios'

const ALL_CATEGORIES: Category[] = [
  'morality', 'survival', 'loyalty', 'justice',
  'freedom', 'technology', 'society', 'relationships', 'lifestyle',
]

function scenario(category: Category, questionSeed = 'A test question'): InsightScenario {
  return {
    question: `${questionSeed} for ${category}.`,
    optionA: `Choose A (${category})`,
    optionB: `Choose B (${category})`,
    category,
  }
}

describe('getDilemmaCategoryContext', () => {
  it('returns framings + tensions + splitFallback + prompts arrays for every category in EN', () => {
    for (const cat of ALL_CATEGORIES) {
      const ctx = getDilemmaCategoryContext(cat, 'en')
      expect(ctx.framings.length).toBeGreaterThanOrEqual(2)
      expect(ctx.tensions.length).toBeGreaterThanOrEqual(2)
      expect(ctx.splitFallback).toBeTruthy()
      expect(ctx.prompts.length).toBeGreaterThanOrEqual(4)
      for (const f of ctx.framings) expect(f).toBeTruthy()
      for (const t of ctx.tensions) {
        expect(t.a).toBeTruthy()
        expect(t.b).toBeTruthy()
      }
    }
  })

  it('returns full context for every category in IT', () => {
    for (const cat of ALL_CATEGORIES) {
      const ctx = getDilemmaCategoryContext(cat, 'it')
      expect(ctx.framings.length).toBeGreaterThanOrEqual(2)
      expect(ctx.tensions.length).toBeGreaterThanOrEqual(2)
      expect(ctx.splitFallback).toBeTruthy()
      expect(ctx.prompts.length).toBeGreaterThanOrEqual(4)
    }
  })

  it('framings differ across categories (no boilerplate duplication)', () => {
    const firsts = ALL_CATEGORIES.map((c) => getDilemmaCategoryContext(c, 'en').framings[0])
    expect(new Set(firsts).size).toBe(ALL_CATEGORIES.length)
  })

  it('lifestyle has a non-moral / lighter framing (no "right vs right" wording)', () => {
    const enLifestyle = getDilemmaCategoryContext('lifestyle', 'en').framings.join(' ').toLowerCase()
    const itLifestyle = getDilemmaCategoryContext('lifestyle', 'it').framings.join(' ').toLowerCase()
    expect(enLifestyle).not.toContain('right vs right')
    expect(enLifestyle).not.toContain('moral')
    expect(itLifestyle).not.toContain('giusto-contro-giusto')
    expect(itLifestyle).not.toContain('morale')
  })
})

describe('getDilemmaSeoSummary', () => {
  it('includes both option labels (quoted) verbatim — EN', () => {
    const s = scenario('morality')
    const out = getDilemmaSeoSummary({ scenario: s, locale: 'en' })
    expect(out).toContain('Choose A (morality)')
    expect(out).toContain('Choose B (morality)')
    expect(out).toContain('Choosing')
  })

  it('includes both option labels (quoted) verbatim — IT', () => {
    const s = scenario('freedom')
    const out = getDilemmaSeoSummary({ scenario: s, locale: 'it' })
    expect(out).toContain('Choose A (freedom)')
    expect(out).toContain('Choose B (freedom)')
    expect(out).toContain('Scegliere')
  })

  it('TWO scenarios in the SAME category get DIFFERENT summaries (variant pick by question hash)', () => {
    const s1 = scenario('morality', 'Q1')
    const s2 = scenario('morality', 'Q2-totally-different-seed')
    const s3 = scenario('morality', 'Q3-other-seed-here')
    const s4 = scenario('morality', 'Q4-yet-another-seed')
    const outs = [s1, s2, s3, s4].map((s) => getDilemmaSeoSummary({ scenario: s, locale: 'en' }))
    // At least 2 distinct summaries across 4 morality scenarios — confirms
    // the variant pool is doing its job (3 framings × 3 tensions = 9 combos).
    expect(new Set(outs).size).toBeGreaterThan(1)
  })

  it('SAME scenario always renders the SAME summary (deterministic)', () => {
    const s = scenario('justice', 'stable-seed')
    const out1 = getDilemmaSeoSummary({ scenario: s, locale: 'en' })
    const out2 = getDilemmaSeoSummary({ scenario: s, locale: 'en' })
    expect(out1).toBe(out2)
  })

  it('trims trailing punctuation from option labels in the quoted form', () => {
    const s: InsightScenario = {
      question: 'Q',
      optionA: 'Save the cat!',
      optionB: 'Save the dog.',
      category: 'morality',
    }
    const out = getDilemmaSeoSummary({ scenario: s, locale: 'en' })
    expect(out).toContain('“Save the cat”')
    expect(out).toContain('“Save the dog”')
    expect(out).not.toContain('“Save the cat!”')
  })
})

describe('getDilemmaDiscussionPrompts', () => {
  it('returns exactly 2 prompts in EN', () => {
    const out = getDilemmaDiscussionPrompts({ scenario: scenario('justice'), locale: 'en' })
    expect(out).toHaveLength(2)
    for (const p of out) expect(p).toBeTruthy()
  })

  it('returns exactly 2 prompts in IT', () => {
    const out = getDilemmaDiscussionPrompts({ scenario: scenario('justice'), locale: 'it' })
    expect(out).toHaveLength(2)
    for (const p of out) expect(p).toBeTruthy()
  })

  it('different categories produce different prompt pairs', () => {
    const m = getDilemmaDiscussionPrompts({ scenario: scenario('morality'), locale: 'en' }).join('|')
    const t = getDilemmaDiscussionPrompts({ scenario: scenario('technology'), locale: 'en' }).join('|')
    expect(m).not.toBe(t)
  })

  it('returns two DIFFERENT prompts (no duplicate bullet)', () => {
    for (const cat of ALL_CATEGORIES) {
      const out = getDilemmaDiscussionPrompts({ scenario: scenario(cat), locale: 'en' })
      expect(out[0]).not.toBe(out[1])
    }
  })

  it('SAME scenario renders SAME prompts (deterministic)', () => {
    const s = scenario('loyalty', 'fixed-seed')
    const a = getDilemmaDiscussionPrompts({ scenario: s, locale: 'en' })
    const b = getDilemmaDiscussionPrompts({ scenario: s, locale: 'en' })
    expect(a).toEqual(b)
  })
})

describe('getResultsInsight', () => {
  it('falls back to category framing when voteStats missing (EN)', () => {
    const out = getResultsInsight({ scenario: scenario('morality'), locale: 'en' })
    expect(out).toContain('Once votes come in')
    // No phantom percentage / number.
    expect(out).not.toMatch(/\d+%/)
  })

  it('falls back to category framing when total = 0 (IT)', () => {
    const out = getResultsInsight({
      scenario: scenario('morality'),
      locale: 'it',
      voteStats: { pctA: 0, pctB: 0, total: 0 },
    })
    expect(out).toContain('Quando arriveranno i voti')
    expect(out).not.toMatch(/\d+%/)
  })

  it('describes a clear majority side using the actual option label (EN)', () => {
    const s = scenario('freedom')
    const out = getResultsInsight({
      scenario: s,
      locale: 'en',
      voteStats: { pctA: 63, pctB: 37, total: 1200 },
    })
    expect(out).toContain('63%')
    expect(out).toContain('Choose A (freedom)')
    expect(out).toContain('SplitVote voters')
    // Anti-claim guard: must not imply representativity.
    expect(out.toLowerCase()).not.toContain('the world')
    expect(out.toLowerCase()).not.toContain('humanity')
  })

  it('uses "SplitVote" framing (no "il mondo") in IT majority text', () => {
    const out = getResultsInsight({
      scenario: scenario('justice'),
      locale: 'it',
      voteStats: { pctA: 70, pctB: 30, total: 500 },
    })
    expect(out).toContain('SplitVote')
    expect(out).toContain('70%')
    expect(out.toLowerCase()).not.toContain('il mondo ha votato')
  })

  it('calls a near-50/50 split "divided" instead of picking a side (EN)', () => {
    const out = getResultsInsight({
      scenario: scenario('survival'),
      locale: 'en',
      voteStats: { pctA: 52, pctB: 48, total: 999 },
    })
    expect(out.toLowerCase()).toContain('split')
    expect(out).not.toContain('leans')
  })

  it('calls a near-50/50 split "diviso" in IT', () => {
    const out = getResultsInsight({
      scenario: scenario('survival'),
      locale: 'it',
      voteStats: { pctA: 51, pctB: 49, total: 999 },
    })
    expect(out.toLowerCase()).toContain('diviso')
  })

  it('never throws on any category with missing stats', () => {
    for (const cat of ALL_CATEGORIES) {
      expect(() => getResultsInsight({ scenario: scenario(cat), locale: 'en' })).not.toThrow()
      expect(() => getResultsInsight({ scenario: scenario(cat), locale: 'it' })).not.toThrow()
    }
  })

  it('falls back to morality context when category is unknown (legacy DB row)', () => {
    const legacy: InsightScenario = {
      question: 'legacy',
      optionA: 'A',
      optionB: 'B',
      // @ts-expect-error — simulating a runtime category outside the union
      category: 'unknown-legacy-category',
    }
    expect(() => getResultsInsight({ scenario: legacy, locale: 'en' })).not.toThrow()
    expect(() => getDilemmaSeoSummary({ scenario: legacy, locale: 'en' })).not.toThrow()
  })
})
