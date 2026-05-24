import { describe, it, expect } from 'vitest'
import { runQualityGates } from '@/lib/content-quality-gates'

// Reusable valid base so each test only needs to override what it tests.
// All scores are above autopublish thresholds so the gate doesn't reject
// for unrelated reasons.
const VALID_BASE = {
  locale: 'en' as const,
  category: 'morality',
  seoTitle: 'A solid title that meets length requirements for the gate',
  seoDescription:
    'A long enough description that lets the SEO gate pass without issue. At least twenty chars.',
  keywords: ['moral', 'dilemma'],
  scores: { noveltyScore: 80, finalScore: 80 },
  similarItemsCount: 0,
}

describe('runQualityGates — moral yes/no soft warning', () => {
  it('flags optionA that opens with bare "Yes."', () => {
    const result = runQualityGates({
      ...VALID_BASE,
      question: 'A meaningful moral question with enough characters here.',
      optionA: 'Yes. Public health protects everyone.',
      optionB: 'Refuse. Bodily autonomy must be respected.',
    })
    expect(result.warnings).toContain('moral_option_bare_yes_no:optionA')
  })

  it('flags optionB that opens with bare "No."', () => {
    const result = runQualityGates({
      ...VALID_BASE,
      question: 'A meaningful moral question with enough characters here.',
      optionA: 'Pass it. Public health protects everyone now.',
      optionB: 'No. Bodily autonomy must be respected here.',
    })
    expect(result.warnings).toContain('moral_option_bare_yes_no:optionB')
  })

  it('flags Italian "Sì." opening on a moral dilemma', () => {
    const result = runQualityGates({
      ...VALID_BASE,
      locale: 'it',
      question: 'Una domanda morale italiana sufficientemente lunga per il gate.',
      optionA: 'Sì. La salute pubblica protegge tutti gli abitanti.',
      optionB: 'Rifiuto. Il corpo non può essere costretto in nessun modo.',
    })
    expect(result.warnings).toContain('moral_option_bare_yes_no:optionA')
  })

  it('does NOT flag bare yes/no when dilemmaStyle is lifestyle', () => {
    const result = runQualityGates({
      ...VALID_BASE,
      category: 'lifestyle',
      dilemmaStyle: 'lifestyle',
      question: 'Sì o No?',
      optionA: 'Sì',
      optionB: 'No',
      scores: { noveltyScore: 20, finalScore: 40 },
    })
    expect(result.warnings.some((w) => w.startsWith('moral_option_bare_yes_no'))).toBe(false)
  })

  it('does NOT flag stance+rationale options that start with a verb', () => {
    const result = runQualityGates({
      ...VALID_BASE,
      question: 'A meaningful moral question with enough characters here.',
      optionA: 'Pass it. The shortfall outweighs the principle bent.',
      optionB: 'Block it. Targeting one group makes the next easier.',
    })
    expect(result.warnings.some((w) => w.startsWith('moral_option_bare_yes_no'))).toBe(false)
  })
})

describe('runQualityGates — magic stipulation soft warning', () => {
  it('flags "studies show" in the question', () => {
    const result = runQualityGates({
      ...VALID_BASE,
      question: 'Studies show banning X reduces harm by half. Should we ban X?',
      optionA: 'Pass the ban. The data supports it.',
      optionB: 'Refuse the ban. Bans of this kind tend to backfire.',
    })
    expect(result.warnings).toContain('magic_stipulation_in_question')
  })

  it('flags "+40%" stipulation in the question', () => {
    const result = runQualityGates({
      ...VALID_BASE,
      question: 'A bill would improve outcomes by +40% overall. Should we pass it?',
      optionA: 'Pass it. The improvement is enough on its own.',
      optionB: 'Block it. Stipulated improvements rarely arrive intact.',
    })
    expect(result.warnings).toContain('magic_stipulation_in_question')
  })

  it('flags "30% more accurate" stipulation', () => {
    const result = runQualityGates({
      ...VALID_BASE,
      question: 'A tool is 30% more accurate than the human alternative for this task.',
      optionA: 'Adopt it. Accuracy is what matters here.',
      optionB: 'Refuse it. Accuracy is not the whole picture.',
    })
    expect(result.warnings).toContain('magic_stipulation_in_question')
  })

  it('flags Italian "modello portoghese mostra"', () => {
    const result = runQualityGates({
      ...VALID_BASE,
      locale: 'it',
      question: 'Il modello portoghese mostra che la criminalità cala del 50%. Lo sostieni?',
      optionA: 'Sostengo. La prova esiste, basta applicarla.',
      optionB: 'Rifiuto. Le prove cambiano col contesto, non bastano.',
    })
    expect(result.warnings).toContain('magic_stipulation_in_question')
  })

  it('does NOT flag magic stipulation when dilemmaStyle is lifestyle', () => {
    const result = runQualityGates({
      ...VALID_BASE,
      category: 'lifestyle',
      dilemmaStyle: 'lifestyle',
      question: 'Coffee or tea? Studies show coffee is +40% more popular.',
      optionA: 'Coffee',
      optionB: 'Tea',
      scores: { noveltyScore: 20, finalScore: 40 },
    })
    expect(result.warnings.some((w) => w === 'magic_stipulation_in_question')).toBe(false)
  })

  it('does NOT flag a clean tradeoff question with no stipulations', () => {
    const result = runQualityGates({
      ...VALID_BASE,
      question:
        'A new tax would halve the income of the top 1% and double the income of the bottom 20%.',
      optionA: 'Pass it. Less concentration is worth the redistribution.',
      optionB: 'Block it. Choosing winners and losers like this is wrong.',
    })
    expect(result.warnings.some((w) => w === 'magic_stipulation_in_question')).toBe(false)
  })
})

describe('runQualityGates — soft warnings are advisory, never blocking', () => {
  it('passes a clean moral dilemma with zero warnings of these kinds', () => {
    const result = runQualityGates({
      ...VALID_BASE,
      question:
        'A serious offender finishes a long sentence and walks free. Should they live nearby without you being told?',
      optionA: 'Allow it. The punishment cannot follow them forever after release.',
      optionB: 'Refuse it. The people nearby have a right to know the risk they accept.',
    })
    expect(result.reasons).toEqual([])
    expect(result.passed).toBe(true)
    expect(result.warnings.some((w) => w === 'magic_stipulation_in_question')).toBe(false)
    expect(result.warnings.some((w) => w.startsWith('moral_option_bare_yes_no'))).toBe(false)
  })

  it('soft warnings do NOT block passed=true', () => {
    const result = runQualityGates({
      ...VALID_BASE,
      question: 'Studies show banning X reduces harm by half. Should we ban X?',
      optionA: 'Yes. The data supports it without much room for debate.',
      optionB: 'No. Bans of this kind tend to backfire over time.',
    })
    expect(result.warnings).toContain('magic_stipulation_in_question')
    expect(result.warnings.some((w) => w.startsWith('moral_option_bare_yes_no'))).toBe(true)
    expect(result.reasons).toEqual([])
    expect(result.passed).toBe(true)
  })
})
