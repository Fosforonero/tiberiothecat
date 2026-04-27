/**
 * SplitVote Personality System
 *
 * Calculates a user's moral profile based on their dilemma_votes choices.
 * Each dilemma is mapped to moral axes. Choices shift axis scores.
 * Final scores determine the user's archetype + SplitVote Sign.
 *
 * IMPORTANT: This is for fun only — not scientifically validated.
 * Copy always says "based on your SplitVote choices" not "you are X".
 */

// ── Moral Axes (5 bipolar dimensions) ─────────────────────────

export interface MoralAxis {
  id:          string
  name:        string
  nameIt:      string
  leftPole:    string  // low score
  leftPoleIt:  string
  rightPole:   string // high score
  rightPoleIt: string
  emoji:       string
}

export const MORAL_AXES: MoralAxis[] = [
  { id: 'utility',    name: 'Utility vs Principle',     nameIt: 'Utilità vs Principio',    leftPole: 'Consequentialist', leftPoleIt: 'Consequenzialista', rightPole: 'Deontologist',  rightPoleIt: 'Deontologista',  emoji: '⚖️' },
  { id: 'freedom',    name: 'Freedom vs Safety',        nameIt: 'Libertà vs Sicurezza',    leftPole: 'Liberatarian',     leftPoleIt: 'Libertario',        rightPole: 'Paternalist',   rightPoleIt: 'Paternalista',   emoji: '🗽' },
  { id: 'loyalty',    name: 'Loyalty vs Justice',       nameIt: 'Lealtà vs Giustizia',     leftPole: 'Loyalist',         leftPoleIt: 'Leale',             rightPole: 'Universalist',  rightPoleIt: 'Universalista',  emoji: '🤝' },
  { id: 'risk',       name: 'Risk vs Caution',          nameIt: 'Rischio vs Cautela',      leftPole: 'Risk-taker',       leftPoleIt: 'Temerario',         rightPole: 'Conservative',  rightPoleIt: 'Conservatore',   emoji: '🎲' },
  { id: 'individual', name: 'Individual vs Collective', nameIt: 'Individuo vs Collettivo', leftPole: 'Individualist',    leftPoleIt: 'Individualista',    rightPole: 'Collectivist',  rightPoleIt: 'Collettivista',  emoji: '🌐' },
]

// ── Axis scores per dilemma & choice ──────────────────────────
// For each scenario ID, map choice A/B to axis deltas.
// Delta: positive = rightPole, negative = leftPole.
// Unmapped dilemmas simply don't contribute to scores.

interface AxisDelta {
  axisId: string
  delta:  number // range -1 to +1
}

interface ScenarioMapping {
  A: AxisDelta[]
  B: AxisDelta[]
}

