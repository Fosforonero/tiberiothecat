/**
 * Quality gates for AI-generated dilemma autopublish.
 *
 * Used by the cron route when AUTO_PUBLISH_DILEMMAS=true to decide
 * whether a generated dilemma can skip the draft queue and go directly
 * to dynamic:scenarios (approved).
 *
 * Fail-closed by design: if any hard gate fails, passed=false and
 * the dilemma is saved to dynamic:drafts for manual admin review instead.
 */

const VALID_CATEGORIES = new Set([
  'morality', 'survival', 'loyalty', 'justice',
  'freedom', 'technology', 'society', 'relationships',
  'lifestyle',
])

// Hard blocklist — any match in question/options/SEO fields → gate fails.
// Aligned with BLOCKED_PATTERNS in cron route plus extra safety patterns.
const DANGEROUS_PATTERNS: RegExp[] = [
  /trump/i, /biden/i, /putin/i, /xi\s*jinping/i, /musk\b/i, /bezos\b/i,
  /kill\s+yourself/i, /\bkys\b/i, /\bsuicide\b/i, /self[-\s]harm/i,
  /\brake\b/i, /child\s+porn/i, /child\s+sexual\s+abuse/i,
  /pedophil/i, /\blolita\b/i,
  /hate\s+speech/i, /ethnic\s+cleansing/i,
  /detailed\s+instructions.*(?:weapon|bomb|poison)/i,
]

// Thresholds for autopublish (stricter than draft threshold of 55)
export const AUTOPUBLISH_NOVELTY_THRESHOLD  = 75
export const AUTOPUBLISH_FINALSCORE_THRESHOLD = 75
const MAX_SIMILAR_ITEMS_AUTOPUBLISH = 2

// Relaxed thresholds for lifestyle (preference) dilemmas.
// Novelty is not meaningful for "coffee vs tea" style questions.
export const LIFESTYLE_AUTOPUBLISH_NOVELTY_THRESHOLD   = 10
export const LIFESTYLE_AUTOPUBLISH_FINALSCORE_THRESHOLD = 30

// Minimum Italian-language signals to count text as Italian.
// Italian accented chars + common short Italian words.
const IT_ACCENT_RE = /[àáèéìíòóùú]/
const IT_WORDS_RE  = /\b(il|la|di|che|non|per|con|del|della|degli|alle|questo|questa|tutti|ogni|sono|hanno|siamo|puoi|devi|può|ho|hai|sei|era|fare|cosa|come|dove|quando)\b/gi

// Soft depth warnings (moral dilemmas only — lifestyle is exempt by design).
// Each option must combine a concrete stance with a brief rationale. Options
// that open with a bare "Yes." / "No." / "Sì." flag the asymmetric-label
// pattern the depth audit (reports/dilemma-depth-audit-2026-05-19.md §3.1)
// identified as the most common reason real options read like a poll.
const MORAL_BARE_YES_NO_RE = /^(yes|no|sì|sí)\.\s/i

// Magic empirical stipulations in the question. Forbidden for moral dilemmas
// because they pre-resolve the moral work by stipulating a contested
// empirical claim, leaving the voter only a preference vote. EN + IT
// patterns combined; lifestyle is exempt.
const MAGIC_STIPULATION_RE = new RegExp(
  [
    // EN markers
    'studies?\\s+show',
    'experts?\\s+agree',
    'proven\\s+to\\b',
    'guarantees?\\b',
    'guaranteed\\s+to\\b',
    'will\\s+result\\s+in\\b',
    '\\+\\s*\\d+\\s*%',                                    // +40%
    '\\d+\\s*%\\s+(?:more|fewer|less|likely)\\b',          // 30% more
    '\\d+\\s*%\\s+(?:effective|accurate|safer)\\b',
    // IT markers
    'studi\\s+(?:dimostrano|mostrano|provano)',
    'esperti\\s+concordano',
    'si\\s+dimostra\\s+che',
    'garantit[oa]\\b',
    'modello\\s+\\w+\\s+(?:mostra|dimostra)',              // "modello portoghese mostra"
    '\\d+\\s*%\\s+in\\s+(?:più|meno)\\b',
  ].join('|'),
  'i',
)

