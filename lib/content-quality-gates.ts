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

// Minimum Italian-language signals to count text as Italian.
// Italian accented chars + common short Italian words.
const IT_ACCENT_RE = /[àáèéìíòóùú]/
const IT_WORDS_RE  = /\b(il|la|di|che|non|per|con|del|della|degli|alle|questo|questa|tutti|ogni|sono|hanno|siamo|puoi|devi|può|ho|hai|sei|era|fare|cosa|come|dove|quando)\b/gi

function italianSignalCount(text: string): number {
  const accents = (text.match(/[àáèéìíòóùú]/g) ?? []).length
  const words   = (text.match(IT_WORDS_RE) ?? []).length
  return accents + words
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

  // ── 1. Locale valid ──────────────────────────────────────────
  if (input.locale !== 'en' && input.locale !== 'it') {
    reasons.push('locale_invalid')
  }

  // ── 2. Question length ────────────────────────────────────────
  const qLen = input.question.length
  if (qLen < 20)  reasons.push('question_too_short')
  if (qLen > 300) reasons.push('question_too_long')

  // ── 3–4. Option lengths ───────────────────────────────────────
  const aLen = input.optionA.length
  const bLen = input.optionB.length
  if (aLen < 5)   reasons.push('option_a_too_short')
  if (aLen > 200) reasons.push('option_a_too_long')
  if (bLen < 5)   reasons.push('option_b_too_short')
  if (bLen > 200) reasons.push('option_b_too_long')

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

  // ── 9. Language match ─────────────────────────────────────────
  const contentText = `${input.question} ${input.optionA} ${input.optionB}`
  const itSignals   = italianSignalCount(contentText)
  if (input.locale === 'it' && itSignals < 2) {
    reasons.push('language_mismatch:expected_italian')
  }
  if (input.locale === 'en' && itSignals > 5) {
    reasons.push('language_mismatch:expected_english')
  }

  // ── 10. Novelty sufficient for autopublish ────────────────────
  const noveltyScore = input.scores?.noveltyScore ?? 0
  if (noveltyScore < AUTOPUBLISH_NOVELTY_THRESHOLD) {
    reasons.push(`novelty_too_low:${noveltyScore}<${AUTOPUBLISH_NOVELTY_THRESHOLD}`)
  }

  // ── 11. Final score sufficient ────────────────────────────────
  const finalScore = input.scores?.finalScore ?? 0
  if (finalScore < AUTOPUBLISH_FINALSCORE_THRESHOLD) {
    reasons.push(`final_score_too_low:${finalScore}<${AUTOPUBLISH_FINALSCORE_THRESHOLD}`)
  }

  // ── 12. Similar items count low ───────────────────────────────
  if (input.similarItemsCount !== undefined && input.similarItemsCount > MAX_SIMILAR_ITEMS_AUTOPUBLISH) {
    reasons.push(`too_many_similar:${input.similarItemsCount}>${MAX_SIMILAR_ITEMS_AUTOPUBLISH}`)
  }

  // ── Warnings (non-blocking) ───────────────────────────────────
  if (aLen < 20 && bLen < 20) warnings.push('options_very_short')
  if (!input.keywords || input.keywords.length === 0) warnings.push('no_keywords')
  if (titleLen > 0 && titleLen < 40) warnings.push('seo_title_short_for_google')

  return {
    passed:   reasons.length === 0,
    score:    finalScore,
    reasons,
    warnings,
  }
}