export const SCENARIO_AXIS_MAP: Record<string, ScenarioMapping> = {
  // Trolley: pull lever = utilitarian (utility-left), do nothing = deontological (utility-right)
  trolley: {
    A: [{ axisId: 'utility', delta: -1 }, { axisId: 'risk', delta: -0.5 }],
    B: [{ axisId: 'utility', delta: +1 }, { axisId: 'risk', delta: +0.5 }],
  },
  // Cure-secret: keep = individual benefit (individual-left), share = collective (individual-right)
  'cure-secret': {
    A: [{ axisId: 'individual', delta: -0.5 }, { axisId: 'utility', delta: -0.5 }],
    B: [{ axisId: 'individual', delta: +0.5 }, { axisId: 'utility', delta: +0.5 }],
  },
  // Memory-erase: take = risk-averse / safety (freedom-right, risk-right), refuse = freedom-left
  'memory-erase': {
    A: [{ axisId: 'freedom', delta: +0.5 }, { axisId: 'risk', delta: +0.5 }],
    B: [{ axisId: 'freedom', delta: -0.5 }, { axisId: 'risk', delta: -0.5 }],
  },
  // Steal-medicine: steal = individual/family loyalty (loyalty-left, utility-left), don't = justice (loyalty-right)
  'steal-medicine': {
    A: [{ axisId: 'loyalty', delta: -1 }, { axisId: 'utility', delta: -0.5 }],
    B: [{ axisId: 'loyalty', delta: +1 }, { axisId: 'utility', delta: +0.5 }],
  },
  // Organ-harvest: harvest = extreme utilitarianism
  'organ-harvest': {
    A: [{ axisId: 'utility', delta: -1 }, { axisId: 'individual', delta: -0.5 }],
    B: [{ axisId: 'utility', delta: +1 }, { axisId: 'individual', delta: +0.5 }],
  },
  // Mercy-kill: honor = freedom (freedom-left, risk-left), refuse = safety (freedom-right)
  'mercy-kill': {
    A: [{ axisId: 'freedom', delta: -1 }, { axisId: 'risk', delta: -0.5 }],
    B: [{ axisId: 'freedom', delta: +1 }, { axisId: 'risk', delta: +0.5 }],
  },
  // Whistleblower: report = justice (loyalty-right, individual-right), silent = loyalty-left
  'whistleblower': {
    A: [{ axisId: 'loyalty', delta: +1 }, { axisId: 'individual', delta: +0.5 }],
    B: [{ axisId: 'loyalty', delta: -1 }, { axisId: 'individual', delta: -0.5 }],
  },
  // Privacy-terror: give data = safety (freedom-right), refuse = freedom (freedom-left)
  'privacy-terror': {
    A: [{ axisId: 'freedom', delta: -1 }, { axisId: 'individual', delta: -0.5 }],
    B: [{ axisId: 'freedom', delta: +1 }, { axisId: 'individual', delta: +0.5 }],
  },
  // Rich-or-fair: rich = individual (individual-left, utility-left), fair = collective
  'rich-or-fair': {
    A: [{ axisId: 'individual', delta: -1 }, { axisId: 'utility', delta: -0.5 }],
    B: [{ axisId: 'individual', delta: +1 }, { axisId: 'utility', delta: +0.5 }],
  },
  // Robot-judge: trust AI = risk-left, reject = risk-right
  'robot-judge': {
    A: [{ axisId: 'risk', delta: -0.5 }, { axisId: 'utility', delta: -0.5 }],
    B: [{ axisId: 'risk', delta: +0.5 }, { axisId: 'utility', delta: +0.5 }],
  },
  // Whistleblower variant
  'confess-crime': {
    A: [{ axisId: 'loyalty', delta: +0.5 }, { axisId: 'risk', delta: -0.5 }],
    B: [{ axisId: 'loyalty', delta: -0.5 }, { axisId: 'risk', delta: +0.5 }],
  },
  // Surveillance-city: accept = safety (freedom-right, individual-right)
  'surveillance-city': {
    A: [{ axisId: 'freedom', delta: +0.5 }, { axisId: 'individual', delta: +0.5 }],
    B: [{ axisId: 'freedom', delta: -0.5 }, { axisId: 'individual', delta: -0.5 }],
  },
  // Mandatory-vaccine: mandate = collective (individual-right, freedom-right), oppose = freedom
  'mandatory-vaccine': {
    A: [{ axisId: 'individual', delta: +0.5 }, { axisId: 'freedom', delta: +0.5 }],
    B: [{ axisId: 'individual', delta: -0.5 }, { axisId: 'freedom', delta: -0.5 }],
  },
  // Censor-speech: censor = safety/collective (freedom-right, individual-right)
  'censor-speech': {
    A: [{ axisId: 'freedom', delta: +0.5 }, { axisId: 'individual', delta: +0.5 }],
    B: [{ axisId: 'freedom', delta: -0.5 }, { axisId: 'individual', delta: -0.5 }],
  },
  // AI-replaces-jobs: embrace = utility-left, resist = individual-right
  'ai-replaces-jobs': {
    A: [{ axisId: 'utility', delta: -0.5 }, { axisId: 'risk', delta: -0.5 }],
    B: [{ axisId: 'utility', delta: +0.5 }, { axisId: 'risk', delta: +0.5 }],
  },
  // Tax-billionaires: tax = collective (individual-right, utility-right)
  'tax-billionaires': {
    A: [{ axisId: 'individual', delta: +0.5 }, { axisId: 'utility', delta: -0.5 }],
    B: [{ axisId: 'individual', delta: -0.5 }, { axisId: 'utility', delta: +0.5 }],
  },
  // Open-borders: open = collective (individual-right), closed = individual-left
  'open-borders': {
    A: [{ axisId: 'individual', delta: +0.5 }, { axisId: 'freedom', delta: -0.5 }],
    B: [{ axisId: 'individual', delta: -0.5 }, { axisId: 'freedom', delta: +0.5 }],
  },
  // Universal basic income: support = collective (individual-right)
  'universal-basic-income': {
    A: [{ axisId: 'individual', delta: +0.5 }, { axisId: 'utility', delta: -0.5 }],
    B: [{ axisId: 'individual', delta: -0.5 }, { axisId: 'utility', delta: +0.5 }],
  },
  // Report-friend: report = justice (loyalty-right), protect = loyalty
  'report-friend': {
    A: [{ axisId: 'loyalty', delta: +1 }, { axisId: 'risk', delta: -0.5 }],
    B: [{ axisId: 'loyalty', delta: -1 }, { axisId: 'risk', delta: +0.5 }],
  },
  // Sibling-secret: keep = loyalty-left, tell = loyalty-right
  'sibling-secret': {
    A: [{ axisId: 'loyalty', delta: -0.5 }, { axisId: 'risk', delta: -0.5 }],
    B: [{ axisId: 'loyalty', delta: +0.5 }, { axisId: 'risk', delta: +0.5 }],
  },
  // Forgive-cheater: forgive = risk-left (takes chance), leave = risk-right
  'forgive-cheater': {
    A: [{ axisId: 'loyalty', delta: -0.5 }, { axisId: 'risk', delta: -0.5 }],
    B: [{ axisId: 'loyalty', delta: +0.5 }, { axisId: 'risk', delta: +0.5 }],
  },
  // Save-partner-vs-stranger: partner = loyalty-left (in-group), stranger = individual-right
  'save-partner-vs-stranger': {
    A: [{ axisId: 'loyalty', delta: -1 }, { axisId: 'individual', delta: -0.5 }],
    B: [{ axisId: 'loyalty', delta: +1 }, { axisId: 'individual', delta: +0.5 }],
  },
}

