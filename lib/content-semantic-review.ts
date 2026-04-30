import { generateWithOpenRouter } from './openrouter'
import type { ContentItem } from './content-inventory'

export interface SemanticReviewResult {
  verdict: 'novel' | 'related_but_distinct' | 'too_similar' | 'duplicate'
  reason: string
  closestMatch?: { id: string; title: string }
}

export interface SemanticReviewInput {
  candidate: {
    question: string
    optionA:  string
    optionB:  string
    category: string
    locale:   string
  }
  comparisonItems: Array<{ id: string; title: string; text?: string }>
}

const VALID_VERDICTS = new Set(['novel', 'related_but_distinct', 'too_similar', 'duplicate'])

export function buildSemanticReviewPrompt(input: SemanticReviewInput): { system: string; prompt: string } {
  const system = `You are a semantic novelty reviewer for SplitVote, a moral dilemma voting platform.
Your task: compare a candidate dilemma against a list of existing dilemmas and determine semantic novelty.

Verdict definitions:
- novel: clearly distinct moral tension and choice structure from all comparison items
- related_but_distinct: overlapping theme or setting, but different core ethical trade-off
- too_similar: same fundamental moral choice and tension axis — only vocabulary, setting, numbers, nationality, or LANGUAGE differs
- duplicate: nearly identical question and options — effective restatement with minimal change

Evaluation rules:
- Same ethical tension counts as too_similar even if vocabulary, numbers, nationality, setting, or LANGUAGE differ.
- Items prefixed with [EN] or [IT] are in a different language — evaluate moral equivalence across languages.
- Example: "sacrifice one to save five" and "sacrifica uno per salvarne cinque" are duplicate regardless of language.
- Example: "sacrifice one to save five" and "let five die to spare one" are too_similar despite different framing.

Output ONLY valid JSON — no markdown, no code fences, no explanation text.`

  const itemsList = input.comparisonItems
    .map((item, i) => {
      const header = `[${i + 1}] (id: ${item.id}) "${item.title}"`
      return item.text ? `${header}\n   text: "${item.text}"` : header
    })
    .join('\n')

  const prompt = `Candidate dilemma:
- locale: ${input.candidate.locale}
- category: ${input.candidate.category}
- question: "${input.candidate.question}"
- optionA: "${input.candidate.optionA}"
- optionB: "${input.candidate.optionB}"

Existing dilemmas to compare against:
${itemsList}

Return this exact JSON object (no other text):
{
  "verdict": "novel|related_but_distinct|too_similar|duplicate",
  "reason": "One sentence explaining the verdict (max 100 chars)",
  "closestMatch": { "id": "...", "title": "..." }
}

Rules:
- closestMatch is required when verdict is too_similar or duplicate (use the id and title from the list above)
- closestMatch must be omitted when verdict is novel or related_but_distinct
- Evaluate moral structure, not surface vocabulary`

  return { system, prompt }
}

export function parseSemanticReviewResult(text: string): SemanticReviewResult | null {
  try {
    const stripped = text.replace(/```(?:json)?\s*/gi, '').replace(/```/g, '').trim()
    const start = stripped.indexOf('{')
    const end = stripped.lastIndexOf('}')
    if (start === -1 || end === -1 || end <= start) return null
    const parsed = JSON.parse(stripped.slice(start, end + 1)) as Record<string, unknown>

    if (!VALID_VERDICTS.has(parsed.verdict as string)) return null
    if (typeof parsed.reason !== 'string' || parsed.reason.trim() === '') return null

    const verdict = parsed.verdict as SemanticReviewResult['verdict']
    const reason = (parsed.reason as string)
      .replace(/[\x00-\x1F\x7F]/g, '')
      .trim()
      .slice(0, 150)

    let closestMatch: SemanticReviewResult['closestMatch'] | undefined
    if (parsed.closestMatch && typeof parsed.closestMatch === 'object') {
      const cm = parsed.closestMatch as Record<string, unknown>
      if (typeof cm.id === 'string' && typeof cm.title === 'string') {
        closestMatch = { id: cm.id, title: cm.title }
      }
    }

    return { verdict, reason, closestMatch }
  } catch {
    return null
  }
}

export function isBlockingVerdict(verdict: string): boolean {
  return verdict === 'too_similar' || verdict === 'duplicate'
}

export function buildComparisonItems(
  candidateLocale: string,
  candidateCategory: string,
  jaccardTopItems: Array<{ id: string; title: string }>,
  inventory: ContentItem[],
  maxItems = 12,
): Array<{ id: string; title: string; text?: string }> {
  const selected: Array<{ id: string; title: string; text?: string }> = []
  const seen = new Set<string>()
  const inventoryById = new Map(inventory.map(i => [i.id, i]))

  // First pass: Jaccard top hits (any locale/status — cross-locale visible here via shared tokens)
  for (const item of jaccardTopItems.slice(0, 5)) {
    if (!seen.has(item.id)) {
      const inv = inventoryById.get(item.id)
      selected.push({
        id: item.id,
        title: item.title,
        ...(inv ? { text: inv.searchableText.slice(0, 500) } : {}),
      })
      seen.add(item.id)
    }
  }

  // Second pass: same-locale, same-category, all statuses (drafts included for intra-batch dedup)
  for (const item of inventory) {
    if (selected.length >= maxItems) break
    if (item.type !== 'dilemma') continue
    if (item.locale !== candidateLocale) continue
    if (item.category !== candidateCategory) continue
    if (seen.has(item.id)) continue
    selected.push({ id: item.id, title: item.title, text: item.searchableText.slice(0, 500) })
    seen.add(item.id)
  }

  // Third pass: cross-locale items — detects EN/IT semantic equivalence that Jaccard misses.
  // Includes same-category approved/static content AND any intra-batch generated items (ai_generated).
  // Items are prefixed with [EN]/[IT] so the LLM reviewer can apply cross-language evaluation.
  const CROSS_LOCALE_MAX = 4
  let crossLocaleAdded = 0
  for (const item of inventory) {
    if (crossLocaleAdded >= CROSS_LOCALE_MAX) break
    if (item.type !== 'dilemma') continue
    if (item.locale === candidateLocale) continue
    if (seen.has(item.id)) continue
    const isSameCategoryPublished =
      (item.status === 'approved' || item.status === 'static') && item.category === candidateCategory
    const isCurrentBatch = item.source === 'ai_generated'
    if (!isSameCategoryPublished && !isCurrentBatch) continue
    selected.push({
      id: item.id,
      title: `[${item.locale.toUpperCase()}] ${item.title}`,
      text: item.searchableText.slice(0, 300),
    })
    seen.add(item.id)
    crossLocaleAdded++
  }

  return selected
}

export async function runSemanticReview(
  input: SemanticReviewInput,
  timeoutMs = 10_000,
): Promise<{ ok: true; result: SemanticReviewResult } | { ok: false; error: string }> {
  if (input.comparisonItems.length === 0) {
    return { ok: false, error: 'no_comparison_items' }
  }

  const model = process.env.OPENROUTER_MODEL_REVIEW ?? process.env.OPENROUTER_MODEL_DRAFT
  if (!model) return { ok: false, error: 'semantic_review_model_not_configured' }

  const { system, prompt } = buildSemanticReviewPrompt(input)
  const generated = await generateWithOpenRouter({ system, prompt, model }, timeoutMs)

  if (!generated.ok) return { ok: false, error: generated.error }

  const result = parseSemanticReviewResult(generated.text)
  if (!result) return { ok: false, error: 'semantic_review_parse_failed' }

  return { ok: true, result }
}