// Editorial-shape suppressor (moral dilemmas only). When ANY of these
// markers appears in the question, all four editorial-shape warnings
// (abstract_policy_question, support_oppose_framing,
// undefined_collective_actor, undefined_action_verb) are suppressed
// because the question is already shaped as a "which cost do you accept"
// tradeoff rather than a referendum.
//
// Patterns deliberately require either a comparative-risk phrase
// ("more dangerous", "più pericoloso") or a cost-introducing connector
// followed by a real cost verb ("but doubles", "ma raddoppia") — bare
// conjunctions like "ma" / "but" / "or" are too common in natural speech
// to use as suppressors on their own.
const EDITORIAL_TRADEOFF_MARKERS_RE = new RegExp(
  [
    // EN — explicit tradeoff / comparative-risk phrasing
    '\\beven if\\b',
    '\\beven though\\b',
    '\\bknowing that\\b',
    '\\bat the cost of\\b',
    '\\bin exchange for\\b',
    '\\bin return for\\b',
    '\\brisking\\b',
    'which (?:cost|risk|danger|harm|injustice|tradeoff|trade-off|side) do you accept',
    'more (?:dangerous|harmful|risky|costly|painful|unjust)',
    'but (?:doubles|halves|raises|lowers|costs|penalizes|harms|sacrifices|cuts|locks out|leaves out|forces)',
    // IT — explicit tradeoff / comparative-risk phrasing
    '\\banche se\\b',
    '\\bsapendo che\\b',
    '\\bal costo di\\b',
    '\\brischiando\\b',
    '\\bin cambio di\\b',
    'quale (?:costo|rischio|ingiustizia|pericolo|danno|tradeoff|lato) accetti',
    'più (?:pericoloso|dannoso|rischioso|grave|costoso|doloroso|ingiusto)',
    '\\bma (?:raddoppia|penalizza|danneggia|costa|costringe|sacrifica|aumenta|riduce|toglie|esclude)',
    '\\bpur (?:proteggendo|salvando|riducendo|aumentando|garantendo|dando)',
    '\\bnonostante\\b',
  ].join('|'),
  'i',
)

// Referendum-style "Should X..." framing. Triggers `abstract_policy_question`.
// EN: "Should governments/countries/society/companies/the state... <verb>"
// EN: "Should we / society <ban|allow|support|oppose|regulate|permit|prohibit>"
// IT: "Dovrebbero i governi/i paesi/le aziende..." or "La società/lo stato/i paesi dovrebbe(ro)..."
// IT: "Si dovrebbe(ro) <vietare|permettere|sostenere|regolare|limitare>"
const ABSTRACT_POLICY_RE = new RegExp(
  [
    // EN
    'should\\s+(?:governments?|countries|society|the\\s+government|the\\s+state|companies|platforms|nations|policymakers|the\\s+public)\\b',
    'should\\s+(?:we|society)\\s+(?:ban|allow|support|oppose|regulate|permit|prohibit|endorse|reject)\\b',
    // IT
    'dovrebbero\\s+(?:i\\s+(?:governi|paesi|governanti|cittadini)|le\\s+aziende|gli\\s+stati|le\\s+piattaforme|le\\s+nazioni)\\b',
    '(?:i\\s+(?:governi|paesi|governanti|cittadini)|la\\s+società|lo\\s+stato|le\\s+aziende|le\\s+piattaforme|gli\\s+stati)\\s+dovrebbe(?:ro)?\\b',
    'si\\s+dovrebbe(?:ro)?\\s+(?:vietare|permettere|sostenere|regolare|limitare|consentire|proibire)\\b',
  ].join('|'),
  'i',
)

// Support/oppose policy-poll verbs in the question. Triggers
// `support_oppose_framing` unless a tradeoff marker is present.
// Per the 25 May editorial audit, this groups support/oppose-style verbs
// (support, oppose, allow, ban, regulate, permit, prohibit + IT equivalents)
// because they signal a poll-shaped framing rather than a real moral collision.
const SUPPORT_OPPOSE_RE = new RegExp(
  [
    // EN
    '\\b(?:support|oppose|endorse|reject|approve|disapprove|ban|allow|regulate|permit|prohibit)\\b',
    // IT
    '\\b(?:sostenere|sostieni|sostenga|opporsi|opponi|appoggiare|respingere|approvare|disapprovare|vietare|vieti|permettere|permetti|regolare|regoli|consentire|consenti|proibire|proibisci)\\b',
  ].join('|'),
  'i',
)

// Broad collective actors with no concrete identity. Triggers
// `undefined_collective_actor` unless a tradeoff marker is present.
// "un Paese" / "gli altri" / "the others" are the canonical weak-dilemma actors —
// they don't put the voter into a scene they can picture.
const UNDEFINED_ACTOR_RE = new RegExp(
  [
    // EN
    '\\b(?:countries|governments|companies|the\\s+society|society|the\\s+others|the\\s+government|the\\s+state|the\\s+platform|policymakers|nations|the\\s+public)\\b',
    // IT
    '\\b(?:un\\s+paese|i\\s+paesi|gli\\s+altri|il\\s+governo|lo\\s+stato|la\\s+società|le\\s+aziende|le\\s+piattaforme|i\\s+governanti|le\\s+nazioni|i\\s+cittadini)\\b',
  ].join('|'),
  'i',
)

