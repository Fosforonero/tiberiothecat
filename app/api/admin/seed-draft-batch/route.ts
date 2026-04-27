/**
 * POST /api/admin/seed-draft-batch
 *
 * One-shot controlled seed: generates 10 EN + 10 IT dilemma drafts using OpenRouter.
 * - Admin-only (Supabase session required)
 * - Novelty guard: skip if noveltyScore < NOVELTY_THRESHOLD
 * - Never approves or publishes anything
 * - Saves passing drafts to dynamic:drafts
 * - Returns a summary table for admin review
 *
 * maxDuration = 300 (Vercel Pro required — ~150-200s for 20 sequential calls)
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isAdminEmail } from '@/lib/admin-auth'
import { isOpenRouterConfigured, generateWithOpenRouter } from '@/lib/openrouter'
import { buildContentInventory } from '@/lib/content-inventory'
import { scoreNovelty } from '@/lib/content-dedup'
import { buildDilemmaPrompt } from '@/lib/content-generation-prompts'
import { validateGeneratedOutput, slugify, type ValidatedDilemma } from '@/lib/content-generation-validate'
import { saveDraftScenarios, type DynamicScenario } from '@/lib/dynamic-scenarios'
import type { Category } from '@/lib/scenarios'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 300

const NOVELTY_THRESHOLD = 55

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
  const viralScore    = 55
  const seoScore      = 65
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
    status:         'draft',
    seoTitle:       candidate.seoTitle,
    seoDescription: candidate.seoDescription,
    keywords:       candidate.keywords,
    scores: { viralScore, seoScore, noveltyScore, feedbackScore, finalScore },
  }
}

const delay = (ms: number) => new Promise<void>(r => setTimeout(r, ms))

export interface SeedResult {
  index: number
  locale: 'en' | 'it'
  topic: string
  status: 'saved' | 'skipped_novelty' | 'error'
  id?: string
  category?: string
  question?: string
  noveltyScore?: number
  similarItemsCount?: number
  topKeyword?: string
  errorCode?: string
}

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email || !isAdminEmail(user.email)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!isOpenRouterConfigured()) {
    return NextResponse.json({ error: 'openrouter_not_configured' }, { status: 503 })
  }

  const inventory = await buildContentInventory()
  const results: SeedResult[] = []
  let saved = 0
  let skipped = 0
  let errors = 0

  for (let i = 0; i < SEED_TOPICS.length; i++) {
    const { locale, topic } = SEED_TOPICS[i]

    // Small delay between calls to respect rate limits
    if (i > 0) await delay(400)

    const preCheck = scoreNovelty(
      { type: 'dilemma', locale, title: topic },
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
      locale,
      topic,
      inventory: inventorySummary,
      similarContentWarnings: similarWarnings,
    })

    const generated = await generateWithOpenRouter({ system, prompt })

    if (!generated.ok) {
      results.push({ index: i + 1, locale, topic, status: 'error', errorCode: generated.error })
      errors++
      continue
    }

    const validation = validateGeneratedOutput(generated.text, 'dilemma', locale, inventory)

    if (!validation.ok) {
      results.push({ index: i + 1, locale, topic, status: 'error', errorCode: validation.error })
      errors++
      continue
    }

    const candidate = validation.candidate as ValidatedDilemma

    if (candidate.noveltyScore < NOVELTY_THRESHOLD) {
      results.push({
        index: i + 1,
        locale,
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

    try {
      await saveDraftScenarios([scenario])
      // Add to local inventory so subsequent novelty checks are aware of it
      inventory.push({
        id:             scenario.id,
        type:           'dilemma',
        locale,
        title:          scenario.question,
        slug:           scenario.id,
        category:       scenario.category,
        keywords:       scenario.keywords ?? [],
        status:         'draft',
        source:         'ai_generated',
        searchableText: `${scenario.question} ${scenario.optionA} ${scenario.optionB} ${(scenario.keywords ?? []).join(' ')}`,
      })
      results.push({
        index: i + 1,
        locale,
        topic,
        status: 'saved',
        id: scenario.id,
        category: candidate.category,
        question: candidate.question,
        noveltyScore: candidate.noveltyScore,
        similarItemsCount: candidate.similarItems.length,
        topKeyword: candidate.keywords[0],
      })
      saved++
    } catch {
      results.push({ index: i + 1, locale, topic, status: 'error', errorCode: 'redis_save_failed' })
      errors++
    }
  }

  return NextResponse.json({
    summary: {
      total: SEED_TOPICS.length,
      saved,
      skipped_novelty: skipped,
      errors,
    },
    noveltyThreshold: NOVELTY_THRESHOLD,
    results,
  })
}