// ── Archetypes (6 moral personalities) ────────────────────────

export interface Archetype {
  id:            string
  name:          string
  nameIt:        string
  sign:          string // SplitVote Sign
  signIt:        string
  signEmoji:     string
  tagline:       string
  taglineIt:     string
  description:   string
  descriptionIt: string
  traits:        string[]
  traitsIt:      string[]
  color:         string   // Tailwind color class
  glow:          string
  shareText:     string
  shareTextIt:   string
}

export const ARCHETYPES: Archetype[] = [
  {
    id: 'guardian',
    name: 'The Guardian',
    nameIt: 'Il Guardiano',
    sign: 'The Scale',
    signIt: 'La Bilancia',
    signEmoji: '⚖️',
    tagline: 'Rules exist for a reason.',
    taglineIt: 'Le regole esistono per una ragione.',
    description: "You believe in principles, fairness, and the rule of law. When faced with impossible choices, you side with what's right — not what's easy. The world needs people like you.",
    descriptionIt: "Credi nei principi, nell'equità e nello stato di diritto. Di fronte a scelte impossibili, scegli ciò che è giusto — non ciò che è facile. Il mondo ha bisogno di persone come te.",
    traits: ['Principled', 'Reliable', 'Just', 'Cautious'],
    traitsIt: ['Principiato', 'Affidabile', 'Giusto', 'Prudente'],
    color: 'text-blue-400',
    glow: 'neon-glow-blue',
    shareText: "My SplitVote personality is The Guardian ⚖️ — I vote with my principles, not my gut. What's yours?",
    shareTextIt: "La mia personalità SplitVote è Il Guardiano ⚖️ — voto seguendo i miei principi, non l'istinto. E la tua?",
  },
  {
    id: 'rebel',
    name: 'The Rebel',
    nameIt: 'Il Ribelle',
    sign: 'The Flame',
    signIt: 'La Fiamma',
    signEmoji: '🔥',
    tagline: 'Rules were made to be broken.',
    taglineIt: 'Le regole sono fatte per essere infrante.',
    description: "You follow your own moral compass. Individual freedom and authenticity matter more to you than institutions or consensus. You'd risk everything for what you believe in.",
    descriptionIt: "Segui la tua bussola morale. La libertà individuale e l'autenticità ti stanno più a cuore delle istituzioni o del consenso. Rischieresti tutto per ciò in cui credi.",
    traits: ['Fearless', 'Independent', 'Authentic', 'Unpredictable'],
    traitsIt: ['Intrepido', 'Indipendente', 'Autentico', 'Imprevedibile'],
    color: 'text-red-400',
    glow: 'neon-glow-red',
    shareText: "My SplitVote personality is The Rebel 🔥 — I follow my own moral compass, consequences be damned. What's yours?",
    shareTextIt: "La mia personalità SplitVote è Il Ribelle 🔥 — seguo la mia bussola morale, conseguenze incluse. E la tua?",
  },
  {
    id: 'oracle',
    name: 'The Oracle',
    nameIt: "L'Oracolo",
    sign: 'The Compass',
    signIt: 'La Bussola',
    signEmoji: '🧭',
    tagline: 'The greatest good for the greatest number.',
    taglineIt: 'Il massimo bene per il massimo numero.',
    description: "You're a natural utilitarian. You weigh outcomes, crunch consequences, and make the hard call. Some call it cold — you call it rational. Every decision is calculated.",
    descriptionIt: "Sei un utilitarista naturale. Valuti i risultati, calcoli le conseguenze e prendi la decisione difficile. Qualcuno lo chiama freddezza — tu lo chiami razionalità. Ogni decisione è calcolata.",
    traits: ['Analytical', 'Strategic', 'Rational', 'Decisive'],
    traitsIt: ['Analitico', 'Strategico', 'Razionale', 'Deciso'],
    color: 'text-cyan-400',
    glow: 'neon-glow-cyan',
    shareText: "My SplitVote personality is The Oracle 🧭 — I optimize for outcomes, not feelings. What's yours?",
    shareTextIt: "La mia personalità SplitVote è L'Oracolo 🧭 — ottimizzo i risultati, non i sentimenti. E la tua?",
  },
  {
    id: 'diplomat',
    name: 'The Diplomat',
    nameIt: 'Il Diplomatico',
    sign: 'The Star',
    signIt: 'La Stella',
    signEmoji: '⭐',
    tagline: 'Together we go further.',
    taglineIt: 'Insieme si va più lontano.',
    description: "Community, solidarity, and collective good are your north stars. You balance personal loyalty with universal justice. You make decisions that consider everyone — not just yourself.",
    descriptionIt: "La comunità, la solidarietà e il bene collettivo sono le tue stelle polari. Bilanci la lealtà personale con la giustizia universale. Prendi decisioni che considerano tutti — non solo te stesso.",
    traits: ['Empathetic', 'Balanced', 'Collaborative', 'Fair'],
    traitsIt: ['Empatico', 'Equilibrato', 'Collaborativo', 'Equo'],
    color: 'text-yellow-400',
    glow: 'neon-glow-yellow',
    shareText: "My SplitVote personality is The Diplomat ⭐ — I vote for the collective good. What's yours?",
    shareTextIt: "La mia personalità SplitVote è Il Diplomatico ⭐ — voto per il bene collettivo. E la tua?",
  },
  {
    id: 'strategist',
    name: 'The Strategist',
    nameIt: 'Lo Stratega',
    sign: 'The Shadow',
    signIt: "L'Ombra",
    signEmoji: '🌑',
    tagline: 'Play the long game.',
    taglineIt: 'Gioca sul lungo periodo.',
    description: "You see the chess board, not just the pieces. Risk, timing, and calculated loyalty define your choices. You protect what matters — sometimes in ways others don't expect.",
    descriptionIt: "Vedi la scacchiera, non solo i pezzi. Rischio, tempistica e lealtà calcolata definiscono le tue scelte. Proteggi ciò che conta — a volte in modi che gli altri non si aspettano.",
    traits: ['Tactical', 'Patient', 'Loyal to few', 'Risk-aware'],
    traitsIt: ['Tattico', 'Paziente', 'Fedele ai pochi', 'Lungimirante'],
    color: 'text-purple-400',
    glow: 'neon-glow-purple',
    shareText: "My SplitVote personality is The Strategist 🌑 — I play the long game on every moral dilemma. What's yours?",
    shareTextIt: "La mia personalità SplitVote è Lo Stratega 🌑 — gioco sul lungo periodo su ogni dilemma morale. E la tua?",
  },
  {
    id: 'empath',
    name: 'The Empath',
    nameIt: "L'Empatico",
    sign: 'The Wave',
    signIt: "L'Onda",
    signEmoji: '🌊',
    tagline: 'Feel first, decide later.',
    taglineIt: 'Prima sento, poi decido.',
    description: "You lead with your heart. Loyalty, compassion, and protecting those close to you drive your choices. You believe people — not systems — are what matter most.",
    descriptionIt: "Guidi con il cuore. Lealtà, compassione e protezione di chi ami guidano le tue scelte. Credi che le persone — non i sistemi — siano ciò che conta di più.",
    traits: ['Compassionate', 'Loyal', 'Intuitive', 'Protective'],
    traitsIt: ['Compassionevole', 'Fedele', 'Intuitivo', 'Protettivo'],
    color: 'text-green-400',
    glow: 'neon-glow-cyan',
    shareText: "My SplitVote personality is The Empath 🌊 — I vote with my heart, not a spreadsheet. What's yours?",
    shareTextIt: "La mia personalità SplitVote è L'Empatico 🌊 — voto con il cuore, non con un foglio di calcolo. E la tua?",
  },
]