// Vague action verbs with no concrete object/cost. Triggers
// `undefined_action_verb` unless a tradeoff marker is present.
// "rallentare comunque" / "slow X" is the canonical weak verb — the voter
// can't picture what slowing actually entails or what it costs.
const UNDEFINED_ACTION_RE = new RegExp(
  [
    // EN
    '\\b(?:slow|restrict|limit|curb|throttle|slow\\s+down)\\b',
    // IT
    '\\b(?:rallentare|rallentino|rallenti|rallentiamo|limitare|limiti|limitino|restringere|ridurre|riduci|riducano|frenare|freni|frenino)\\b',
  ].join('|'),
  'i',
)

function italianSignalCount(text: string): number {
  const accents = (text.match(/[àáèéìíòóùú]/g) ?? []).length
  const words   = (text.match(IT_WORDS_RE) ?? []).length
  return accents + words
}

function clarityIssues(question: string, optionA: string, optionB: string): string[] {
  const text = `${question} ${optionA} ${optionB}`.toLowerCase()
  const issues: string[] = []

  if (
    /\b(non essere mai ingannat[oa]|nessuno [^.!?]{0,80}mentir|totale trasparenza)\b/.test(text) &&
    /\b(nascond|tacer|tacere|ometter|omette|segreto|segreti|segretezza)\b/.test(text)
  ) {
    issues.push('clarity_truth_vs_omission')
  }

  return issues
}

export interface QualityGateInput {
  locale:           string
  question:         string
  optionA:          string
  optionB:          string
  category:         string
  seoTitle?:        string
  seoDescription?:  string
  keywords?:        string[]
  scores?: {
    noveltyScore:  number
    finalScore:    number
    viralScore?:   number
    seoScore?:     number
    feedbackScore?: number
  }
  similarItemsCount?: number
  dilemmaStyle?: 'moral' | 'lifestyle'
}

export interface QualityGateResult {
  passed:   boolean
  score:    number    // finalScore from the dilemma's scores (0-100)
  reasons:  string[]  // hard gate failures (empty if passed)
  warnings: string[]  // non-blocking observations
}

