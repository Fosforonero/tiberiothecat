/**
 * POST /api/admin/dataset-batch
 *
 * Bulk-imports pre-formatted dilemmas from external datasets (ETHICS, DailyDilemmas, etc.)
 * directly into the draft queue — no AI generation, no OpenRouter calls.
 *
 * Admin-only. Each item is validated through quality gates; dangerous content and structural
 * violations are rejected. Novelty threshold is intentionally very low (10) because dataset
 * entries have already been curated offline.
 *
 * Recommended workflow:
 *   1. Download dataset CSV/JSON (ETHICS MIT, DailyDilemmas CC-BY-4.0, etc.)
 *   2. Format entries into { question, optionA, optionB, locale, category? } objects
 *   3. POST in batches of up to 200 items
 *   4. Review drafts in admin panel, approve the best ones
 *
 * Body params:
 *   items       Array<DatasetItem>  — max 200 per call
 *   dryRun?     boolean             — validate without saving (default false)
 *   dilemmaStyle? 'moral'|'lifestyle' — applies to all items (default 'moral')
 *
 * maxDuration = 60 (no external AI calls — pure validation + Redis write)
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-guard'
import { buildContentInventory } from '@/lib/content-inventory'
import { scoreNovelty } from '@/lib/content-dedup'
import { validateGeneratedOutput, slugify } from '@/lib/content-generation-validate'
import { saveDraftScenarios, type DynamicScenario } from '@/lib/dynamic-scenarios'
import { runQualityGates } from '@/lib/content-quality-gates'
import type { Category } from '@/lib/scenarios'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

const DATASET_NOVELTY_THRESHOLD = 10
const MAX_ITEMS = 200

const VALID_LOCALES = new Set(['en', 'it'])
const VALID_CATEGORIES = new Set([
  'morality', 'survival', 'loyalty', 'justice',
  'freedom', 'technology', 'society', 'relationships', 'lifestyle',
])

const CATEGORY_EMOJI: Record<string, string> = {
  morality:      '⚖️',
  survival:      '🌊',
  loyalty:       '🤝',
  justice:       '⚖️',
  freedom:       '🕊️',
  technology:    '🤖',
  society:       '🏙️',
  relationships: '❤️',
  lifestyle:     '🎭',
}

interface DatasetItem {
  question:  string
  optionA:   string
  optionB:   string
  locale:    'en' | 'it'
  category?: string
  source?:   string  // dataset attribution (e.g. "ETHICS-MIT", "DailyDilemmas-CC-BY-4.0")
}

interface ItemResult {
  index:     number
  question:  string
  locale:    string
  category:  string
  status:    'saved' | 'dry_run' | 'rejected_novelty' | 'rejected_gate' | 'rejected_invalid'
  id?:       string
  noveltyScore?: number
  gateReasons?:  string[]
  validationError?: string
}

const delay = (ms: number) => new Promise<void>(r => setTimeout(r, ms))

export async function POST(request: NextRequest) {
  const auth = await requireAdmin()
  if (auth instanceof NextResponse) return auth

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'invalid_json_body' }, { status: 400 })
  }

  if (typeof body !== 'object' || body === null) {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 })
  }

  const { items: rawItems, dryRun, dilemmaStyle: rawStyle } = body as Record<string, unknown>
  const dryRunMode = dryRun === true
  const dilemmaStyle: 'moral' | 'lifestyle' = rawStyle === 'lifestyle' ? 'lifestyle' : 'moral'

  if (!Array.isArray(rawItems) || rawItems.length === 0) {
    return NextResponse.json({ error: 'items_required', message: 'Provide a non-empty items array.' }, { status: 400 })
  }
  if (rawItems.length > MAX_ITEMS) {
    return NextResponse.json({ error: 'too_many_items', max: MAX_ITEMS, provided: rawItems.length }, { status: 400 })
  }

  // ── Validate item structure ────────────────────────────────────────────────
  const items: DatasetItem[] = []
  for (let idx = 0; idx < rawItems.length; idx++) {
    const raw = rawItems[idx] as Record<string, unknown>
    if (typeof raw !== 'object' || raw === null) {
      return NextResponse.json({ error: 'invalid_item', index: idx }, { status: 400 })
    }
    const q = typeof raw.question === 'string' ? raw.question.trim() : ''
    const a = typeof raw.optionA   === 'string' ? raw.optionA.trim()  : ''
    const b = typeof raw.optionB   === 'string' ? raw.optionB.trim()  : ''
    const l = typeof raw.locale    === 'string' ? raw.locale.trim()   : ''

    if (!q || q.length < 5 || q.length > 300)       return NextResponse.json({ error: 'invalid_item_question', index: idx }, { status: 400 })
    if (!a || a.length < 2 || a.length > 200)        return NextResponse.json({ error: 'invalid_item_optionA', index: idx }, { status: 400 })
    if (!b || b.length < 2 || b.length > 200)        return NextResponse.json({ error: 'invalid_item_optionB', index: idx }, { status: 400 })
    if (!VALID_LOCALES.has(l))                        return NextResponse.json({ error: 'invalid_item_locale', index: idx }, { status: 400 })

    const cat = typeof raw.category === 'string' && VALID_CATEGORIES.has(raw.category.trim())
      ? raw.category.trim()
      : (dilemmaStyle === 'lifestyle' ? 'lifestyle' : 'society')

    const src = typeof raw.source === 'string' ? raw.source.trim().slice(0, 80) : undefined

    items.push({ question: q, optionA: a, optionB: b, locale: l as 'en' | 'it', category: cat, source: src })
  }

  // ── Build inventory once for novelty checks ────────────────────────────────
  const inventory = await buildContentInventory()

  const results: ItemResult[] = []
  let saved   = 0
  let dryOk   = 0
  let rejected = 0

  for (let i = 0; i < items.length; i++) {
    if (i > 0 && i % 20 === 0) await delay(50)

    const item = items[i]

    // ── Minimal novelty check (catches true duplicates) ─────────────────────
    const noveltyResult = scoreNovelty(
      { type: 'dilemma', locale: item.locale, title: item.question },
      inventory,
    )
    const noveltyScore = noveltyResult.noveltyScore

    if (noveltyScore < DATASET_NOVELTY_THRESHOLD) {
      results.push({
        index:       i + 1,
        question:    item.question,
        locale:      item.locale,
        category:    item.category ?? 'society',
        status:      'rejected_novelty',
        noveltyScore,
      })
      rejected++
      continue
    }

    // ── Quality gate validation ──────────────────────────────────────────────
    // Build a minimal pseudo-candidate JSON and run through validateGeneratedOutput
    // so we reuse all field-length, category, and dangerous-content checks.
    const pseudoJson = JSON.stringify({
      type:           'dilemma',
      locale:         item.locale,
      question:       item.question,
      optionA:        item.optionA,
      optionB:        item.optionB,
      category:       item.category ?? (dilemmaStyle === 'lifestyle' ? 'lifestyle' : 'society'),
      seoTitle:       item.question.slice(0, 60),
      seoDescription: `${item.question} — ${item.optionA} vs ${item.optionB}`.slice(0, 160),
      keywords:       [],
      rationale:      'Dataset import',
      safetyNotes:    [],
    })

    const validation = validateGeneratedOutput(pseudoJson, 'dilemma', item.locale, inventory)

    if (!validation.ok) {
      results.push({
        index:            i + 1,
        question:         item.question,
        locale:           item.locale,
        category:         item.category ?? 'society',
        status:           'rejected_invalid',
        validationError:  validation.error,
      })
      rejected++
      continue
    }

    const cat     = (item.category ?? (dilemmaStyle === 'lifestyle' ? 'lifestyle' : 'society')) as Category
    const gateIn  = {
      locale:       item.locale,
      question:     item.question,
      optionA:      item.optionA,
      optionB:      item.optionB,
      category:     cat,
      seoTitle:     item.question.slice(0, 60),
      seoDescription: `${item.question} — ${item.optionA} vs ${item.optionB}`.slice(0, 160),
      dilemmaStyle,
    }
    const gate = runQualityGates(gateIn)

    if (!gate.passed) {
      results.push({
        index:       i + 1,
        question:    item.question,
        locale:      item.locale,
        category:    cat,
        status:      'rejected_gate',
        noveltyScore,
        gateReasons: gate.reasons,
      })
      rejected++
      continue
    }

    // ── Build scenario ───────────────────────────────────────────────────────
    const suffix = Date.now().toString(36).slice(-5)
    const id = `ds-${item.locale}-${slugify(item.question).slice(0, 22).replace(/-+$/, '')}-${suffix}`

    const scenario: DynamicScenario = {
      id,
      question:       item.question,
      optionA:        item.optionA,
      optionB:        item.optionB,
      category:       cat,
      emoji:          CATEGORY_EMOJI[cat] ?? '🤔',
      locale:         item.locale,
      trend:          item.source ?? 'dataset_import',
      trendSource:    'internal_feedback',
      generatedAt:    new Date().toISOString(),
      generatedBy:    'seed_batch',
      status:         'draft',
      seoTitle:       item.question.slice(0, 60),
      seoDescription: `${item.question} — ${item.optionA} vs ${item.optionB}`.slice(0, 160),
      keywords:       [],
      scores: {
        viralScore:    50,
        seoScore:      40,
        noveltyScore,
        feedbackScore: 50,
        finalScore:    Math.round(50 * 0.35 + 40 * 0.25 + noveltyScore * 0.25 + 50 * 0.15),
      },
      ...(dilemmaStyle === 'lifestyle' ? { dilemmaStyle: 'lifestyle' as const } : {}),
    }

    // Update local inventory to catch intra-batch duplicates
    inventory.push({
      id:             scenario.id,
      type:           'dilemma',
      locale:         item.locale,
      title:          item.question,
      slug:           scenario.id,
      category:       cat,
      keywords:       [],
      status:         'draft',
      source:         'dataset_import',
      searchableText: `${item.question} ${item.optionA} ${item.optionB}`,
    })

    if (dryRunMode) {
      results.push({ index: i + 1, question: item.question, locale: item.locale, category: cat, status: 'dry_run', id, noveltyScore })
      dryOk++
    } else {
      try {
        await saveDraftScenarios([scenario])
        results.push({ index: i + 1, question: item.question, locale: item.locale, category: cat, status: 'saved', id, noveltyScore })
        saved++
      } catch {
        results.push({ index: i + 1, question: item.question, locale: item.locale, category: cat, status: 'rejected_gate', gateReasons: ['redis_save_failed'] })
        rejected++
      }
    }
  }

  return NextResponse.json({
    summary: {
      total:    items.length,
      saved:    dryRunMode ? 0 : saved,
      ...(dryRunMode ? { dryRunPassed: dryOk } : {}),
      rejected,
    },
    dryRun:       dryRunMode,
    dilemmaStyle,
    datasets: {
      note: 'Recommended sources: ETHICS (MIT license), DailyDilemmas (CC-BY-4.0), Scruples (AllenAI).',
    },
    results,
  })
}