// ── Profile calculation ────────────────────────────────────────

export interface UserVoteInput {
  dilemma_id: string
  choice: string // 'A' or 'B' (uppercase)
}

export interface MoralProfile {
  axes:     Record<string, number> // axisId → score [-5, +5], clamped
  archetype: Archetype
  sign:     string
  signEmoji: string
  topTraits: string[]
  votesAnalyzed: number
  confidence: 'low' | 'medium' | 'high'
  communityLabel: string  // how this compares to typical users
}

/**
 * Calculate a user's moral profile from their vote history.
 * Requires at least 3 votes for a meaningful result.
 */
export function calculateProfile(votes: UserVoteInput[]): MoralProfile | null {
  if (votes.length === 0) return null

  // Initialize axis accumulators
  const axisScores: Record<string, number> = {}
  const axisVotes: Record<string, number> = {}
  for (const axis of MORAL_AXES) {
    axisScores[axis.id] = 0
    axisVotes[axis.id] = 0
  }

  let votesAnalyzed = 0

  for (const vote of votes) {
    const mapping = SCENARIO_AXIS_MAP[vote.dilemma_id]
    if (!mapping) continue

    const choiceKey = vote.choice.toUpperCase() as 'A' | 'B'
    const deltas = mapping[choiceKey] ?? []

    for (const delta of deltas) {
      axisScores[delta.axisId] += delta.delta
      axisVotes[delta.axisId]++
    }
    votesAnalyzed++
  }

  // Normalize scores to [-5, +5] range
  const normalized: Record<string, number> = {}
  for (const axis of MORAL_AXES) {
    const count = axisVotes[axis.id]
    if (count === 0) {
      normalized[axis.id] = 0 // neutral
    } else {
      // raw score / count gives avg delta per vote in [-1, +1]
      // scale to [-5, +5]
      normalized[axis.id] = Math.max(-5, Math.min(5, (axisScores[axis.id] / count) * 5))
    }
  }

  // ── Pick archetype based on dominant axis patterns ──
  const archetype = pickArchetype(normalized)

  const confidence: 'low' | 'medium' | 'high' =
    votesAnalyzed < 3 ? 'low' :
    votesAnalyzed < 8 ? 'medium' : 'high'

  const communityLabel = getCommunityLabel(normalized)

  return {
    axes: normalized,
    archetype,
    sign: archetype.sign,
    signEmoji: archetype.signEmoji,
    topTraits: archetype.traits.slice(0, 3),
    votesAnalyzed,
    confidence,
    communityLabel,
  }
}