export function runQualityGates(input: QualityGateInput): QualityGateResult {
  const reasons:  string[] = []
  const warnings: string[] = []
  const isLifestyle = input.dilemmaStyle === 'lifestyle'

  // ── 1. Locale valid ──────────────────────────────────────────
  if (input.locale !== 'en' && input.locale !== 'it') {
    reasons.push('locale_invalid')
  }

  // ── 2. Question length ────────────────────────────────────────
  const qLen    = input.question.length
  const qMinLen = isLifestyle ? 10 : 20
  if (qLen < qMinLen) reasons.push('question_too_short')
  if (qLen > 300)     reasons.push('question_too_long')

  // ── 3–4. Option lengths ───────────────────────────────────────
  const aLen    = input.optionA.length
  const bLen    = input.optionB.length
  // Moral dilemma options need room for a stance + rationale (block bare
  // Yes/No and noun-only labels). Lifestyle preference options stay short
  // since "Mare" / "Montagna" are intentionally minimal.
  const optMin  = isLifestyle ? 2 : 20
  if (aLen < optMin) reasons.push('option_a_too_short')
  if (aLen > 200)    reasons.push('option_a_too_long')
  if (bLen < optMin) reasons.push('option_b_too_short')
  if (bLen > 200)    reasons.push('option_b_too_long')

  // ── 5. Options balanced (max 4:1 length ratio) ────────────────
  if (aLen > 0 && bLen > 0) {
    const ratio = Math.max(aLen, bLen) / Math.min(aLen, bLen)
    if (ratio > 4) reasons.push(`options_unbalanced:ratio=${ratio.toFixed(1)}`)
  }

  // ── 6. SEO present ────────────────────────────────────────────
  const titleLen = input.seoTitle?.length ?? 0
  const descLen  = input.seoDescription?.length ?? 0
  if (titleLen < 10 || titleLen > 120) reasons.push('seo_title_missing_or_invalid')
  if (descLen  < 20 || descLen  > 320) reasons.push('seo_description_missing_or_invalid')

  // ── 7. Category valid ─────────────────────────────────────────
  if (!VALID_CATEGORIES.has(input.category)) {
    reasons.push(`category_invalid:${input.category}`)
  }

  // ── 8. No dangerous content ───────────────────────────────────
  const allText = [
    input.question, input.optionA, input.optionB,
    input.seoTitle ?? '', input.seoDescription ?? '',
  ].join(' ')
  for (const pattern of DANGEROUS_PATTERNS) {
    if (pattern.test(allText)) {
      reasons.push(`dangerous_content:${pattern.source.slice(0, 30)}`)
      break
    }
  }

  // ── 8b. Editorial clarity: no contradictory absolutes / loopholes ────────
  for (const issue of clarityIssues(input.question, input.optionA, input.optionB)) {
    reasons.push(issue)
  }

  // ── 9. Language match (skipped for lifestyle — short labels lack signals) ──
  if (!isLifestyle) {
    const contentText = `${input.question} ${input.optionA} ${input.optionB}`
    const itSignals   = italianSignalCount(contentText)
    if (input.locale === 'it' && itSignals < 2) {
      reasons.push('language_mismatch:expected_italian')
    }
    if (input.locale === 'en' && itSignals > 5) {
      reasons.push('language_mismatch:expected_english')
    }
  }

  // ── 10. Novelty sufficient for autopublish ────────────────────
  const noveltyThreshold = isLifestyle ? LIFESTYLE_AUTOPUBLISH_NOVELTY_THRESHOLD : AUTOPUBLISH_NOVELTY_THRESHOLD
  const noveltyScore = input.scores?.noveltyScore ?? 0
  if (noveltyScore < noveltyThreshold) {
    reasons.push(`novelty_too_low:${noveltyScore}<${noveltyThreshold}`)
  }

  // ── 11. Final score sufficient ────────────────────────────────
  const scoreThreshold = isLifestyle ? LIFESTYLE_AUTOPUBLISH_FINALSCORE_THRESHOLD : AUTOPUBLISH_FINALSCORE_THRESHOLD
  const finalScore = input.scores?.finalScore ?? 0
  if (finalScore < scoreThreshold) {
    reasons.push(`final_score_too_low:${finalScore}<${scoreThreshold}`)
  }

  // ── 12. Similar items count low (skipped for lifestyle) ───────
  if (!isLifestyle && input.similarItemsCount !== undefined && input.similarItemsCount > MAX_SIMILAR_ITEMS_AUTOPUBLISH) {
    reasons.push(`too_many_similar:${input.similarItemsCount}>${MAX_SIMILAR_ITEMS_AUTOPUBLISH}`)
  }

  // ── Warnings (non-blocking) ───────────────────────────────────
  if (!isLifestyle && aLen < 20 && bLen < 20) warnings.push('options_very_short')
  if (!input.keywords || input.keywords.length === 0) warnings.push('no_keywords')
  if (titleLen > 0 && titleLen < 40) warnings.push('seo_title_short_for_google')

  // ── Soft depth warnings (moral dilemmas only — never on lifestyle) ────
  // These are advisory signals for admin review, not reject reasons.
  if (!isLifestyle) {
    if (MORAL_BARE_YES_NO_RE.test(input.optionA)) {
      warnings.push('moral_option_bare_yes_no:optionA')
    }
    if (MORAL_BARE_YES_NO_RE.test(input.optionB)) {
      warnings.push('moral_option_bare_yes_no:optionB')
    }
    if (MAGIC_STIPULATION_RE.test(input.question)) {
      warnings.push('magic_stipulation_in_question')
    }

    // Editorial-shape warnings (DILEMMA-EDITORIAL-SHAPE-GATE-01, 25 May 2026).
    // Catch referendum-style framings that produce boring yes/no policy
    // polls instead of conflict-shaped dilemmas. Suppressed when the
    // question already carries an explicit tradeoff marker — the question
    // is then doing the editorial work itself and the broad surface
    // patterns become acceptable.
    const hasTradeoffMarker = EDITORIAL_TRADEOFF_MARKERS_RE.test(input.question)
    if (!hasTradeoffMarker) {
      if (ABSTRACT_POLICY_RE.test(input.question)) {
        warnings.push('abstract_policy_question')
      }
      if (SUPPORT_OPPOSE_RE.test(input.question)) {
        warnings.push('support_oppose_framing')
      }
      if (UNDEFINED_ACTOR_RE.test(input.question)) {
        warnings.push('undefined_collective_actor')
      }
      if (UNDEFINED_ACTION_RE.test(input.question)) {
        warnings.push('undefined_action_verb')
      }
    }
  }

  return {
    passed:   reasons.length === 0,
    score:    finalScore,
    reasons,
    warnings,
  }
}
