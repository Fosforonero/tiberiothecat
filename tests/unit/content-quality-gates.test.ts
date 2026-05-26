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

describe('runQualityGates — editorial-shape warnings (DILEMMA-EDITORIAL-SHAPE-GATE-01)', () => {
  // The weak generated IT dilemma that triggered this sprint. It is vague
  // ("un Paese", "gli altri"), uses a bare action verb ("rallentare"), and
  // collapses into a yes/no policy referendum — exactly the failure mode the
  // editorial-shape gate must catch.
  it('warns on the weak IT AI-regulation sample that triggered the sprint', () => {
    const result = runQualityGates({
      ...VALID_BASE,
      locale: 'it',
      question: "Se un Paese rifiuta regole sull'AI, gli altri dovrebbero rallentare comunque?",
      optionA: 'Rallentare. La prudenza viene prima della corsa tecnologica.',
      optionB: 'Andare avanti. Restare indietro sarebbe peggio nel medio periodo.',
    })
    // At least one editorial-shape warning must fire — the broad actors,
    // referendum framing, and vague verb should each trigger their own.
    const editorialWarnings = result.warnings.filter((w) =>
      ['abstract_policy_question', 'support_oppose_framing', 'undefined_collective_actor', 'undefined_action_verb'].includes(w),
    )
    expect(editorialWarnings.length).toBeGreaterThan(0)
    expect(result.warnings).toContain('undefined_collective_actor')
    expect(result.warnings).toContain('undefined_action_verb')
  })

  it('warns on the weak EN AI-regulation phrasing', () => {
    const result = runQualityGates({
      ...VALID_BASE,
      question: 'Should countries slow AI development if another country ignores AI rules?',
      optionA: 'Slow it. Safety must come before the race.',
      optionB: 'Press on. Falling behind would be worse over time.',
    })
    expect(result.warnings).toContain('abstract_policy_question')
    expect(result.warnings).toContain('undefined_collective_actor')
    expect(result.warnings).toContain('undefined_action_verb')
  })

  it('does NOT warn on the strong IT rewrite (explicit comparative-risk frame)', () => {
    const result = runQualityGates({
      ...VALID_BASE,
      locale: 'it',
      question: "È più pericoloso sviluppare l'AI senza regole o lasciare che lo facciano solo i Paesi che ignorano le regole?",
      optionA: "Rallentare. Se l'AI è rischiosa, la prudenza viene prima della gara.",
      optionB: 'Restare in corsa. Se avanzano solo gli irresponsabili, il rischio aumenta.',
    })
    // "più pericoloso" is the suppressor — the question already names the
    // collision, so the editorial-shape warnings must stay silent even
    // though "i Paesi" is still a broad actor.
    const editorialWarnings = result.warnings.filter((w) =>
      ['abstract_policy_question', 'support_oppose_framing', 'undefined_collective_actor', 'undefined_action_verb'].includes(w),
    )
    expect(editorialWarnings).toEqual([])
  })

  it('does NOT warn on an explicit-tradeoff IT policy dilemma with "ma raddoppia" + "quale ingiustizia accetti"', () => {
    const result = runQualityGates({
      ...VALID_BASE,
      locale: 'it',
      question: 'Se un reddito universale salva chi resta fuori dal lavoro ma raddoppia le tasse a chi ha già costruito stabilità, quale ingiustizia accetti?',
      optionA: 'Approvarlo. Lasciare indietro chi cade è un costo più grave delle nuove tasse.',
      optionB: 'Respingerlo. Punire chi ha costruito è un costo che la società non regge a lungo.',
    })
    const editorialWarnings = result.warnings.filter((w) =>
      ['abstract_policy_question', 'support_oppose_framing', 'undefined_collective_actor', 'undefined_action_verb'].includes(w),
    )
    expect(editorialWarnings).toEqual([])
  })

  it('does NOT warn on an explicit-tradeoff EN policy dilemma with "which cost do you accept"', () => {
    const result = runQualityGates({
      ...VALID_BASE,
      question: 'A foreign-owned app is a real security risk, but banning it hands the state the power to close any platform later — which cost do you accept?',
      optionA: 'Ban it. Collective safety has to come before digital comfort.',
      optionB: 'Keep it open. A power of censorship outlives the emergency that justified it.',
    })
    const editorialWarnings = result.warnings.filter((w) =>
      ['abstract_policy_question', 'support_oppose_framing', 'undefined_collective_actor', 'undefined_action_verb'].includes(w),
    )
    expect(editorialWarnings).toEqual([])
  })

  it('does NOT fire editorial-shape warnings on a clean concrete-actor moral dilemma', () => {
    const result = runQualityGates({
      ...VALID_BASE,
      question: 'Your closest friend tells you in confidence that they cheated on their partner. The partner is also your friend.',
      optionA: "Tell the partner. They have a right to know the relationship they're in.",
      optionB: "Stay silent. Their relationship is not yours to break open.",
    })
    const editorialWarnings = result.warnings.filter((w) =>
      ['abstract_policy_question', 'support_oppose_framing', 'undefined_collective_actor', 'undefined_action_verb'].includes(w),
    )
    expect(editorialWarnings).toEqual([])
  })

  it('does NOT fire editorial-shape warnings on lifestyle dilemmas even with referendum surface words', () => {
    const result = runQualityGates({
      ...VALID_BASE,
      category: 'lifestyle',
      dilemmaStyle: 'lifestyle',
      // Deliberately contains "support" + "ban" surface tokens — they
      // must be ignored entirely on lifestyle items.
      question: 'Coffee or tea? Should countries ban one of them?',
      optionA: 'Coffee',
      optionB: 'Tea',
      scores: { noveltyScore: 20, finalScore: 40 },
    })
    const editorialWarnings = result.warnings.filter((w) =>
      ['abstract_policy_question', 'support_oppose_framing', 'undefined_collective_actor', 'undefined_action_verb'].includes(w),
    )
    expect(editorialWarnings).toEqual([])
  })

  it('editorial-shape warnings do NOT block passed=true', () => {
    const result = runQualityGates({
      ...VALID_BASE,
      locale: 'it',
      question: "Se un Paese rifiuta regole sull'AI, gli altri dovrebbero rallentare comunque?",
      optionA: 'Rallentare. La prudenza viene prima della corsa tecnologica.',
      optionB: 'Andare avanti. Restare indietro sarebbe peggio nel medio periodo.',
    })
    expect(result.warnings).toContain('undefined_collective_actor')
    expect(result.reasons).toEqual([])
    expect(result.passed).toBe(true)
  })
})

