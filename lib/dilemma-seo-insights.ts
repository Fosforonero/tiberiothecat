/**
 * lib/dilemma-seo-insights.ts
 *
 * Deterministic, no-AI helpers that produce per-dilemma SEO copy for the
 * `/play/[id]` and `/results/[id]` pages.
 *
 * The output is always:
 *   - short (max ~50 words per paragraph)
 *   - locale-aware (en / it)
 *   - category-anchored (free templates per category)
 *   - scenario-aware (interpolates `question`, `optionA`, `optionB`)
 *   - free of factual claims about the world ("SplitVote voters" framing only)
 *
 * No DB / Redis / AI calls. Pure functions. Safe to call in SSR.
 *
 * Caching contract: callers that bake these strings into a cached page
 * (results.tsx uses `revalidate = 60`) must not pass per-user info — the
 * helpers don't accept any. Voted state lives in the client component.
 */

import type { Category } from './scenarios'

export type InsightLocale = 'en' | 'it'

/** Minimal scenario surface needed by every helper. */
export interface InsightScenario {
  question: string
  optionA: string
  optionB: string
  category: Category
}

/** Aggregate vote stats. When omitted, results insight falls back to the
 *  category framing rather than referencing numbers. */
export interface InsightVoteStats {
  pctA: number
  pctB: number
  total: number
}

interface CategoryContext {
  /** Variants of the one-sentence framing. Picked deterministically by
   *  scenario id so two dilemmas in the same category don't render the
   *  same opening sentence. Keep 2-3 variants per category — more than
   *  that gets hard to maintain and the gain is marginal. */
  framings: string[]
  /** Variants of the thematic anchor pair used to phrase the options
   *  contrast. Picked alongside the framing to avoid identical templates
   *  across the highest-volume categories. */
  tensions: Array<{ a: string; b: string }>
  /** Default "what the split says" phrase when option-side framing
   *  doesn't fit (used as a fallback in results insight). Single string
   *  on purpose — it's a fallback path, not part of the per-page copy. */
  splitFallback: string
  /** Category-specific discussion prompts. The /play section renders 2 of
   *  these picked deterministically by scenario id. Without category-keyed
   *  prompts every page in the same locale would carry the same 2 bullets,
   *  amplifying duplicate-content risk across ~770 dilemma URLs. */
  prompts: string[]
}

