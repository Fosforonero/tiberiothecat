import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isAdminEmail } from '@/lib/admin-auth'
import { isOpenRouterConfigured, generateWithOpenRouter } from '@/lib/openrouter'
import { buildContentInventory } from '@/lib/content-inventory'
import { scoreNovelty } from '@/lib/content-dedup'
import { buildDilemmaPrompt, buildBlogArticlePrompt, type GenerationType, type GenerationLocale } from '@/lib/content-generation-prompts'
import { validateGeneratedOutput, slugify, type ValidatedDilemma } from '@/lib/content-generation-validate'
import { saveDraftScenarios, type DynamicScenario } from '@/lib/dynamic-scenarios'
import type { Category } from '@/lib/scenarios'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

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

function dilemmaToScenario(
  candidate: ValidatedDilemma,
  topic: string,
): DynamicScenario {
  const suffix = Date.now().toString(36).slice(-5)
  const id = `ai-${candidate.locale}-${slugify(candidate.question).slice(0, 24).replace(/-+$/, '')}-${suffix}`

  const viralScore    = 55
  const seoScore      = 65
  const noveltyScore  = candidate.noveltyScore
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

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email || !isAdminEmail(user.email)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!isOpenRouterConfigured()) {
    return NextResponse.json({ error: 'openrouter_not_configured' }, { status: 503 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'invalid_json_body' }, { status: 400 })
  }

  if (typeof body !== 'object' || body === null) {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 })
  }

  const { type, locale, topic, mode, allowLowNovelty } = body as Record<string, unknown>

  if (type !== 'dilemma' && type !== 'blog_article') {
    return NextResponse.json({ error: 'invalid_type' }, { status: 400 })
  }
  if (locale !== 'en' && locale !== 'it') {
    return NextResponse.json({ error: 'invalid_locale' }, { status: 400 })
  }
  if (typeof topic !== 'string' || topic.trim().length < 3 || topic.trim().length > 200) {
    return NextResponse.json({ error: 'invalid_topic' }, { status: 400 })
  }

  const cleanMode = mode === 'save' ? 'save' : 'preview'

  // Blog articles: save not supported — they require manual editing into lib/blog.ts
  if (cleanMode === 'save' && type === 'blog_article') {
    return NextResponse.json({ error: 'blog_article_save_not_supported' }, { status: 400 })
  }

  const cleanTopic = topic.trim()
  const inventory = await buildContentInventory()

  const preCheck = scoreNovelty(
    { type: type as GenerationType, locale: locale as GenerationLocale, title: cleanTopic },
    inventory,
  )

  const inventorySummary = {
    totalDilemmas:    inventory.filter(i => i.type === 'dilemma').length,
    totalBlogArticles: inventory.filter(i => i.type === 'blog_article').length,
    categories:       [...new Set(inventory.map(i => i.category).filter(Boolean))] as string[],
    recentKeywords:   inventory.flatMap(i => i.keywords).slice(0, 30),
    similarTitles:    preCheck.similarItems.map(s => s.title),
  }

  const similarContentWarnings = preCheck.similarItems
    .filter(s => s.similarity >= 50)
    .map(s => `"${s.title}" (${s.similarity}% similar)`)

  const promptInput = {
    type:    type as GenerationType,
    locale:  locale as GenerationLocale,
    topic:   cleanTopic,
    inventory: inventorySummary,
    similarContentWarnings,
  }

  const { system, prompt } = type === 'dilemma'
    ? buildDilemmaPrompt(promptInput)
    : buildBlogArticlePrompt(promptInput)

  const generated = await generateWithOpenRouter({ system, prompt })

  if (!generated.ok) {
    return NextResponse.json({ error: generated.error }, { status: 502 })
  }

  const validation = validateGeneratedOutput(generated.text, type, locale, inventory)

  if (!validation.ok) {
    return NextResponse.json(
      { error: validation.error, raw: validation.raw },
      { status: 422 },
    )
  }

  const candidate = validation.candidate

  // Preview mode — return without saving
  if (cleanMode === 'preview') {
    return NextResponse.json({ ok: true, mode: 'preview', candidate })
  }

  // Save mode — only dilemmas reach here
  const dilemmaCandidate = candidate as ValidatedDilemma

  // Dedup guard: block if noveltyScore below threshold, unless admin explicitly overrides
  if (dilemmaCandidate.noveltyScore < NOVELTY_THRESHOLD && allowLowNovelty !== true) {
    return NextResponse.json({
      ok: false,
      error: 'low_novelty',
      noveltyScore: dilemmaCandidate.noveltyScore,
      threshold: NOVELTY_THRESHOLD,
      candidate,
    }, { status: 409 })
  }

  const scenario = dilemmaToScenario(dilemmaCandidate, cleanTopic)

  try {
    await saveDraftScenarios([scenario])
  } catch {
    return NextResponse.json({ error: 'draft_save_failed' }, { status: 500 })
  }

  return NextResponse.json({
    ok: true,
    mode: 'save',
    savedId: scenario.id,
    noveltyScore: dilemmaCandidate.noveltyScore,
    candidate,
  })
}
