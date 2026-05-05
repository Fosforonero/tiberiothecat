/**
 * POST /api/admin/news-to-dilemma-preview
 *
 * Admin-only. Accepts a normalised news/trend/fact item (title, summary,
 * tags, facts — no full article text, no URL fetching) and returns an
 * AI-generated abstract moral dilemma preview.
 *
 * Guarantees:
 *   - No Redis writes
 *   - No Supabase writes
 *   - No publish / autoPublish
 *   - No URL fetching (url field accepted as metadata only, never fetched)
 *   - dryRunEnforced: true always
 *
 * Auth: requireAdmin() Supabase session only.
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-guard'
import { validateIntakePayload } from '@/lib/content-intake-validate'
import { isOpenRouterConfigured, generateWithOpenRouter } from '@/lib/openrouter'

export const runtime     = 'nodejs'
export const dynamic     = 'force-dynamic'
export const maxDuration = 60

// ── Constants ─────────────────────────────────────────────────────────────────

const BLOCKED_FIELDS   = ['fullText', 'body', 'articleText', 'content'] as const
const VALID_SOURCES    = ['manual', 'picoclaw', 'workflow-kernel'] as const
const VALID_LOCALES    = ['it', 'en'] as const
const VALID_ITEM_TYPES = ['news', 'trend', 'fact'] as const

// ── System prompt ─────────────────────────────────────────────────────────────

function buildSystemPrompt(locale: 'it' | 'en'): string {
  const lang = locale === 'it' ? 'Italian' : 'English'
  return `You are an editorial AI for SplitVote, a moral dilemma voting platform.

Task: transform a news/trend/fact input into an abstract, universal, timeless, privacy-safe moral dilemma.

STRICT RULES — any violation causes the output to be rejected:
1. No real person names, living or dead
2. No company, employer, organisation, or brand names
3. No specific cities, countries, transport systems, or landmarks
4. No reference to "this news", "this event", or "this article"
5. No factual claims about specific recent or ongoing events
6. No framing like "based on current events" or "inspired by recent news"
7. Both optionA and optionB must be morally defensible — never "good vs evil"
8. The dilemma must be evergreen: equally valid a decade ago and a decade from now
9. Do not reproduce any detail that could allow tracing back to real individuals
10. Write the question and options entirely in ${lang}
11. Output ONLY a valid JSON object — no markdown fences, no text outside the JSON

OUTPUT SCHEMA (all fields required):
{
  "category": one of: morality|survival|loyalty|justice|freedom|technology|society|relationships|lifestyle,
  "question": string — the dilemma posed to the user (max 240 chars),
  "optionA": string — first morally valid position (max 140 chars),
  "optionB": string — second morally valid position (max 140 chars),
  "seoKeywords": string[] — 3 to 6 keywords, no brand names, no proper nouns,
  "editorialNote": string — brief editorial rationale for this abstraction (max 200 chars),
  "removedDetails": string[] — list of what was abstracted away from the source (e.g. "specific employer", "city name"),
  "sourceNote": string — topic area reference only, no specific news or dates (e.g. "inspired by: use-of-force ethics in public spaces"),
  "confidence": number — 0.0 to 1.0, how cleanly the source maps to a timeless universal dilemma
}`
}

// ── User prompt ───────────────────────────────────────────────────────────────

function buildUserPrompt(
  item: {
    type:    string
    title:   string
    summary: string
    facts?:  string[]
    tags?:   string[]
  },
  riskFlags: string[],
  locale:    'it' | 'en',
): string {
  const lines: string[] = [
    'Input:',
    `type: ${item.type}`,
    `title: ${item.title}`,
    `summary: ${item.summary}`,
  ]
  if (item.facts && item.facts.length > 0) {
    lines.push('facts:')
    for (const f of item.facts) lines.push(`  • ${f}`)
  }
  if (item.tags && item.tags.length > 0) {
    lines.push(`tags: ${item.tags.join(', ')}`)
  }
  if (riskFlags.length > 0) {
    lines.push(`\nRisk signals detected — handle with extra care: ${riskFlags.join(', ')}`)
  }
  lines.push(`\nTransform this into a universal, privacy-safe moral dilemma in ${locale === 'it' ? 'Italian' : 'English'}. Output only the JSON object.`)
  return lines.join('\n')
}

// ── Parse AI response ─────────────────────────────────────────────────────────

const VALID_CATEGORIES = new Set([
  'morality', 'survival', 'loyalty', 'justice', 'freedom',
  'technology', 'society', 'relationships', 'lifestyle',
])

interface DilemmaPreview {
  category:       string
  question:       string
  optionA:        string
  optionB:        string
  seoKeywords:    string[]
  editorialNote:  string
  removedDetails: string[]
  sourceNote:     string
  confidence:     number
}

function parsePreview(text: string): { ok: true; preview: DilemmaPreview } | { ok: false; error: string } {
  let raw: unknown
  try {
    const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim()
    raw = JSON.parse(cleaned)
  } catch {
    return { ok: false, error: 'ai_response_not_valid_json' }
  }

  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    return { ok: false, error: 'ai_response_not_an_object' }
  }

  const o = raw as Record<string, unknown>

  const question = typeof o.question === 'string' ? o.question.slice(0, 240).trim() : ''
  const optionA  = typeof o.optionA  === 'string' ? o.optionA.slice(0, 140).trim()  : ''
  const optionB  = typeof o.optionB  === 'string' ? o.optionB.slice(0, 140).trim()  : ''

  if (!question || !optionA || !optionB) {
    return { ok: false, error: 'ai_response_missing_required_fields' }
  }

  const category = typeof o.category === 'string' && VALID_CATEGORIES.has(o.category)
    ? o.category
    : 'ethics'

  const seoKeywords: string[] = Array.isArray(o.seoKeywords)
    ? (o.seoKeywords as unknown[]).filter((k): k is string => typeof k === 'string').slice(0, 6)
    : []

  const editorialNote  = typeof o.editorialNote  === 'string' ? o.editorialNote.slice(0, 200)  : ''
  const removedDetails = Array.isArray(o.removedDetails)
    ? (o.removedDetails as unknown[]).filter((d): d is string => typeof d === 'string').slice(0, 10)
    : []
  const sourceNote = typeof o.sourceNote === 'string' ? o.sourceNote.slice(0, 200)  : ''
  const confidence = typeof o.confidence === 'number'
    ? Math.min(1, Math.max(0, o.confidence))
    : 0.5

  return {
    ok: true,
    preview: {
      category,
      question,
      optionA,
      optionB,
      seoKeywords,
      editorialNote,
      removedDetails,
      sourceNote,
      confidence,
    },
  }
}

// ── Handler ───────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const admin = await requireAdmin()
  if (admin instanceof NextResponse) return admin

  let body: Record<string, unknown>
  try {
    const parsed = await request.json()
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      return NextResponse.json({ error: 'invalid_body' }, { status: 400 })
    }
    body = parsed as Record<string, unknown>
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }

  for (const field of BLOCKED_FIELDS) {
    if (field in body) {
      return NextResponse.json(
        { error: 'blocked_field', field, message: `Field "${field}" is not accepted. Submit a summary only.` },
        { status: 422 },
      )
    }
  }

  if (!VALID_SOURCES.includes(body.source as (typeof VALID_SOURCES)[number])) {
    return NextResponse.json(
      { error: 'invalid_source', valid: [...VALID_SOURCES] },
      { status: 422 },
    )
  }
  const source = body.source as 'manual' | 'picoclaw' | 'workflow-kernel'

  if (!VALID_LOCALES.includes(body.locale as (typeof VALID_LOCALES)[number])) {
    return NextResponse.json(
      { error: 'invalid_locale', valid: [...VALID_LOCALES] },
      { status: 422 },
    )
  }
  const locale = body.locale as 'it' | 'en'

  if (typeof body.item !== 'object' || body.item === null || Array.isArray(body.item)) {
    return NextResponse.json(
      { error: 'item_required', message: 'item must be an object' },
      { status: 422 },
    )
  }
  const itemObj = body.item as Record<string, unknown>

  for (const field of BLOCKED_FIELDS) {
    if (field in itemObj) {
      return NextResponse.json(
        { error: 'blocked_field', field, message: `item.${field} is not accepted. Submit a summary only.` },
        { status: 422 },
      )
    }
  }

  if (!VALID_ITEM_TYPES.includes(itemObj.type as (typeof VALID_ITEM_TYPES)[number])) {
    return NextResponse.json(
      { error: 'invalid_item_type', valid: [...VALID_ITEM_TYPES] },
      { status: 422 },
    )
  }

  const { accepted, rejected } = validateIntakePayload([itemObj])
  if (rejected.length > 0) {
    return NextResponse.json(
      { error: 'item_validation_failed', reason: rejected[0]?.reason },
      { status: 422 },
    )
  }
  const validated = accepted[0]!

  if (!isOpenRouterConfigured()) {
    return NextResponse.json(
      { error: 'openrouter_not_configured', message: 'OPENROUTER_API_KEY or OPENROUTER_MODEL_DRAFT not set' },
      { status: 503 },
    )
  }

  const aiResult = await generateWithOpenRouter(
    {
      system:      buildSystemPrompt(locale),
      prompt:      buildUserPrompt(validated, validated.riskFlags.map(String), locale),
      temperature: 0.7,
      maxTokens:   900,
    },
    30_000,
  )

  if (!aiResult.ok) {
    return NextResponse.json({
      input: { source, locale, type: validated.type, title: validated.title },
      validation: {
        riskFlags:               validated.riskFlags,
        suggestedTransformation: validated.suggestedTransformation,
      },
      preview:  null,
      aiError:  aiResult.error,
      meta: {
        aiUsed:            true,
        writtenToRedis:    false,
        writtenToSupabase: false,
        published:         false,
        dryRunEnforced:    true,
        phasedMode:        'preview_only',
      },
    })
  }

  const parsed = parsePreview(aiResult.text)

  return NextResponse.json({
    input: {
      source,
      locale,
      type:  validated.type,
      title: validated.title,
    },
    validation: {
      riskFlags:               validated.riskFlags,
      suggestedTransformation: validated.suggestedTransformation,
    },
    preview:    parsed.ok ? parsed.preview : null,
    parseError: parsed.ok ? undefined      : parsed.error,
    meta: {
      aiUsed:            true,
      model:             process.env.OPENROUTER_MODEL_DRAFT ?? 'unknown',
      writtenToRedis:    false,
      writtenToSupabase: false,
      published:         false,
      dryRunEnforced:    true,
      phasedMode:        'preview_only',
    },
  })
}
