/**
 * POST /api/admin/seed-draft-batch
 *
 * Controlled batch seed: generates dilemma drafts using OpenRouter.
 * - Admin-only (Supabase session required)
 * - Novelty guard: skip if noveltyScore < NOVELTY_THRESHOLD
 * - autoPublish: items that pass all quality gates are published directly (max 10 per request)
 * - All other items land in dynamic:drafts for manual admin review
 * - Nothing is published without quality gates — fail-closed by design
 *
 * Body params:
 *   locale?       'en' | 'it' | 'all'  — default 'all' (EN + IT)
 *   count?        number                — default 10, min 1, max 30
 *   dryRun?       boolean               — default false; validates but does not save to Redis
 *   topics?       string[]              — topic override (max 60, requires locale='en'|'it')
 *   autoPublish?  boolean               — default false; publish gate-passing items (max 10, incompatible with dryRun)
 *
 * maxDuration = 300 (Vercel Pro required — ~150-200s for 20 sequential calls)
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-guard'
import { isOpenRouterConfigured, generateWithOpenRouter } from '@/lib/openrouter'
import { buildContentInventory } from '@/lib/content-inventory'
import { scoreNovelty } from '@/lib/content-dedup'
import { buildDilemmaPrompt } from '@/lib/content-generation-prompts'
import { validateGeneratedOutput, slugify, type ValidatedDilemma } from '@/lib/content-generation-validate'
import {
  getDynamicScenarios,
  saveDraftScenarios,
  saveDynamicScenarios,
  MAX_DYNAMIC,
  type DynamicScenario,
} from '@/lib/dynamic-scenarios'
import { runQualityGates } from '@/lib/content-quality-gates'
import { computeSeoScore } from '@/lib/trend-signals'
import type { Category } from '@/lib/scenarios'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 300

const NOVELTY_THRESHOLD = 55
// Hard cap on auto-published items per request, regardless of count.
const AUTO_PUBLISH_CAP = 10

const CATEGORY_EMOJI: Record<string, string> = {
  morality:      '⚖️',
  survival:      '🌊',
  loyalty:       '🤝',
  justice:       '⚖️',
  freedom:       '🕊️',
  technology:    '🤖',
  society:       '🏙️',
  relationships: '❤️',
}

// Curated seed topics — diverse categories, not overlapping with static dilemmas
const SEED_TOPICS: Array<{ locale: 'en' | 'it'; topic: string }> = [
  // ── EN (10) ────────────────────────────────────────────────────────────────
  {
    locale: 'en',
    topic: 'Should social media companies be legally liable for content that contributes to teen suicide?',
  },
  {
    locale: 'en',
    topic: 'Would you accept a fulfilling simulated life knowing the real world outside is collapsing?',
  },
  {
    locale: 'en',
    topic: 'Should organ donation be automatically opt-out rather than opt-in by law?',
  },
  {
    locale: 'en',
    topic: 'Is it ethical for governments to pay homeless people to participate in medical trials?',
  },
  {
    locale: 'en',
    topic: 'Would you give up your career to become the sole caregiver for an aging parent?',
  },
  {
    locale: 'en',
    topic: 'Should murderers who show proven remorse and rehabilitation receive early release?',
  },
  {
    locale: 'en',
    topic: 'Is it acceptable to lie to a dementia patient to spare them daily emotional pain?',
  },
  {
    locale: 'en',
    topic: 'Should governments be allowed to hack private systems to prevent imminent terrorist attacks?',
  },
  {
    locale: 'en',
    topic: 'Would you genetically edit your unborn child to eliminate a known fatal hereditary disease?',
  },
  {
    locale: 'en',
    topic: 'If you discovered your professional success was mostly luck, would you redistribute your wealth?',
  },
  // ── IT (10) ────────────────────────────────────────────────────────────────
  {
    locale: 'it',
    topic: 'Dovresti rivelare a qualcuno che il suo partner lo tradisce, anche se non te lo ha chiesto?',
  },
  {
    locale: 'it',
    topic: 'È giusto limitare la libertà di parola online per prevenire la radicalizzazione?',
  },
  {
    locale: 'it',
    topic: 'Preferiresti vivere 60 anni in perfetta salute oppure 90 anni con qualità di vita ridotta?',
  },
  {
    locale: 'it',
    topic: 'Denunceresti un medico che pratica eutanasia su pazienti terminali senza consenso esplicito?',
  },
  {
    locale: 'it',
    topic: 'È etico usare dati di sorveglianza delle città per prevenire crimini prima che accadano?',
  },
  {
    locale: 'it',
    topic: 'Adotteresti un figlio con gravi disabilità cognitive sapendo che cambierà completamente la tua vita?',
  },
  {
    locale: 'it',
    topic: 'In guerra, è giustificabile sacrificare civili nemici per salvare i propri soldati?',
  },
  {
    locale: 'it',
    topic: "Un'azienda può licenziare un dipendente per i suoi post privati sui social che danneggiano il brand?",
  },
  {
    locale: 'it',
    topic: 'È eticamente accettabile clonare esseri umani esclusivamente per scopi medici?',
  },
  {
    locale: 'it',
    topic: 'Confessi un crimine di cui ti sei pentito, sapendo che rovinerai la tua vita e quella della tua famiglia?',
  },
]

function dilemmaToScenario(candidate: ValidatedDilemma, topic: string): DynamicScenario {
  const suffix = Date.now().toString(36).slice(-5)
  const id = `ai-${candidate.locale}-${slugify(candidate.question).slice(0, 22).replace(/-+$/, '')}-${suffix}`

  const noveltyScore  = candidate.noveltyScore
  // viralScore baseline: topics are admin-curated, expected to be more engaging than cron defaults.
  // seoScore: computed from actual generated SEO metadata — auto-publish requires genuinely good metadata.
  // feedbackScore: neutral start (Bayesian prior, no real feedback yet).
  // auto-publish depends on novelty + real SEO quality passing runQualityGates thresholds.
  const viralScore    = 65
  const seoScore      = computeSeoScore(candidate.seoTitle, candidate.seoDescription, candidate.keywords)
  const feedbackScore = 50
  const finalScore    = Math.round(
    viralScore * 0.35 + seoScore * 0.25 + noveltyScore * 0.25 + feedbackScore * 0.15,
  )

  return {
    id,
    question:       candidate.question,
    optionA:        candidate.optionA,
    optionB:        candidate.optionB,
    category:       candidate.category as Category,
    emoji:          CATEGORY_EMOJI[candidate.category] ?? '🤔',
    locale:         candidate.locale,
    trend:          topic,
    trendSource:    'openrouter',
    trendUrl:       process.env.OPENROUTER_MODEL_DRAFT ?? 'openrouter',
    generatedAt:    new Date().toISOString(),
    generatedBy:    'seed_batch',
    status:         'draft',
    seoTitle:       candidate.seoTitle,
    seoDescription: candidate.seoDescription,
    keywords:       candidate.keywords,
    scores: { viralScore, seoScore, noveltyScore, feedbackScore, finalScore },
  }
}

const delay = (ms: number) => new Promise<void>(r => setTimeout(r, ms))

export interface SeedResult {
  index:               number
  locale:              'en' | 'it'
  topic:               string
  status:              'saved' | 'dry_run' | 'auto_published' | 'skipped_novelty' | 'error'
  id?:                 string
  category?:           string
  question?:           string
  noveltyScore?:       number
  similarItemsCount?:  number
  topKeyword?:         string
  errorCode?:          string
  // Auto-publish metadata
  publishNote?:        string    // 'pool_full' | 'quality_gate_failed' | 'publish_redis_error'
  qualityGateReasons?: string[]  // gate failure reasons (present when autoPublish was attempted)
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin()
  if (auth instanceof NextResponse) return auth

  if (!isOpenRouterConfigured()) {
    return NextResponse.json({ error: 'openrouter_not_configured' }, { status: 503 })
  }

  // ── Parse and validate body params ─────────────────────────────────────────
  const body = await request.json().catch(() => ({}))

  const localeParam = body.locale ?? 'all'
  if (!['en', 'it', 'all'].includes(localeParam)) {
    return NextResponse.json({ error: 'invalid_locale' }, { status: 400 })
  }
  const locale = localeParam as 'en' | 'it' | 'all'

  const rawCount = typeof body.count === 'number' && Number.isFinite(body.count) ? body.count : 10
  const count = Math.min(30, Math.max(1, Math.floor(rawCount)))

  const dryRun      = body.dryRun === true
  const autoPublish = body.autoPublish === true

  if (autoPublish && dryRun) {
    return NextResponse.json(
      { error: 'invalid_request', message: 'autoPublish cannot be combined with dryRun.' },
      { status: 400 },
    )
  }

  // ── Validate topics override ────────────────────────────────────────────────
  const rawTopics: unknown = body.topics
  let customTopics: string[] | undefined

  if (rawTopics !== undefined) {
    if (!Array.isArray(rawTopics) || rawTopics.length > 60) {
      return NextResponse.json({ error: 'invalid_topics' }, { status: 400 })
    }
    for (const t of rawTopics) {
      if (typeof t !== 'string') {
        return NextResponse.json({ error: 'invalid_topics' }, { status: 400 })
      }
      const trimmed = t.trim()
      if (trimmed.length < 3 || trimmed.length > 200 || /[\x00-\x1F\x7F-\x9F]/.test(trimmed)) {
        return NextResponse.json({ error: 'invalid_topics' }, { status: 400 })
      }
    }
    if (locale === 'all') {
      return NextResponse.json(
        { error: 'invalid_request', message: "Specify locale='en' or 'it' when providing custom topics." },
        { status: 400 },
      )
    }
    const rawTopicsArr = rawTopics as string[]
    if (rawTopicsArr.length < count) {
      return NextResponse.json(
        {
          error: 'not_enough_seed_topics',
          message: `Requested ${count} topics but only ${rawTopicsArr.length} provided.`,
          available: { [locale]: rawTopicsArr.length },
          requested: count,
        },
        { status: 400 },
      )
    }
    customTopics = rawTopicsArr.map(t => t.trim()).slice(0, count)
  }

  // ── Build topic list ────────────────────────────────────────────────────────
  const topicsToProcess: Array<{ locale: 'en' | 'it'; topic: string }> = []

  if (customTopics !== undefined) {
    for (const topic of customTopics) {
      topicsToProcess.push({ locale: locale as 'en' | 'it', topic })
    }
  } else {
    // Default SEED_TOPICS — fail fast if count exceeds available topics to avoid silent partial runs
    const availableEN = SEED_TOPICS.filter(t => t.locale === 'en').length
    const availableIT = SEED_TOPICS.filter(t => t.locale === 'it').length

    if ((locale === 'all' || locale === 'en') && count > availableEN) {
      return NextResponse.json(
        {
          error: 'not_enough_seed_topics',
          message: `Requested ${count} EN topics but only ${availableEN} available. Lower count or provide a topics override.`,
          available: { en: availableEN, it: availableIT },
          requested: count,
        },
        { status: 400 },
      )
    }
    if ((locale === 'all' || locale === 'it') && count > availableIT) {
      return NextResponse.json(
        {
          error: 'not_enough_seed_topics',
          message: `Requested ${count} IT topics but only ${availableIT} available. Lower count or provide a topics override.`,
          available: { en: availableEN, it: availableIT },
          requested: count,
        },
        { status: 400 },
      )
    }

    const defaultEN = SEED_TOPICS.filter(t => t.locale === 'en').slice(0, count)
    const defaultIT = SEED_TOPICS.filter(t => t.locale === 'it').slice(0, count)
    if (locale === 'all' || locale === 'en') topicsToProcess.push(...defaultEN)
    if (locale === 'all' || locale === 'it') topicsToProcess.push(...defaultIT)
  }

  // ── Pre-fetch approved count (only needed for pool capacity guard) ──────────
  let approvedAtStart = 0
  if (autoPublish) {
    const currentApproved = await getDynamicScenarios()
    approvedAtStart = currentApproved.length
  }

  // ── Run generation ──────────────────────────────────────────────────────────
  const inventory = await buildContentInventory()
  const results: SeedResult[] = []
  let savedDrafts        = 0
  let autoPublishedCount = 0
  let dryRunPassed       = 0
  let skipped            = 0
  let errors             = 0

  for (let i = 0; i < topicsToProcess.length; i++) {
    const { locale: entryLocale, topic } = topicsToProcess[i]

    if (i > 0) await delay(400)

    const preCheck = scoreNovelty(
      { type: 'dilemma', locale: entryLocale, title: topic },
      inventory,
    )

    const inventorySummary = {
      totalDilemmas:     inventory.filter(x => x.type === 'dilemma').length,
      totalBlogArticles: inventory.filter(x => x.type === 'blog_article').length,
      categories:        [...new Set(inventory.map(x => x.category).filter(Boolean))] as string[],
      recentKeywords:    inventory.flatMap(x => x.keywords).slice(0, 30),
      similarTitles:     preCheck.similarItems.map(x => x.title),
    }

    const similarWarnings = preCheck.similarItems
      .filter(x => x.similarity >= 50)
      .map(x => `"${x.title}" (${x.similarity}% similar)`)

    const { system, prompt } = buildDilemmaPrompt({
      type:   'dilemma',
      locale: entryLocale,
      topic,
      inventory: inventorySummary,
      similarContentWarnings: similarWarnings,
    })

    const generated = await generateWithOpenRouter({ system, prompt })

    if (!generated.ok) {
      results.push({ index: i + 1, locale: entryLocale, topic, status: 'error', errorCode: generated.error })
      errors++
      continue
    }

    const validation = validateGeneratedOutput(generated.text, 'dilemma', entryLocale, inventory)

    if (!validation.ok) {
      results.push({ index: i + 1, locale: entryLocale, topic, status: 'error', errorCode: validation.error })
      errors++
      continue
    }

    const candidate = validation.candidate as ValidatedDilemma

    if (candidate.noveltyScore < NOVELTY_THRESHOLD) {
      results.push({
        index: i + 1,
        locale: entryLocale,
        topic,
        status: 'skipped_novelty',
        noveltyScore: candidate.noveltyScore,
        similarItemsCount: candidate.similarItems.length,
        category: candidate.category,
        question: candidate.question,
        topKeyword: candidate.keywords[0],
      })
      skipped++
      continue
    }

    const scenario = dilemmaToScenario(candidate, topic)

    // Always update local inventory so subsequent novelty checks within this request are aware
    inventory.push({
      id:             scenario.id,
      type:           'dilemma',
      locale:         entryLocale,
      title:          scenario.question,
      slug:           scenario.id,
      category:       scenario.category,
      keywords:       scenario.keywords ?? [],
      status:         'draft',
      source:         'ai_generated',
      searchableText: `${scenario.question} ${scenario.optionA} ${scenario.optionB} ${(scenario.keywords ?? []).join(' ')}`,
    })

    if (dryRun) {
      results.push({
        index: i + 1,
        locale: entryLocale,
        topic,
        status: 'dry_run',
        id: scenario.id,
        category: candidate.category,
        question: candidate.question,
        noveltyScore: candidate.noveltyScore,
        similarItemsCount: candidate.similarItems.length,
        topKeyword: candidate.keywords[0],
      })
      dryRunPassed++
    } else {
      // ── Attempt auto-publish when requested, cap not reached, pool has room ──
      let didPublish     = false
      let publishNote:     string   | undefined
      let gateReasons:    string[] | undefined

      if (autoPublish && autoPublishedCount < AUTO_PUBLISH_CAP) {
        if (approvedAtStart + autoPublishedCount >= MAX_DYNAMIC) {
          publishNote = 'pool_full'
        } else {
          const gateResult = runQualityGates({
            locale:            entryLocale,
            question:          candidate.question,
            optionA:           candidate.optionA,
            optionB:           candidate.optionB,
            category:          candidate.category,
            seoTitle:          candidate.seoTitle,
            seoDescription:    candidate.seoDescription,
            keywords:          candidate.keywords,
            scores:            scenario.scores,
            similarItemsCount: candidate.similarItems.length,
          })

          if (gateResult.passed) {
            const approvedScenario: DynamicScenario = {
              ...scenario,
              status:             'approved',
              approvedAt:         new Date().toISOString(),
              autoPublished:      true,
              qualityGateScore:   gateResult.score,
              qualityGateReasons: [],
              generatedBy:        'seed_batch',
            }
            try {
              await saveDynamicScenarios([approvedScenario])
              results.push({
                index: i + 1,
                locale: entryLocale,
                topic,
                status: 'auto_published',
                id: scenario.id,
                category: candidate.category,
                question: candidate.question,
                noveltyScore: candidate.noveltyScore,
                similarItemsCount: candidate.similarItems.length,
                topKeyword: candidate.keywords[0],
                qualityGateReasons: [],
              })
              autoPublishedCount++
              didPublish = true
            } catch {
              publishNote = 'publish_redis_error'
            }
          } else {
            publishNote = 'quality_gate_failed'
            gateReasons = gateResult.reasons
          }
        }
      }

      if (!didPublish) {
        // Covers: autoPublish=false, cap reached, pool full, gate failed, redis error fallback
        try {
          await saveDraftScenarios([scenario])
          results.push({
            index: i + 1,
            locale: entryLocale,
            topic,
            status: 'saved',
            id: scenario.id,
            category: candidate.category,
            question: candidate.question,
            noveltyScore: candidate.noveltyScore,
            similarItemsCount: candidate.similarItems.length,
            topKeyword: candidate.keywords[0],
            ...(publishNote  ? { publishNote }          : {}),
            ...(gateReasons  ? { qualityGateReasons: gateReasons } : {}),
          })
          savedDrafts++
        } catch {
          results.push({ index: i + 1, locale: entryLocale, topic, status: 'error', errorCode: 'redis_save_failed' })
          errors++
        }
      }
    }
  }

  // ── Category breakdown (saved + dry_run + auto_published) ───────────────────
  const categoryBreakdown: Record<string, number> = {}
  for (const r of results) {
    if ((r.status === 'saved' || r.status === 'dry_run' || r.status === 'auto_published') && r.category) {
      categoryBreakdown[r.category] = (categoryBreakdown[r.category] ?? 0) + 1
    }
  }

  return NextResponse.json({
    summary: {
      total:           topicsToProcess.length,
      savedDrafts,
      autoPublished:   autoPublishedCount,
      ...(dryRun ? { dryRunPassed } : {}),
      skipped_novelty: skipped,
      errors,
    },
    dryRun,
    autoPublish,
    noveltyThreshold: NOVELTY_THRESHOLD,
    estimatedCost: {
      calls:     topicsToProcess.length,
      modelName: process.env.OPENROUTER_MODEL_DRAFT ?? 'openrouter',
      note:      `Approx. ${topicsToProcess.length} OpenRouter calls — actual billing depends on provider pricing.`,
    },
    categoryBreakdown,
    results,
  })
}