function pickArchetype(scores: Record<string, number>): Archetype {
  const { utility, freedom, loyalty, risk, individual } = scores

  // Scoring heuristic: check dominant axes and their directions
  // Each archetype has a characteristic axis "fingerprint"

  // Guardian: high utility (consequentialist... wait, high utility = rightPole = deontologist)
  // Actually: utility rightPole = Deontologist (principle-based), leftPole = Consequentialist
  // Let me rethink: positive utility = deontological = principle first
  //   positive freedom = paternalist/safety-focused
  //   positive loyalty = universalist/justice
  //   positive risk = conservative/cautious
  //   positive individual = collectivist

  // Guardian: principled (utility high) + cautious (risk high) + justice (loyalty high)
  const guardianScore = (utility > 0 ? utility : 0) + (loyalty > 0 ? loyalty * 0.5 : 0) + (risk > 0 ? risk * 0.5 : 0)

  // Rebel: freedom low (libertarian) + risk low (risk-taker) + individual low (individualist)
  const rebelScore = (freedom < 0 ? -freedom : 0) + (risk < 0 ? -risk * 0.5 : 0) + (individual < 0 ? -individual * 0.5 : 0)

  // Oracle: utility low (consequentialist/utilitarian) + risk moderate
  const oracleScore = (utility < 0 ? -utility : 0) + Math.abs(risk) * 0.3

  // Diplomat: individual high (collectivist) + loyalty high (universalist)
  const diplomatScore = (individual > 0 ? individual : 0) + (loyalty > 0 ? loyalty * 0.5 : 0)

  // Strategist: loyalty low (loyalist to few) + risk high (conservative about big bets)
  const strategistScore = (loyalty < 0 ? -loyalty * 0.7 : 0) + (risk > 0 ? risk * 0.3 : 0)

  // Empath: loyalty low (loyal to inner circle) + freedom high (safety for loved ones)
  const empathScore = (loyalty < 0 ? -loyalty * 0.5 : 0) + (freedom > 0 ? freedom * 0.5 : 0) + (individual < 0 ? -individual * 0.3 : 0)

  const allScores: [string, number][] = [
    ['guardian', guardianScore],
    ['rebel', rebelScore],
    ['oracle', oracleScore],
    ['diplomat', diplomatScore],
    ['strategist', strategistScore],
    ['empath', empathScore],
  ]

  // Find highest-scoring archetype
  allScores.sort((a, b) => b[1] - a[1])
  const winnerId = allScores[0][0]

  return ARCHETYPES.find(a => a.id === winnerId) ?? ARCHETYPES[3] // default: Diplomat
}

