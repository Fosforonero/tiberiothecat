/**
 * POST /api/admin/ai-reqa
 *
 * Admin/ops endpoint for AI generation re-QA dry-run.
 * Runs 4 hardcoded scenarios (EN moral / IT moral / EN lifestyle / IT lifestyle),
 * each with count=5. dryRun and autoPublish are hardcoded — no Redis or Supabase writes.
 *
 * Auth (dual path — token checked first):
 *   1. AI_REQA_TOKEN Bearer token  → machine/ops/Picoclaw use; enabled only when env var
 *      is set with ≥32 chars; verified with crypto.timingSafeEqual
 *   2. requireAdmin() Supabase session → admin dashboard fallback
 *
 * Body: ignored — scenarios, count, style, locale are not configurable.
 *
 * Gate:
 *   acceptance ≥ 60% AND review_err < 20% AND no template repeats → save_mode_ok
 *   systemic OpenRouter failure (≥50% errors) → inconclusive (not save_mode_ok)
 *   otherwise → save_mode_blocked
 *
 * Env var required for Bearer auth: AI_REQA_TOKEN (set manually in Vercel Production).
 * If not set, only requireAdmin() Supabase session works.
 */

import { NextRequest, NextResponse } from 'next/server'
import { timingSafeEqual } from 'crypto'
import { requireAdmin } from '@/lib/admin-guard'
import { isOpenRouterConfigured, generateWithOpenRouter } from '@/lib/openrouter'
import { buildContentInventory, type ContentItem } from '@/lib/content-inventory'
import {
  scoreNovelty,
  detectMoralArchetypes,
  getArchetypeSaturation,
  MORAL_ARCHETYPES,
} from '@/lib/content-dedup'
import {
  buildDilemmaPrompt,
  buildLifestyleDilemmaPrompt,
} from '@/lib/content-generation-prompts'
import { validateGeneratedOutput, type ValidatedDilemma } from '@/lib/content-generation-validate'
import {
  buildComparisonItems,
  runSemanticReview,
  isBlockingVerdict,
} from '@/lib/content-semantic-review'

export const runtime  = 'nodejs'
export const dynamic  = 'force-dynamic'
export const maxDuration = 300

// ── Hardcoded QA constants ────────────────────────────────────────────────────
const MORAL_NOVELTY_THRESHOLD     = 55
const LIFESTYLE_NOVELTY_THRESHOLD = 10
const ARCHETYPE_THRESHOLD         = 3
const COUNT_PER_SCENARIO          = 5
const SEMANTIC_REVIEW_TIMEOUT_MS  = 10_000

// ── Fixed QA topics ───────────────────────────────────────────────────────────
// Chosen to be representative of each style. Fixed topics make re-QA results
// deterministic and comparable across runs (unlike random seed selection).
const QA_TOPICS: Record<'en-moral' | 'it-moral' | 'en-lifestyle' | 'it-lifestyle', string[]> = {
  'en-moral': [
    'Is it acceptable to lie to a dementia patient to spare them daily emotional pain?',
    'Would you report a close friend to the police if you discovered they committed a serious crime?',
    'Should murderers who show proven remorse and rehabilitation receive early release?',
    'Should social media companies be held legally liable for algorithmically addictive design that causes measurable harm?',
    'Is it ethical to stay in a loveless marriage for the sake of young children?',
  ],
  'it-moral': [
    'Scopri che un collega ha falsificato i dati di una ricerca che ha già salvato migliaia di vite: lo denunci rischiando di invalidare i trattamenti in corso?',
    'Il tuo migliore amico ti confida di evadere le tasse da anni: lo incoraggi a smettere, taci o lo segnali?',
    'Denunceresti un medico che pratica eutanasia su pazienti terminali senza consenso esplicito?',
    'Le aziende di intelligenza artificiale dovrebbero essere legalmente responsabili per i danni causati autonomamente dai loro algoritmi?',
    'Adotteresti un figlio con gravi disabilità cognitive sapendo che cambierà completamente la tua vita?',
  ],
  'en-lifestyle': [
    'beach or mountains',
    'coffee or tea',
    'morning person or night owl',
    'city or countryside',
    'shower or bath',
  ],
  'it-lifestyle': [
    'mare o montagna',
    'caffè o tè',
    'mattina o sera',
    'città o campagna',
    'doccia o bagno',
  ],
}

