import type { ContentItem } from './content-inventory'
import { scoreNovelty, type SimilarItem } from './content-dedup'

const VALID_CATEGORIES = new Set([
  'morality', 'survival', 'loyalty', 'justice',
  'freedom', 'technology', 'society', 'relationships',
])

export interface ValidatedDilemma {
  type: 'dilemma'
  locale: 'en' | 'it'
  question: string
  optionA: string
  optionB: string
  category: string
  seoTitle: string
  seoDescription: string
  keywords: string[]
  rationale: string
  safetyNotes: string[]
  noveltyScore: number
  similarItems: SimilarItem[]
  warnings: string[]
}

export interface ValidatedBlogArticle {
  type: 'blog_article'
  locale: 'en' | 'it'
  slug: string
  title: string
  seoTitle: string
  seoDescription: string
  keywords: string[]
  outline: string[]
  body: string
  relatedDilemmaIds: string[]
  rationale: string
  safetyNotes: string[]
  noveltyScore: number
  similarItems: SimilarItem[]
  warnings: string[]
  articleKind: 'standard' | 'cornerstone'
  faq?: Array<{ q: string; a: string }>
  conclusion?: string
  internalLinks?: string[]
}

export type ValidatedCandidate = ValidatedDilemma | ValidatedBlogArticle

export type ValidationResult =
  | { ok: true; candidate: ValidatedCandidate }
  | { ok: false; error: string; raw?: string }

function extractJson(text: string): unknown {
  // Strip markdown code fences
  const stripped = text.replace(/```(?:json)?\s*/gi, '').replace(/```/g, '').trim()
  const start = stripped.indexOf('{')
  const end = stripped.lastIndexOf('}')
  if (start === -1 || end === -1 || end <= start) {
    throw new Error('no_json_object_found')
  }
  return JSON.parse(stripped.slice(start, end + 1))
}

function str(v: unknown, field: string, min: number, max: number): string {
  if (typeof v !== 'string') throw new Error(`field_missing:${field}`)
  const s = v.trim()
  if (s.length < min) throw new Error(`field_too_short:${field}`)
  if (s.length > max) throw new Error(`field_too_long:${field}`)
  return s
}

function strArr(v: unknown, field: string, maxItems: number): string[] {
  if (!Array.isArray(v)) throw new Error(`field_missing:${field}`)
  if (v.length === 0) throw new Error(`field_empty:${field}`)
  if (v.length > maxItems) throw new Error(`field_too_many:${field}`)
  return v.map((item, i) => {
    if (typeof item !== 'string') throw new Error(`field_invalid_item:${field}[${i}]`)
    return item.trim()
  })
}

const ACCENT_MAP: Record<string, string> = {
  à: 'a', á: 'a', â: 'a', ã: 'a', ä: 'a',
  è: 'e', é: 'e', ê: 'e', ë: 'e',
  ì: 'i', í: 'i', î: 'i', ï: 'i',
  ò: 'o', ó: 'o', ô: 'o', õ: 'o', ö: 'o',
  ù: 'u', ú: 'u', û: 'u', ü: 'u',
  ñ: 'n', ç: 'c',
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[àáâãäèéêëìíîïòóôõöùúûüñç]/g, c => ACCENT_MAP[c] ?? c)
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60)
}