export function getCommunityLabel(scores: Record<string, number>, locale: 'en' | 'it' = 'en'): string {
  const avgScore = Object.values(scores).reduce((s, v) => s + Math.abs(v), 0) / MORAL_AXES.length
  if (locale === 'it') {
    if (avgScore < 1) return 'Nel mezzo — vedi entrambi i lati'
    if (avgScore < 2.5) return 'Tendente a un lato su molti dilemmi'
    return 'Convinzioni morali forti — sai esattamente dove stai'
  }
  if (avgScore < 1) return 'In the moral middle ground — you see both sides'
  if (avgScore < 2.5) return 'Leaning toward one side on most dilemmas'
  return 'Strong moral convictions — you know exactly where you stand'
}

// ── Axis label helpers ─────────────────────────────────────────

/**
 * Get the dominant pole label for an axis score.
 * Score < -1 → leftPole label, score > +1 → rightPole label, else 'Balanced'
 */
export function getAxisLabel(axis: MoralAxis, score: number, locale: 'en' | 'it' = 'en'): string {
  if (score < -1.5) return locale === 'it' ? axis.leftPoleIt : axis.leftPole
  if (score > +1.5) return locale === 'it' ? axis.rightPoleIt : axis.rightPole
  return locale === 'it' ? 'Equilibrato' : 'Balanced'
}