const CATEGORY_CONTEXT: Record<InsightLocale, Record<Category, CategoryContext>> = {
  en: {
    morality: {
      framings: [
        'This is a right-vs-right question: every choice respects one value while sacrificing another.',
        'Moral dilemmas like this expose a gap between what feels principled and what feels workable.',
        'There is no clean answer here — the dilemma forces a trade between two legitimate moral claims.',
      ],
      tensions: [
        { a: 'a more principled outcome', b: 'a more pragmatic outcome' },
        { a: 'the cleaner moral line', b: 'the smaller real-world cost' },
        { a: 'consistency with one rule', b: 'attention to specific consequences' },
      ],
      splitFallback: 'how voters trade principles for consequences',
      prompts: [
        'What cost are you more willing to accept?',
        'Which value should matter more here?',
        'Would you defend this choice to someone affected by it?',
        'Is the principle worth the concrete cost?',
      ],
    },
    survival: {
      framings: [
        'Survival dilemmas force a trade between short-term safety and long-term cost.',
        'In high-stakes situations, the calmer option and the safer option often diverge.',
        'These questions test what you would actually do, not what sounds good in the abstract.',
      ],
      tensions: [
        { a: 'immediate safety', b: 'long-term cost' },
        { a: 'protecting yourself first', b: 'protecting others first' },
        { a: 'a hard but certain outcome', b: 'a softer but riskier outcome' },
      ],
      splitFallback: 'how voters balance immediate safety against later consequences',
      prompts: [
        'What cost are you more willing to accept?',
        'Could you live with the outcome you skipped?',
        'Who pays the price you avoid?',
        'Is the risk small enough to gamble on?',
      ],
    },
    loyalty: {
      framings: [
        'Loyalty dilemmas put personal bonds against broader honesty or fairness.',
        'When loyalty and truth pull in opposite directions, both sides feel like betrayal.',
        'These choices ask whose interests you protect first when you can’t protect everyone.',
      ],
      tensions: [
        { a: 'loyalty to people close to you', b: 'honesty toward everyone else' },
        { a: 'keeping a private trust', b: 'preventing a wider harm' },
        { a: 'standing by someone you know', b: 'siding with a rule you believe in' },
      ],
      splitFallback: 'how voters weigh loyalty against honesty',
      prompts: [
        'Whose trust would you protect first?',
        'Would you accept the same call against you?',
        'Where does loyalty stop being a virtue?',
        'What kind of person do you want to be in this story?',
      ],
    },
    justice: {
      framings: [
        'Justice questions ask whether the law, fairness, or mercy should lead the call.',
        'These dilemmas put rules and circumstances against each other and demand a verdict.',
        'No legal answer is the same as a moral answer here — both have to be argued.',
      ],
      tensions: [
        { a: 'the strict rule', b: 'a context-aware exception' },
        { a: 'equal treatment for all', b: 'proportionate response to one case' },
        { a: 'the letter of the law', b: 'the spirit behind it' },
      ],
      splitFallback: 'how voters split between rule and exception',
      prompts: [
        'Would you apply the same standard to yourself?',
        'Does context excuse the act, or just explain it?',
        'Who is the rule protecting, and who is paying for it?',
        'Is mercy a kind of justice here, or its opposite?',
      ],
    },
    freedom: {
      framings: [
        'Freedom dilemmas weigh personal autonomy against collective protection.',
        'These choices ask how much risk a society should accept so people can decide for themselves.',
        'Liberty and safety are both costs, not just benefits — every line drawn pays for the other.',
      ],
      tensions: [
        { a: 'personal freedom', b: 'collective safety' },
        { a: 'the right to choose', b: 'the duty to protect others' },
        { a: 'fewer restrictions now', b: 'fewer regrets later' },
      ],
      splitFallback: 'how voters trade freedom for safety',
      prompts: [
        'Whose freedom does this protect, and whose does it cost?',
        'Would you accept the rule if it applied to you?',
        'How much risk is the freedom worth?',
        'Is the safer option also the more honest one?',
      ],
    },
    technology: {
      framings: [
        'Tech dilemmas push convenience and capability against privacy, agency and risk.',
        'Every new capability quietly removes a previous choice — the question is whether that trade is worth it.',
        'Technology rarely asks for permission once it works, so the ethics has to land before deployment.',
      ],
      tensions: [
        { a: 'the capability it unlocks', b: 'the agency it costs' },
        { a: 'speed and reach', b: 'oversight and consent' },
        { a: 'what the system makes easy', b: 'what it makes invisible' },
      ],
      splitFallback: 'how voters balance capability against risk',
      prompts: [
        'What would you give up to keep this capability?',
        'Who benefits from this, and who absorbs the risk?',
        'Could you reverse the choice if it backfired?',
        'Does ease here come at someone else’s expense?',
      ],
    },
    society: {
      framings: [
        'Society dilemmas ask whose costs and whose voices count when no one wins everything.',
        'These choices are rarely between good and bad — they are between different distributions of harm.',
        'Public-good questions surface the trade-offs that aggregate numbers usually hide.',
      ],
      tensions: [
        { a: 'broader fairness', b: 'concrete impact on individuals' },
        { a: 'long-term system health', b: 'short-term relief for some' },
        { a: 'rules that hold everyone the same', b: 'choices that account for difference' },
      ],
      splitFallback: 'how voters weigh broad fairness against concrete impact',
      prompts: [
        'Whose interests should count more here, and why?',
        'Would you accept the outcome from the losing side?',
        'Are we solving the problem or moving it?',
        'What does this say about what we collectively value?',
      ],
    },
    relationships: {
      framings: [
        'Relationship dilemmas weigh affection, honesty, and personal cost in close ties.',
        'In close relationships, the kindest choice and the truest choice rarely overlap perfectly.',
        'These questions ask what your love is actually willing to give up.',
      ],
      tensions: [
        { a: 'protecting the relationship', b: 'honouring the truth' },
        { a: 'short-term comfort for them', b: 'long-term respect from them' },
        { a: 'who you want to be for them', b: 'who you actually are' },
      ],
      splitFallback: 'how voters trade closeness against honesty',
      prompts: [
        'Would you want the other person to make the same call?',
        'Are you protecting them or yourself?',
        'Does silence still count as honesty here?',
        'Which version of the relationship are you choosing?',
      ],
    },
    lifestyle: {
      framings: [
        'Lifestyle dilemmas are smaller in scale but still reveal what you actually value day-to-day.',
        'The everyday choice you keep making says more about you than the dramatic one you would imagine making.',
        'These are low-stakes on paper and high-stakes for who you become.',
      ],
      tensions: [
        { a: 'comfort or routine', b: 'novelty or self-challenge' },
        { a: 'what feels good now', b: 'what you would respect later' },
        { a: 'fitting in with the room', b: 'staying true to your taste' },
      ],
      splitFallback: 'how voters split between comfort and change',
      prompts: [
        'Would you make this choice on a regular day?',
        'Who is the small version of you choosing for?',
        'What habit is this really voting in or out?',
        'Is this convenient, or actually what you want?',
      ],
    },
  },
  it: {
    morality: {
      framings: [
        'È una scelta giusto-contro-giusto: ogni opzione rispetta un valore sacrificandone un altro.',
        'I dilemmi morali come questo mettono in luce la distanza tra ciò che è di principio e ciò che è praticabile.',
        'Non c’è una risposta pulita: il dilemma obbliga a scegliere tra due pretese morali entrambe legittime.',
      ],
      tensions: [
        { a: 'un esito più di principio', b: 'un esito più pragmatico' },
        { a: 'la linea morale più pulita', b: 'il costo concreto più basso' },
        { a: 'coerenza con una regola', b: 'attenzione alle conseguenze specifiche' },
      ],
      splitFallback: 'come i votanti scambiano i principi con le conseguenze',
      prompts: [
        'Quale costo sei più disposto ad accettare?',
        'Quale valore dovrebbe pesare di più qui?',
        'Difenderesti questa scelta davanti a chi ne paga il prezzo?',
        'Il principio vale il costo concreto?',
      ],
    },
    survival: {
      framings: [
        'I dilemmi di sopravvivenza obbligano a scambiare sicurezza immediata e costo a lungo termine.',
        'Quando la posta è alta, l’opzione più tranquilla e quella più sicura raramente coincidono.',
        'Sono domande che misurano cosa faresti davvero, non cosa suona bene in astratto.',
      ],
      tensions: [
        { a: 'la sicurezza immediata', b: 'il costo a lungo termine' },
        { a: 'proteggere prima te stesso', b: 'proteggere prima gli altri' },
        { a: 'un esito duro ma certo', b: 'un esito più morbido ma rischioso' },
      ],
      splitFallback: 'come i votanti bilanciano sicurezza e conseguenze future',
      prompts: [
        'Quale costo sei più disposto ad accettare?',
        'Potresti convivere con l’esito che hai escluso?',
        'Chi paga il prezzo che eviti?',
        'Il rischio è abbastanza piccolo da scommetterci?',
      ],
    },
    loyalty: {
      framings: [
        'I dilemmi di lealtà mettono i legami personali contro un’onestà o equità più ampia.',
        'Quando lealtà e verità tirano in direzioni opposte, entrambe sembrano un tradimento.',
        'Queste scelte chiedono di chi proteggi gli interessi quando non puoi proteggere tutti.',
      ],
      tensions: [
        { a: 'la lealtà verso chi ti è vicino', b: 'l’onestà verso tutti gli altri' },
        { a: 'mantenere una fiducia privata', b: 'evitare un danno più ampio' },
        { a: 'restare dalla parte di chi conosci', b: 'schierarti con la regola in cui credi' },
      ],
      splitFallback: 'come i votanti pesano lealtà e onestà',
      prompts: [
        'Di chi vorresti proteggere la fiducia per primo?',
        'Accetteresti la stessa scelta fatta contro di te?',
        'Dove la lealtà smette di essere una virtù?',
        'Che persona vuoi essere in questa storia?',
      ],
    },
    justice: {
      framings: [
        'Le domande di giustizia chiedono se debba prevalere la legge, l’equità o la pietà.',
        'Questi dilemmi mettono regole e circostanze l’una contro l’altra e chiedono un verdetto.',
        'Nessuna risposta legale equivale automaticamente a una risposta morale: entrambe vanno argomentate.',
      ],
      tensions: [
        { a: 'la regola rigida', b: 'l’eccezione legata al contesto' },
        { a: 'trattamento uguale per tutti', b: 'risposta proporzionata al singolo caso' },
        { a: 'la lettera della legge', b: 'lo spirito che la motiva' },
      ],
      splitFallback: 'come i votanti si dividono tra regola ed eccezione',
      prompts: [
        'Applicheresti lo stesso standard a te stesso?',
        'Il contesto scusa il gesto o solo lo spiega?',
        'Chi protegge questa regola e chi la paga?',
        'La pietà è qui una forma di giustizia o l’opposto?',
      ],
    },
    freedom: {
      framings: [
        'I dilemmi sulla libertà pesano l’autonomia personale contro la protezione collettiva.',
        'Queste scelte chiedono quanto rischio una società debba accettare per lasciare decidere alle persone.',
        'Libertà e sicurezza sono entrambe costi, non solo benefici: ogni linea tracciata paga l’altra.',
      ],
      tensions: [
        { a: 'la libertà personale', b: 'la sicurezza collettiva' },
        { a: 'il diritto di scegliere', b: 'il dovere di proteggere gli altri' },
        { a: 'meno vincoli ora', b: 'meno rimpianti dopo' },
      ],
      splitFallback: 'come i votanti scambiano libertà e sicurezza',
      prompts: [
        'Di chi protegge la libertà questa scelta, e di chi è il costo?',
        'Accetteresti la stessa regola applicata a te?',
        'Quanto rischio vale questa libertà?',
        'L’opzione più sicura è anche la più onesta?',
      ],
    },
    technology: {
      framings: [
        'I dilemmi tech mettono comodità e potenza contro privacy, autonomia e rischio.',
        'Ogni nuova capacità sottrae silenziosamente una scelta precedente: la domanda è se lo scambio vale.',
        'La tecnologia raramente chiede permesso una volta che funziona: l’etica deve arrivare prima del lancio.',
      ],
      tensions: [
        { a: 'la capacità che sblocca', b: 'l’autonomia che ti costa' },
        { a: 'velocità e portata', b: 'controllo e consenso' },
        { a: 'ciò che il sistema rende facile', b: 'ciò che rende invisibile' },
      ],
      splitFallback: 'come i votanti bilanciano potenzialità e rischio',
      prompts: [
        'A cosa rinunceresti pur di mantenere questa capacità?',
        'Chi ne beneficia, e chi assorbe il rischio?',
        'Potresti tornare indietro se andasse male?',
        'La comodità qui è un costo che paga qualcun altro?',
      ],
    },
    society: {
      framings: [
        'I dilemmi sociali chiedono di chi siano i costi e quali voci contino quando nessuno vince tutto.',
        'Queste scelte raramente sono tra bene e male: sono tra diverse distribuzioni del danno.',
        'Le domande di bene pubblico mettono in luce trade-off che i numeri aggregati di solito nascondono.',
      ],
      tensions: [
        { a: 'l’equità più ampia', b: 'l’impatto concreto sulle persone' },
        { a: 'la tenuta del sistema nel lungo periodo', b: 'il sollievo immediato per alcuni' },
        { a: 'regole che valgono uguali per tutti', b: 'scelte che tengono conto delle differenze' },
      ],
      splitFallback: 'come i votanti pesano equità ampia e impatto concreto',
      prompts: [
        'Quali interessi dovrebbero contare di più qui?',
        'Accetteresti l’esito dalla parte che perde?',
        'Stiamo risolvendo il problema o solo spostandolo?',
        'Cosa dice questa scelta su cosa valutiamo come comunità?',
      ],
    },
    relationships: {
      framings: [
        'I dilemmi di relazione pesano affetto, onestà e costo personale dentro legami stretti.',
        'Nelle relazioni strette la scelta più gentile e quella più vera raramente coincidono del tutto.',
        'Queste domande chiedono cosa il tuo affetto sia davvero disposto a cedere.',
      ],
      tensions: [
        { a: 'proteggere la relazione', b: 'rispettare la verità' },
        { a: 'la comodità a breve per loro', b: 'il rispetto a lungo termine da parte loro' },
        { a: 'la versione di te che vorresti per loro', b: 'la versione di te che sei davvero' },
      ],
      splitFallback: 'come i votanti scambiano vicinanza e onestà',
      prompts: [
        'Vorresti che l’altra persona facesse la stessa scelta?',
        'Stai proteggendo loro o te stesso?',
        'Il silenzio qui conta ancora come onestà?',
        'Quale versione della relazione stai scegliendo?',
      ],
    },
    lifestyle: {
      framings: [
        'I dilemmi lifestyle hanno scala più piccola ma raccontano comunque cosa conta davvero ogni giorno.',
        'La scelta quotidiana che continui a fare dice di te più di quella drammatica che immagini di fare.',
        'Sulla carta sono a bassa posta, ma alta posta per chi diventi.',
      ],
      tensions: [
        { a: 'comodità e abitudine', b: 'novità o sfida con se stessi' },
        { a: 'ciò che fa stare bene ora', b: 'ciò che rispetteresti dopo' },
        { a: 'adattarsi alla stanza', b: 'restare fedele al tuo gusto' },
      ],
      splitFallback: 'come i votanti si dividono tra comodità e cambiamento',
      prompts: [
        'Faresti questa scelta in un giorno qualunque?',
        'Per chi sta scegliendo la versione piccola di te?',
        'Quale abitudine sta davvero votando dentro o fuori?',
        'È solo comodo o è proprio ciò che vuoi?',
      ],
    },
  },
}