type ScenarioKey = 'en-moral' | 'it-moral' | 'en-lifestyle' | 'it-lifestyle'

const REQA_SCENARIOS: Array<{
  key:    ScenarioKey
  locale: 'en' | 'it'
  style:  'moral' | 'lifestyle'
}> = [
  { key: 'en-moral',     locale: 'en', style: 'moral'     },
  { key: 'it-moral',     locale: 'it', style: 'moral'     },
  { key: 'en-lifestyle', locale: 'en', style: 'lifestyle' },
  { key: 'it-lifestyle', locale: 'it', style: 'lifestyle' },
]

// ── Token verification ────────────────────────────────────────────────────────
function verifyToken(provided: string, expected: string): boolean {
  try {
    const a = Buffer.from(provided)
    const b = Buffer.from(expected)
    if (a.length !== b.length) return false
    return timingSafeEqual(a, b)
  } catch {
    return false
  }
}

async function authorize(request: NextRequest): Promise<{ ok: true } | NextResponse> {
  const envToken     = process.env.AI_REQA_TOKEN
  const bearerActive = !!envToken && envToken.length >= 32
  const authHeader   = request.headers.get('authorization')

  if (bearerActive && authHeader?.startsWith('Bearer ')) {
    const provided = authHeader.slice(7)
    if (verifyToken(provided, envToken!)) return { ok: true }
    return NextResponse.json({ error: 'invalid_token' }, { status: 401 })
  }

  const admin = await requireAdmin()
  if (admin instanceof NextResponse) return admin
  return { ok: true }
}

// ── Template repeat detection ─────────────────────────────────────────────────
// Two questions share a template if their first 5 words are identical (case-insensitive).
function detectTemplateRepeats(questions: string[]): string[][] {
  const groups = new Map<string, string[]>()
  for (const q of questions) {
    const key = q.trim().split(/\s+/).slice(0, 5).join(' ').toLowerCase()
    const g   = groups.get(key) ?? []
    g.push(q)
    groups.set(key, g)
  }
  return [...groups.values()].filter(g => g.length > 1)
}

// ── Result types ──────────────────────────────────────────────────────────────
interface QaResult {
  topic:             string
  status:            'dry_run' | 'skipped_novelty' | 'error'
  question?:         string
  noveltyScore?:     number
  semanticVerdict?:  string
  semanticReason?:   string
  reviewErr:         boolean
  errorCode?:        string
  similarItemsCount?: number
  similarItems?:      Array<{ id: string; title: string }>
}

interface ScenarioReport {
  locale:     'en' | 'it'
  style:      'moral' | 'lifestyle'
  accepted:   number
  rejected:   number
  errors:     number
  review_err: number
  results:    QaResult[]
}

const delay = (ms: number) => new Promise<void>(r => setTimeout(r, ms))

