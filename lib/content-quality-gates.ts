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
  }

  return {
    passed:   reasons.length === 0,
    score:    finalScore,
    reasons,
    warnings,
  }
}