/**
 * Returns the locale-aware category context for a dilemma. Use this when
 * you need the structured pieces (framings / tensions / splitFallback /
 * prompts) and want to compose copy yourself. Falls back to the morality
 * context for unknown categories so callers never crash on legacy rows.
 */
export function getDilemmaCategoryContext(
  category: Category,
  locale: InsightLocale,
): CategoryContext {
  return CATEGORY_CONTEXT[locale][category] ?? CATEGORY_CONTEXT[locale].morality
}

/** Wrap option text in quotes and trim trailing punctuation for cleaner sentences. */
function formatOption(text: string): string {
  const trimmed = text.replace(/[\s.!?:;]+$/, '').trim()
  return `“${trimmed}”`
}

/**
 * Cheap deterministic 32-bit hash of a string. Used to pick a stable copy
 * variant per dilemma so the same URL always renders the same framing /
 * prompts (good for cacheability + Google's content fingerprint). Not
 * cryptographic — collision risk is irrelevant for this use.
 */
function hash32(s: string): number {
  let h = 2166136261 >>> 0
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

/** Pick an element from `arr` deterministically by `seed`. */
function pickByHash<T>(arr: readonly T[], seed: string, offset = 0): T {
  return arr[(hash32(seed) + offset) % arr.length]
}

/**
 * "Why this dilemma matters" paragraph (used on /play). Composes:
 *   - category framing
 *   - per-option contrast using actual option labels
 */
export function getDilemmaSeoSummary({
  scenario,
  locale,
}: {
  scenario: InsightScenario
  locale: InsightLocale
}): string {
  const ctx = getDilemmaCategoryContext(scenario.category, locale)
  // Seed the variant pick on the question — always present, always unique
  // enough across the catalogue. Framing and tension use the same seed but
  // different offsets so we exercise more combinations across URLs.
  const seed = `${scenario.category}|${scenario.question}`
  const framing = pickByHash(ctx.framings, seed, 0)
  const tension = pickByHash(ctx.tensions, seed, 1)
  const a = formatOption(scenario.optionA)
  const b = formatOption(scenario.optionB)
  if (locale === 'it') {
    return `${framing} Scegliere ${a} privilegia ${tension.a}; scegliere ${b} dà più peso a ${tension.b}.`
  }
  return `${framing} Choosing ${a} prioritises ${tension.a}; choosing ${b} gives more weight to ${tension.b}.`
}

/**
 * Two short discussion prompts for the /play page. Stable per locale,
 * not interpolated — purpose is to invite thought, not to keyword-stuff.
 */
export function getDilemmaDiscussionPrompts({
  scenario,
  locale,
}: {
  scenario: InsightScenario
  locale: InsightLocale
}): string[] {
  const ctx = getDilemmaCategoryContext(scenario.category, locale)
  // Pick 2 prompts from the category-specific pool, deterministically by
  // scenario seed. Offset by 1 between picks so they're rarely identical.
  // When the pool has < 2 entries, dedup keeps the result short rather
  // than repeat — but every category ships with 4 prompts so the modulo
  // always lands on distinct picks in practice.
  const seed = `${scenario.category}|${scenario.question}`
  const first = pickByHash(ctx.prompts, seed, 0)
  const secondCandidate = pickByHash(ctx.prompts, seed, 1)
  const second = secondCandidate === first
    ? ctx.prompts[(ctx.prompts.indexOf(first) + 1) % ctx.prompts.length]
    : secondCandidate
  return [first, second]
}

/** Threshold (in percentage points) below which we call the result "divided". */
const TIE_THRESHOLD = 8

/**
 * "What the split says" paragraph (used on /results).
 *
 * If `voteStats` is omitted or `total === 0`, falls back to the category
 * framing — never references a number that doesn't exist.
 *
 * Never says "the world voted X" — always frames as "SplitVote voters".
 * Never claims SplitVote is representative.
 */
export function getResultsInsight({
  scenario,
  locale,
  voteStats,
}: {
  scenario: InsightScenario
  locale: InsightLocale
  voteStats?: InsightVoteStats
}): string {
  const ctx = getDilemmaCategoryContext(scenario.category, locale)
  const seed = `${scenario.category}|${scenario.question}`
  const framing = pickByHash(ctx.framings, seed, 0)
  const tension = pickByHash(ctx.tensions, seed, 1)
  // Fallback: no votes yet — show a framing variant only.
  if (!voteStats || voteStats.total === 0) {
    if (locale === 'it') {
      return `${framing} Quando arriveranno i voti, questa sezione mostrerà ${ctx.splitFallback}.`
    }
    return `${framing} Once votes come in, this section will show ${ctx.splitFallback}.`
  }
  const { pctA, pctB, total } = voteStats
  const a = formatOption(scenario.optionA)
  const b = formatOption(scenario.optionB)
  const gap = Math.abs(pctA - pctB)
  const totalStr = total.toLocaleString(locale === 'it' ? 'it-IT' : 'en-US')

  if (gap < TIE_THRESHOLD) {
    if (locale === 'it') {
      return `Con ${totalStr} voti totali e uno scarto inferiore al ${TIE_THRESHOLD}%, su SplitVote questo dilemma è realmente diviso: nessuna delle due opzioni ha una maggioranza chiara. Mostra ${ctx.splitFallback}.`
    }
    return `With ${totalStr} total votes and a gap under ${TIE_THRESHOLD}%, this dilemma is genuinely split among SplitVote voters: neither option has a clear majority. It surfaces ${ctx.splitFallback}.`
  }

  const leaderPct = pctA >= pctB ? pctA : pctB
  const leaderText = pctA >= pctB ? a : b
  const leaderAnchor = pctA >= pctB ? tension.a : tension.b

  if (locale === 'it') {
    return `Con il ${leaderPct}% su ${leaderText} (${totalStr} voti totali), su SplitVote questo risultato pende verso ${leaderAnchor}. Non rende quell’opzione corretta: mostra quale costo i votanti sono attualmente più disposti ad accettare.`
  }
  return `With ${leaderPct}% choosing ${leaderText} (${totalStr} total votes), this result leans toward ${leaderAnchor} among SplitVote voters. That does not make that option correct; it shows which cost they are currently more willing to accept.`
}