// ── Main handler ──────────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  const auth = await authorize(request)
  if (auth instanceof NextResponse) return auth

  if (!isOpenRouterConfigured()) {
    return NextResponse.json({ error: 'openrouter_not_configured' }, { status: 503 })
  }

  const inventory           = await buildContentInventory()
  const archetypeSaturation = getArchetypeSaturation(inventory)
  const saturatedArchetypeLabels = MORAL_ARCHETYPES
    .filter(a => (archetypeSaturation.get(a.id) ?? 0) >= ARCHETYPE_THRESHOLD)
    .map(a => a.label)

  const scenarioReports: ScenarioReport[] = []
  const allAcceptedQuestions: string[]    = []

  for (const scenario of REQA_SCENARIOS) {
    const { key, locale, style } = scenario
    const topics           = QA_TOPICS[key]
    const NOVELTY_THRESHOLD = style === 'lifestyle' ? LIFESTYLE_NOVELTY_THRESHOLD : MORAL_NOVELTY_THRESHOLD

    const results: QaResult[] = []
    let accepted   = 0
    let rejected   = 0
    let errors     = 0
    let review_err = 0

    for (let i = 0; i < topics.length; i++) {
      if (i > 0) await delay(400)

      const topic     = topics[i]
      const preCheck  = scoreNovelty({ type: 'dilemma', locale, title: topic }, inventory)

      const localeItems      = inventory.filter(x => x.type === 'dilemma' && x.locale === locale)
      const categoryCounts: Record<string, number> = {}
      for (const item of localeItems) {
        if (item.category) categoryCounts[item.category] = (categoryCounts[item.category] ?? 0) + 1
      }

      const inventorySummary = {
        totalDilemmas:               inventory.filter(x => x.type === 'dilemma').length,
        totalBlogArticles:           inventory.filter(x => x.type === 'blog_article').length,
        categories:                  [...new Set(inventory.map(x => x.category).filter(Boolean))] as string[],
        recentKeywords:              inventory.flatMap(x => x.keywords).slice(0, 30),
        similarTitles:               preCheck.similarItems.map(x => x.title),
        categoryCounts,
        saturatedArchetypes:         saturatedArchetypeLabels,
        existingQuestionsInCategory: [],
      }

      const existingLifestyleQs = style === 'lifestyle'
        ? inventory
            .filter(x => x.type === 'dilemma' && x.category === 'lifestyle' && x.locale === locale)
            .map(x => x.title)
            .slice(0, 6)
        : []

      const { system, prompt } = style === 'lifestyle'
        ? buildLifestyleDilemmaPrompt(locale, topic, existingLifestyleQs)
        : buildDilemmaPrompt({
            type:     'dilemma',
            locale,
            topic,
            inventory: inventorySummary,
            similarContentWarnings: [],
          })

      const generated = await generateWithOpenRouter({ system, prompt })

      if (!generated.ok) {
        results.push({ topic, status: 'error', reviewErr: false, errorCode: generated.error })
        errors++
        continue
      }

      const validation = validateGeneratedOutput(generated.text, 'dilemma', locale, inventory)

      if (!validation.ok) {
        results.push({ topic, status: 'error', reviewErr: false, errorCode: validation.error })
        errors++
        continue
      }

      const candidate = validation.candidate as ValidatedDilemma

      // Archetype saturation penalty — moral only
      if (style !== 'lifestyle') {
        const candidateText   = `${candidate.question} ${candidate.optionA} ${candidate.optionB}`
        const matched         = detectMoralArchetypes(candidateText)
        const saturatedMatches = matched.filter(id => (archetypeSaturation.get(id) ?? 0) >= ARCHETYPE_THRESHOLD)
        if (saturatedMatches.length > 0) {
          const penalty = Math.min(15, saturatedMatches.length * 8)
          candidate.noveltyScore = Math.max(0, candidate.noveltyScore - penalty)
        }
      }

      if (candidate.noveltyScore < NOVELTY_THRESHOLD) {
        results.push({
          topic,
          status:       'skipped_novelty',
          reviewErr:    false,
          question:     candidate.question,
          noveltyScore: candidate.noveltyScore,
        })
        rejected++
        continue
      }

      // Semantic review — moral only (lifestyle skips by design)
      let semanticVerdict: string | undefined
      let semanticReason:  string | undefined
      let hasSemanticBlock = false
      let thisReviewErr    = false

      if (style !== 'lifestyle') {
        const comparisonItems = buildComparisonItems(
          locale,
          candidate.category,
          candidate.similarItems.map(s => ({ id: s.id, title: s.title })),
          inventory,
        )

        const reviewOutcome = await runSemanticReview(
          {
            candidate: {
              question: candidate.question,
              optionA:  candidate.optionA,
              optionB:  candidate.optionB,
              category: candidate.category,
              locale,
            },
            comparisonItems,
          },
          SEMANTIC_REVIEW_TIMEOUT_MS,
        )

        if (!reviewOutcome.ok) {
          thisReviewErr    = true
          review_err++
          semanticVerdict  = 'review_err'
        } else {
          semanticVerdict  = reviewOutcome.result.verdict
          semanticReason   = reviewOutcome.result.reason
          hasSemanticBlock = isBlockingVerdict(reviewOutcome.result.verdict)
        }
      }

      if (hasSemanticBlock) {
        results.push({
          topic,
          status:         'skipped_novelty',
          reviewErr:      false,
          question:       candidate.question,
          noveltyScore:   candidate.noveltyScore,
          semanticVerdict,
          semanticReason,
        })
        rejected++
        continue
      }

      const fakeId = `qa-${key}-${i}`
      inventory.push({
        id:             fakeId,
        type:           'dilemma',
        locale,
        title:          candidate.question,
        slug:           fakeId,
        category:       candidate.category,
        keywords:       candidate.keywords,
        status:         'draft',
        source:         'ai_generated',
        searchableText: `${candidate.question} ${candidate.optionA} ${candidate.optionB} ${candidate.keywords.join(' ')}`,
      } satisfies ContentItem)
      results.push({
        topic,
        status:            'dry_run',
        reviewErr:         thisReviewErr,
        question:          candidate.question,
        noveltyScore:      candidate.noveltyScore,
        similarItemsCount: candidate.similarItems.length,
        similarItems:      candidate.similarItems.map(s => ({ id: s.id, title: s.title })),
        ...(semanticVerdict ? { semanticVerdict } : {}),
        ...(semanticReason  ? { semanticReason  } : {}),
      })
      accepted++
      allAcceptedQuestions.push(candidate.question)
    }

    scenarioReports.push({ locale, style, accepted, rejected, errors, review_err, results })
  }

  // ── Aggregate gate metrics ────────────────────────────────────────────────────
  const totalGenerated = COUNT_PER_SCENARIO * REQA_SCENARIOS.length       // 20
  const totalAccepted  = scenarioReports.reduce((s, r) => s + r.accepted,   0)
  const totalRejected  = scenarioReports.reduce((s, r) => s + r.rejected,   0)
  const totalErrors    = scenarioReports.reduce((s, r) => s + r.errors,     0)
  const totalReviewErr = scenarioReports.reduce((s, r) => s + r.review_err, 0)
  // Acceptance rate excludes hard errors (OpenRouter/validation failures)
  const totalAttempted = totalAccepted + totalRejected
  const acceptancePct  = totalAttempted > 0
    ? Math.round((totalAccepted / totalAttempted) * 100)
    : 0
  const reviewErrPct   = totalAttempted > 0
    ? Math.round((totalReviewErr / totalAttempted) * 100)
    : 0

  const templateRepeatGroups = detectTemplateRepeats(allAcceptedQuestions)
  const hasTemplateRepeats   = templateRepeatGroups.length > 0

  // Systemic failure: ≥50% of attempts errored before any evaluation
  const systemicFailure = totalErrors >= totalGenerated * 0.5

  let qaStatus:     'passed' | 'failed' | 'inconclusive'
  let gateDecision: 'save_mode_ok' | 'save_mode_blocked' | 'inconclusive'
  let gateReason:   string

  if (systemicFailure) {
    qaStatus     = 'inconclusive'
    gateDecision = 'inconclusive'
    gateReason   = `Systemic failure: ${totalErrors}/${totalGenerated} calls errored — OpenRouter or reviewer unavailable. Re-run after verifying OPENROUTER_MODEL_REVIEW and OPENROUTER_API_KEY.`
  } else if (acceptancePct >= 60 && reviewErrPct < 20 && !hasTemplateRepeats) {
    qaStatus     = 'passed'
    gateDecision = 'save_mode_ok'
    gateReason   = `acceptance=${acceptancePct}% ≥60%, review_err=${reviewErrPct}% <20%, no template repeats detected.`
  } else {
    qaStatus     = 'failed'
    gateDecision = 'save_mode_blocked'
    const reasons: string[] = []
    if (acceptancePct < 60)   reasons.push(`acceptance=${acceptancePct}% <60%`)
    if (reviewErrPct >= 20)   reasons.push(`review_err=${reviewErrPct}% ≥20% — check OPENROUTER_MODEL_REVIEW`)
    if (hasTemplateRepeats)   reasons.push(`template_repeats in ${templateRepeatGroups.length} group(s)`)
    gateReason = reasons.join('; ')
  }

  return NextResponse.json({
    qaStatus,
    gateDecision,
    gateReason,
    summary: {
      totalGenerated,
      totalAttempted,
      accepted:       totalAccepted,
      rejected:       totalRejected,
      errors:         totalErrors,
      review_err:     totalReviewErr,
      acceptancePct:  `${acceptancePct}%`,
      reviewErrPct:   `${reviewErrPct}%`,
      templateRepeats: hasTemplateRepeats ? templateRepeatGroups : [],
    },
    scenarios: scenarioReports,
    meta: {
      dryRunEnforced:      true,
      autoPublishEnforced: false,
      redisWritten:        false,
      supabaseWritten:     false,
      scenariosRun:        REQA_SCENARIOS.length,
      countPerScenario:    COUNT_PER_SCENARIO,
    },
  })
}
