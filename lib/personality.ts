/**
 * SplitVote Personality System
 *
 * Calculates a user's moral profile based on their dilemma_votes choices.
 * Each dilemma is mapped to moral axes. Choices shift axis scores.
 * Final scores are compared to archetype target profiles via Euclidean
 * distance — the closest archetype wins.
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
  { id: 'freedom',    name: 'Freedom vs Safety',        nameIt: 'Libertà vs Sicurezza',    leftPole: 'Libertarian',      leftPoleIt: 'Libertario',        rightPole: 'Paternalist',   rightPoleIt: 'Paternalista',   emoji: '🗽' },
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

// ── Archetypes (18 moral personalities) ───────────────────────

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
  // Target axis profile for Euclidean distance classification.
  // Values in [-5, +5]: positive = rightPole, negative = leftPole.
  // Omit or leave undefined only for legacy entries; all production archetypes define this.
  profile?:      Record<string, number>
}

export const ARCHETYPES: Archetype[] = [
  // ── Original 6 ──────────────────────────────────────────────
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
    traitsIt: ['Di principio', 'Affidabile', 'Giusto', 'Prudente'],
    color: 'text-blue-400',
    glow: 'neon-glow-blue',
    shareText: "My SplitVote personality is The Guardian ⚖️ — I vote with my principles, not my gut. What's yours?",
    shareTextIt: "La mia personalità SplitVote è Il Guardiano ⚖️ — voto seguendo i miei principi, non l'istinto. E la tua?",
    profile: { utility: 4, freedom: 1, loyalty: 2, risk: 3, individual: 1 },
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
    profile: { utility: -1, freedom: -4, loyalty: -1, risk: -3, individual: -3 },
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
    profile: { utility: -4, freedom: 0, loyalty: 1, risk: 0, individual: 1 },
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
    profile: { utility: 1, freedom: 1, loyalty: 3, risk: 1, individual: 4 },
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
    profile: { utility: -2, freedom: 0, loyalty: -3, risk: 3, individual: -1 },
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
    profile: { utility: 0, freedom: 3, loyalty: -3, risk: 1, individual: -2 },
  },

  // ── New 12 ───────────────────────────────────────────────────
  {
    id: 'idealist',
    name: 'The Idealist',
    nameIt: "L'Idealista",
    sign: 'The Torch',
    signIt: 'La Torcia',
    signEmoji: '✨',
    tagline: 'A better world is not just possible — it\'s necessary.',
    taglineIt: 'Un mondo migliore non è solo possibile — è necessario.',
    description: "You believe in universal rights and collective progress. Principles aren't abstract ideals to you — they're the blueprint for a better future. You take risks others won't because the cause is worth it.",
    descriptionIt: "Credi nei diritti universali e nel progresso collettivo. I principi non sono ideali astratti per te — sono il progetto per un futuro migliore. Rischi ciò che altri non osano perché la causa ne vale la pena.",
    traits: ['Principled', 'Bold', 'Collaborative', 'Hopeful'],
    traitsIt: ['Di principio', 'Audace', 'Collaborativo', 'Ottimista'],
    color: 'text-indigo-400',
    glow: 'neon-glow-blue',
    shareText: "My SplitVote personality is The Idealist ✨ — I vote for a better world, not just the easier choice. What's yours?",
    shareTextIt: "La mia personalità SplitVote è L'Idealista ✨ — voto per un mondo migliore, non per la scelta più facile. E la tua?",
    profile: { utility: 3, freedom: -1, loyalty: 3, risk: -2, individual: 3 },
  },
  {
    id: 'pragmatist',
    name: 'The Pragmatist',
    nameIt: 'Il Pragmatico',
    sign: 'The Gear',
    signIt: "L'Ingranaggio",
    signEmoji: '⚙️',
    tagline: 'What works is what\'s right.',
    taglineIt: 'Ciò che funziona è ciò che è giusto.',
    description: "You cut through the noise and focus on results. Ideology is a luxury when lives are on the line. You're cautious, realistic, and you trust your own judgment over abstract theories.",
    descriptionIt: "Tagli il rumore e ti concentri sui risultati. L'ideologia è un lusso quando le vite sono in gioco. Sei prudente, realistico e ti fidi del tuo giudizio più che delle teorie astratte.",
    traits: ['Realistic', 'Cautious', 'Self-reliant', 'Results-focused'],
    traitsIt: ['Realistico', 'Prudente', 'Autonomo', 'Orientato ai risultati'],
    color: 'text-slate-400',
    glow: 'neon-glow-purple',
    shareText: "My SplitVote personality is The Pragmatist ⚙️ — I care about what works, not what sounds good. What's yours?",
    shareTextIt: "La mia personalità SplitVote è Il Pragmatico ⚙️ — mi interessa ciò che funziona, non ciò che suona bene. E la tua?",
    profile: { utility: -3, freedom: 0, loyalty: 0, risk: 3, individual: -2 },
  },
  {
    id: 'protector',
    name: 'The Protector',
    nameIt: 'Il Protettore',
    sign: 'The Shield',
    signIt: 'Lo Scudo',
    signEmoji: '🛡️',
    tagline: "I'll do anything to keep my people safe.",
    taglineIt: 'Farò di tutto per tenere al sicuro le mie persone.',
    description: "Safety is your first priority — especially for the people closest to you. You'll bend rules, break conventions, and accept the consequences if it means protecting those you love.",
    descriptionIt: "La sicurezza è la tua prima priorità — specialmente per le persone più vicine a te. Piegherai le regole, romperai le convenzioni e accetterai le conseguenze pur di proteggere chi ami.",
    traits: ['Fierce', 'Devoted', 'Resourceful', 'Unyielding'],
    traitsIt: ['Feroce', 'Devoto', 'Intraprendente', 'Irremovibile'],
    color: 'text-orange-400',
    glow: 'neon-glow-red',
    shareText: "My SplitVote personality is The Protector 🛡️ — I put my people first, rules second. What's yours?",
    shareTextIt: "La mia personalità SplitVote è Il Protettore 🛡️ — prima le mie persone, poi le regole. E la tua?",
    profile: { utility: 1, freedom: 4, loyalty: -4, risk: -2, individual: -2 },
  },
  {
    id: 'truth-teller',
    name: 'The Truth-Teller',
    nameIt: "L'Onesto",
    sign: 'The Diamond',
    signIt: 'Il Diamante',
    signEmoji: '💎',
    tagline: 'Hard truths beat comfortable lies.',
    taglineIt: 'Le verità difficili valgono più delle bugie confortanti.',
    description: "You believe truth is sacred. Even when it's uncomfortable, unpopular, or costly, you say what needs to be said. You hold everyone — including yourself — to the same uncompromising standard.",
    descriptionIt: "Credi che la verità sia sacra. Anche quando è scomoda, impopolare o costosa, dici ciò che deve essere detto. Tieni tutti — te stesso incluso — allo stesso standard intransigente.",
    traits: ['Honest', 'Courageous', 'Uncompromising', 'Direct'],
    traitsIt: ['Onesto', 'Coraggioso', 'Intransigente', 'Diretto'],
    color: 'text-rose-400',
    glow: 'neon-glow-red',
    shareText: "My SplitVote personality is The Truth-Teller 💎 — I call it like I see it, no matter the cost. What's yours?",
    shareTextIt: "La mia personalità SplitVote è L'Onesto 💎 — dico le cose come stanno, qualunque sia il costo. E la tua?",
    profile: { utility: 3, freedom: -3, loyalty: 4, risk: -2, individual: 0 },
  },
  {
    id: 'pioneer',
    name: 'The Pioneer',
    nameIt: 'Il Pioniere',
    sign: 'The Rocket',
    signIt: 'Il Razzo',
    signEmoji: '🚀',
    tagline: 'Rules are for those who fear the future.',
    taglineIt: 'Le regole sono per chi teme il futuro.',
    description: "You charge into the unknown where others hesitate. Extreme risk is just the entry fee for discovery. You build your ethics from outcomes — and outcomes don't wait for permission.",
    descriptionIt: "Ti lanci nell'ignoto dove gli altri esitano. Il rischio estremo è solo il biglietto d'ingresso per la scoperta. Costruisci la tua etica dai risultati — e i risultati non chiedono permesso.",
    traits: ['Daring', 'Disruptive', 'Outcome-driven', 'Restless'],
    traitsIt: ['Audace', 'Dirompente', 'Determinato', 'Irrequieto'],
    color: 'text-amber-400',
    glow: 'neon-glow-yellow',
    shareText: "My SplitVote personality is The Pioneer 🚀 — I'd rather ask forgiveness than permission. What's yours?",
    shareTextIt: "La mia personalità SplitVote è Il Pioniere 🚀 — preferisco chiedere perdono che permesso. E la tua?",
    profile: { utility: -3, freedom: -3, loyalty: 0, risk: -4, individual: -1 },
  },
  {
    id: 'peacemaker',
    name: 'The Peacemaker',
    nameIt: 'Il Pacificatore',
    sign: 'The Dove',
    signIt: 'La Colomba',
    signEmoji: '🕊️',
    tagline: 'Every conflict has a middle ground.',
    taglineIt: 'Ogni conflitto ha una via di mezzo.',
    description: "You seek balance, consensus, and calm. Division unsettles you — not because you lack conviction, but because you believe cooperation is always the stronger path. Community comes first.",
    descriptionIt: "Cerchi equilibrio, consenso e calma. La divisione ti disturba — non perché ti manchino le convinzioni, ma perché credi che la cooperazione sia sempre la strada più forte. La comunità viene prima di tutto.",
    traits: ['Harmonious', 'Patient', 'Cooperative', 'Community-focused'],
    traitsIt: ['Armonioso', 'Paziente', 'Cooperativo', 'Orientato alla comunità'],
    color: 'text-teal-400',
    glow: 'neon-glow-cyan',
    shareText: "My SplitVote personality is The Peacemaker 🕊️ — I look for the bridge, not the battle. What's yours?",
    shareTextIt: "La mia personalità SplitVote è Il Pacificatore 🕊️ — cerco il ponte, non la battaglia. E la tua?",
    profile: { utility: 1, freedom: 2, loyalty: 2, risk: 4, individual: 3 },
  },
  {
    id: 'sentinel',
    name: 'The Sentinel',
    nameIt: 'La Sentinella',
    sign: 'The Watchtower',
    signIt: 'La Torre di Guardia',
    signEmoji: '🌅',
    tagline: 'Order is the foundation of everything.',
    taglineIt: "L'ordine è la base di tutto.",
    description: "You value security, structure, and institutional trust above all else. Not because you fear change — but because you understand what's lost when systems collapse. Caution is your superpower.",
    descriptionIt: "Valuti sicurezza, struttura e fiducia nelle istituzioni sopra ogni altra cosa. Non perché tu tema il cambiamento — ma perché capisci cosa si perde quando i sistemi collassano. La cautela è il tuo superpotere.",
    traits: ['Vigilant', 'Disciplined', 'Trustworthy', 'Methodical'],
    traitsIt: ['Vigile', 'Disciplinato', 'Affidabile', 'Metodico'],
    color: 'text-sky-400',
    glow: 'neon-glow-cyan',
    shareText: "My SplitVote personality is The Sentinel 🌅 — I guard what matters before chasing what's new. What's yours?",
    shareTextIt: "La mia personalità SplitVote è La Sentinella 🌅 — proteggo ciò che conta prima di inseguire il nuovo. E la tua?",
    profile: { utility: 3, freedom: 4, loyalty: 1, risk: 4, individual: 1 },
  },
  {
    id: 'advocate',
    name: 'The Advocate',
    nameIt: 'Il Difensore',
    sign: 'The Raised Fist',
    signIt: 'Il Pugno Alzato',
    signEmoji: '✊',
    tagline: 'Justice is only justice when it\'s for everyone.',
    taglineIt: 'La giustizia è tale solo quando è per tutti.',
    description: "You fight for those who can't fight for themselves. Collective good drives every choice you make — and when justice demands bold action, you don't flinch. Systems should serve people, not the other way around.",
    descriptionIt: "Combatti per chi non può farcela da solo. Il bene collettivo guida ogni tua scelta — e quando la giustizia richiede azioni audaci, non ti tiri indietro. I sistemi devono servire le persone, non il contrario.",
    traits: ['Passionate', 'Justice-driven', 'Fearless', 'Community-driven'],
    traitsIt: ['Appassionato', 'Orientato alla giustizia', 'Coraggioso', 'Solidale'],
    color: 'text-fuchsia-400',
    glow: 'neon-glow-purple',
    shareText: "My SplitVote personality is The Advocate ✊ — I always vote for those without a voice. What's yours?",
    shareTextIt: "La mia personalità SplitVote è Il Difensore ✊ — voto sempre per chi non ha voce. E la tua?",
    profile: { utility: -2, freedom: 1, loyalty: 4, risk: 0, individual: 4 },
  },
  {
    id: 'visionary',
    name: 'The Visionary',
    nameIt: 'Il Visionario',
    sign: 'The Comet',
    signIt: 'La Cometa',
    signEmoji: '🌠',
    tagline: 'The status quo is just a failure we haven\'t fixed yet.',
    taglineIt: 'Lo status quo è solo un fallimento che non abbiamo ancora risolto.',
    description: "You see what others can't imagine. Big change, collective futures, and bold experimentation are your domain. You take risks for a better tomorrow — even when that tomorrow is uncertain.",
    descriptionIt: "Vedi ciò che gli altri non riescono a immaginare. Il grande cambiamento, i futuri collettivi e la sperimentazione audace sono il tuo territorio. Rischi per un domani migliore — anche se quel domani è incerto.",
    traits: ['Imaginative', 'Ambitious', 'Progressive', 'Daring'],
    traitsIt: ['Immaginativo', 'Ambizioso', 'Progressista', 'Audace'],
    color: 'text-violet-400',
    glow: 'neon-glow-purple',
    shareText: "My SplitVote personality is The Visionary 🌠 — I vote for the world that could be. What's yours?",
    shareTextIt: "La mia personalità SplitVote è Il Visionario 🌠 — voto per il mondo che potrebbe essere. E la tua?",
    profile: { utility: -3, freedom: -1, loyalty: 2, risk: -3, individual: 3 },
  },
  {
    id: 'maverick',
    name: 'The Maverick',
    nameIt: 'Il Lupo Solitario',
    sign: 'The Lightning',
    signIt: 'Il Fulmine',
    signEmoji: '⚡',
    tagline: 'Belong to yourself first.',
    taglineIt: 'Appartieni prima di tutto a te stesso.',
    description: "Groups, institutions, and moral codes were invented by others — and you've never felt bound by them. You go your own way, trust your instincts, and don't need a crowd to validate your choices.",
    descriptionIt: "I gruppi, le istituzioni e i codici morali sono stati inventati da altri — e non ti sei mai sentito vincolato da essi. Vai per la tua strada, ti fidi del tuo istinto e non hai bisogno della folla per validare le tue scelte.",
    traits: ['Self-sufficient', 'Unconventional', 'Bold', 'Unfiltered'],
    traitsIt: ['Autosufficiente', 'Non convenzionale', 'Audace', 'Senza filtri'],
    color: 'text-zinc-400',
    glow: 'neon-glow-purple',
    shareText: "My SplitVote personality is The Maverick ⚡ — I write my own rules and own every choice. What's yours?",
    shareTextIt: "La mia personalità SplitVote è Il Lupo Solitario ⚡ — scrivo le mie regole e sono responsabile di ogni scelta. E la tua?",
    profile: { utility: 0, freedom: -2, loyalty: -1, risk: -2, individual: -5 },
  },
  {
    id: 'stoic',
    name: 'The Stoic',
    nameIt: 'Lo Stoico',
    sign: 'The Mountain',
    signIt: 'La Montagna',
    signEmoji: '⛰️',
    tagline: 'Reason. Endure. Repeat.',
    taglineIt: 'Ragiona. Resisti. Ripeti.',
    description: "You process hard choices with calm reason. Emotion clouds judgment — so you strip it away and think clearly. Principles guide you, caution grounds you, and philosophy gives you the tools to face anything.",
    descriptionIt: "Elabori le scelte difficili con ragione calma. Le emozioni offuscano il giudizio — quindi le metti da parte e pensi con chiarezza. I principi ti guidano, la cautela ti radica, la filosofia ti dà gli strumenti per affrontare qualsiasi cosa.",
    traits: ['Calm', 'Principled', 'Enduring', 'Self-disciplined'],
    traitsIt: ['Calmo', 'Di principio', 'Resistente', 'Autodisciplinato'],
    color: 'text-stone-400',
    glow: 'neon-glow-blue',
    shareText: "My SplitVote personality is The Stoic ⛰️ — I face every dilemma with reason, not fear. What's yours?",
    shareTextIt: "La mia personalità SplitVote è Lo Stoico ⛰️ — affronto ogni dilemma con la ragione, non con la paura. E la tua?",
    profile: { utility: 4, freedom: 0, loyalty: -1, risk: 4, individual: 0 },
  },
  {
    id: 'caretaker',
    name: 'The Caretaker',
    nameIt: 'Il Custode',
    sign: 'The Hearth',
    signIt: 'Il Focolare',
    signEmoji: '🤲',
    tagline: 'A society is only as strong as those it protects.',
    taglineIt: 'Una società è forte quanto chi protegge.',
    description: "You feel a deep responsibility for others' wellbeing. Safety, warmth, and community aren't just values — they're your purpose. You make decisions that create security, even when it costs you personally.",
    descriptionIt: "Senti una profonda responsabilità per il benessere degli altri. Sicurezza, calore e comunità non sono solo valori — sono il tuo scopo. Prendi decisioni che creano sicurezza, anche quando ti costa personalmente.",
    traits: ['Nurturing', 'Responsible', 'Steady', 'Community-minded'],
    traitsIt: ['Premuroso', 'Responsabile', 'Stabile', 'Orientato alla comunità'],
    color: 'text-pink-400',
    glow: 'neon-glow-cyan',
    shareText: "My SplitVote personality is The Caretaker 🤲 — I vote for the world I'd want everyone to live in. What's yours?",
    shareTextIt: "La mia personalità SplitVote è Il Custode 🤲 — voto per il mondo in cui vorrei che tutti vivessero. E la tua?",
    profile: { utility: 0, freedom: 2, loyalty: -1, risk: 2, individual: 4 },
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

  // ── Pick archetype by minimum Euclidean distance to target profile ──
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
  const axisIds = MORAL_AXES.map(a => a.id)
  let best: Archetype = ARCHETYPES[3] // default: diplomat
  let bestDistSq = Infinity

  for (const arch of ARCHETYPES) {
    if (!arch.profile) continue
    let distSq = 0
    for (const ax of axisIds) {
      const diff = (scores[ax] ?? 0) - (arch.profile[ax] ?? 0)
      distSq += diff * diff
    }
    if (distSq < bestDistSq) {
      bestDistSq = distSq
      best = arch
    }
  }

  return best
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