export function validateGeneratedOutput(
  rawText: string,
  type: 'dilemma' | 'blog_article',
  locale: 'en' | 'it',
  inventory: ContentItem[],
  articleKind: 'standard' | 'cornerstone' = 'standard',
): ValidationResult {
  let parsed: unknown
  try {
    parsed = extractJson(rawText)
  } catch {
    return { ok: false, error: 'parse_failed', raw: rawText.slice(0, 500) }
  }

  if (typeof parsed !== 'object' || parsed === null) {
    return { ok: false, error: 'parse_not_object', raw: rawText.slice(0, 500) }
  }

  const v = parsed as Record<string, unknown>

  try {
    if (type === 'dilemma') {
      const question    = str(v.question,       'question',       10, 400)
      const optionA     = str(v.optionA,         'optionA',        5,  200)
      const optionB     = str(v.optionB,         'optionB',        5,  200)
      const category    = str(v.category,        'category',       1,  50)
      const seoTitle    = str(v.seoTitle,        'seoTitle',       10, 120)
      const seoDesc     = str(v.seoDescription, 'seoDescription', 20, 320)
      const rationale   = str(v.rationale,       'rationale',      10, 400)
      const keywords    = strArr(v.keywords,     'keywords',       6)
      const safetyNotes = Array.isArray(v.safetyNotes)
        ? (v.safetyNotes as unknown[]).filter(s => typeof s === 'string') as string[]
        : []

      if (!VALID_CATEGORIES.has(category)) {
        return { ok: false, error: `invalid_category:${category}` }
      }

      const candidate: ContentCandidate = {
        type: 'dilemma',
        locale,
        title: question,
        category,
        keywords,
        searchableText: `${question} ${optionA} ${optionB} ${keywords.join(' ')}`,
      }
      const { noveltyScore, similarItems, warnings } = scoreNovelty(candidate, inventory)

      const result: ValidatedDilemma = {
        type: 'dilemma',
        locale,
        question,
        optionA,
        optionB,
        category,
        seoTitle,
        seoDescription: seoDesc,
        keywords,
        rationale,
        safetyNotes,
        noveltyScore,
        similarItems,
        warnings,
      }
      return { ok: true, candidate: result }
    }

    // blog_article — body limit depends on article kind
    const bodyMax = articleKind === 'cornerstone' ? 18000 : 6500
    const keywordsMax = articleKind === 'cornerstone' ? 8 : 6

    const rawSlug        = str(v.slug,           'slug',            3,  80)
    const slug           = slugify(rawSlug)
    const title          = str(v.title,          'title',           5,  200)
    const seoTitle       = str(v.seoTitle,       'seoTitle',        10, 120)
    const seoDesc        = str(v.seoDescription, 'seoDescription',  20, 320)
    const body           = str(v.body,           'body',            300, bodyMax)
    const rationale      = str(v.rationale,      'rationale',       10, 400)
    const keywords       = strArr(v.keywords,    'keywords',        keywordsMax)
    const outline        = strArr(v.outline,     'outline',         10)
    const relatedIds     = strArr(v.relatedDilemmaIds, 'relatedDilemmaIds', 8)
    const safetyNotes    = Array.isArray(v.safetyNotes)
      ? (v.safetyNotes as unknown[]).filter(s => typeof s === 'string') as string[]
      : []

    if (slug.length < 3) {
      return { ok: false, error: 'slug_too_short_after_normalize' }
    }

    // Optional cornerstone fields — parsed leniently, never reject on missing
    let faq: Array<{ q: string; a: string }> | undefined
    let conclusion: string | undefined
    let internalLinks: string[] | undefined

    if (articleKind === 'cornerstone') {
      if (Array.isArray(v.faq)) {
        faq = (v.faq as unknown[])
          .filter(item => typeof item === 'object' && item !== null
            && typeof (item as Record<string, unknown>).q === 'string'
            && typeof (item as Record<string, unknown>).a === 'string')
          .map(item => {
            const i = item as Record<string, unknown>
            return {
              q: (i.q as string).trim().slice(0, 400),
              a: (i.a as string).trim().slice(0, 1200),
            }
          })
          .slice(0, 8)
      }
      if (typeof v.conclusion === 'string' && v.conclusion.trim().length > 0) {
        conclusion = v.conclusion.trim().slice(0, 3000)
      }
      if (Array.isArray(v.internalLinks)) {
        internalLinks = (v.internalLinks as unknown[])
          .filter(l => typeof l === 'string')
          .map(l => (l as string).trim())
          .slice(0, 8)
      }
    }

    const candidate: ContentCandidate = {
      type: 'blog_article',
      locale,
      title,
      keywords,
      searchableText: `${title} ${body.slice(0, 600)} ${keywords.join(' ')}`,
    }
    const { noveltyScore, similarItems, warnings } = scoreNovelty(candidate, inventory)

    const result: ValidatedBlogArticle = {
      type: 'blog_article',
      locale,
      slug,
      title,
      seoTitle,
      seoDescription: seoDesc,
      keywords,
      outline,
      body,
      relatedDilemmaIds: relatedIds,
      rationale,
      safetyNotes,
      noveltyScore,
      similarItems,
      warnings,
      articleKind,
      ...(faq          ? { faq }          : {}),
      ...(conclusion   ? { conclusion }   : {}),
      ...(internalLinks ? { internalLinks } : {}),
    }
    return { ok: true, candidate: result }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'validation_error'
    return { ok: false, error: msg }
  }
}

// Re-export for convenience
type ContentCandidate = import('./content-dedup').ContentCandidate