describe('runQualityGates — punchy framing warnings (AI-PROMPT-PUNCHY-FRAMING-01, 26 May 2026)', () => {
  it('flags missing_personal_stake when no second-person pronoun is in the question', () => {
    const result = runQualityGates({
      ...VALID_BASE,
      question: 'A nation shifts to opt-out organ donation. Is presumed consent ethical or a violation?',
      optionA: 'Allow it. Lives saved outweigh the procedural concern.',
      optionB: 'Refuse it. Explicit consent is non-negotiable for bodies.',
    })
    expect(result.warnings).toContain('missing_personal_stake')
  })

  it('does NOT flag missing_personal_stake when "your" is in the question', () => {
    const result = runQualityGates({
      ...VALID_BASE,
      question: 'You can edit your future child\'s genes to remove a painful disease. Would you do it?',
      optionA: 'Edit. Save your child from real pain.',
      optionB: 'Refuse. Do not open that door for everyone else.',
    })
    expect(result.warnings.some((w) => w === 'missing_personal_stake')).toBe(false)
  })

  it('does NOT flag missing_personal_stake when Italian "tu" or "tuo" is present', () => {
    const result = runQualityGates({
      ...VALID_BASE,
      locale: 'it',
      question: 'Tuo figlio rischia una malattia genetica. Modifichi i suoi geni o accetti il rischio?',
      optionA: 'Modifica. Salva tuo figlio dal dolore.',
      optionB: 'Rifiuta. Non aprire quella porta per gli altri.',
    })
    expect(result.warnings.some((w) => w === 'missing_personal_stake')).toBe(false)
  })

  it('flags wordy_setup_question when question >28 words and no decision verb', () => {
    const result = runQualityGates({
      ...VALID_BASE,
      question:
        'An unexpected diagnosis leaves your parent needing daily, hands-on care, and they long to stay at home. Your hard-earned career is finally taking off and you are the primary earner for your own family.',
      optionA: 'Leave the career. Care for your parent at home.',
      optionB: 'Hire professional care. Keep providing for your family.',
    })
    expect(result.warnings).toContain('wordy_setup_question')
  })

  it('does NOT flag wordy_setup_question when a decision verb closes the question', () => {
    const result = runQualityGates({
      ...VALID_BASE,
      question:
        'An unexpected diagnosis leaves your parent needing daily, hands-on care, and they long to stay at home. Your career is finally taking off and you are the primary earner for your family — what do you choose?',
      optionA: 'Leave the career. Care for your parent at home.',
      optionB: 'Hire professional care. Keep providing for your family.',
    })
    expect(result.warnings.some((w) => w === 'wordy_setup_question')).toBe(false)
  })

  it('flags wordy_option:optionA when optionA exceeds 22 words', () => {
    const result = runQualityGates({
      ...VALID_BASE,
      question: 'You witness a friend cheat in an exam. Would you report them?',
      optionA:
        'Report it. The integrity of the exam matters more than the friendship, because cheating undermines the fairness of the entire assessment system for every student who studied honestly.',
      optionB: 'Stay silent. Loyalty wins.',
    })
    expect(result.warnings).toContain('wordy_option:optionA')
  })

  it('flags wordy_option:optionB when optionB exceeds 22 words', () => {
    const result = runQualityGates({
      ...VALID_BASE,
      question: 'You witness a friend cheat in an exam. Would you report them?',
      optionA: 'Report it. Integrity wins.',
      optionB:
        'Stay silent. Loyalty matters more than the exam outcome, because you cannot expect a friendship to survive being the one who turned a friend in for what is ultimately a small infraction.',
    })
    expect(result.warnings).toContain('wordy_option:optionB')
  })

  it('lifestyle is exempt from punchy-framing warnings', () => {
    const result = runQualityGates({
      ...VALID_BASE,
      category: 'lifestyle',
      dilemmaStyle: 'lifestyle',
      question: 'Coffee or tea on a quiet Sunday morning before breakfast at home?',
      optionA: 'Coffee',
      optionB: 'Tea',
      scores: { noveltyScore: 20, finalScore: 40 },
    })
    expect(result.warnings.some((w) => w === 'missing_personal_stake')).toBe(false)
    expect(result.warnings.some((w) => w === 'wordy_setup_question')).toBe(false)
    expect(result.warnings.some((w) => w.startsWith('wordy_option'))).toBe(false)
  })

  it('punchy-framing warnings are advisory, never blocking', () => {
    const result = runQualityGates({
      ...VALID_BASE,
      question:
        'Should the justice system prioritize the inmate\'s proven rehabilitation or the victims\' need for a sense of finality and punishment after decades have passed in prison?',
      optionA: 'Grant early release. Rehabilitation is the goal.',
      optionB:
        'Deny early release. The severity of the crime demands that the original sentence be served to uphold justice for the victims who still suffer daily.',
    })
    expect(result.warnings).toContain('missing_personal_stake')
    expect(result.warnings).toContain('wordy_option:optionB')
    expect(result.reasons).toEqual([])
    expect(result.passed).toBe(true)
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
