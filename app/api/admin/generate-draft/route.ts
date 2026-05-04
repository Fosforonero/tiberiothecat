import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-guard'
import { isOpenRouterConfigured, generateWithOpenRouter } from '@/lib/openrouter'
import { buildContentInventory } from '@/lib/content-inventory'
import { scoreNovelty, detectMoralArchetypes, getArchetypeSaturation, MORAL_ARCHETYPES } from '@/lib/content-dedup'
import {
  buildDilemmaPrompt,
  buildBlogArticlePrompt,
  buildTranslationPrompt,
  buildLifestyleDilemmaPrompt,
  type GenerationType,
  type GenerationLocale,
  type ArticleKind,
} from '@/lib/content-generation-prompts'
import {
  validateGeneratedOutput,
  slugify,
  type ValidatedDilemma,
  type ValidatedBlogArticle,
} from '@/lib/content-generation-validate'
import { saveDraftScenarios, type DynamicScenario } from '@/lib/dynamic-scenarios'
import { buildComparisonItems, runSemanticReview, isBlockingVerdict } from '@/lib/content-semantic-review'
import type { Category } from '@/lib/scenarios'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 300

const MORAL_NOVELTY_THRESHOLD     = 55
const LIFESTYLE_NOVELTY_THRESHOLD = 10

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

/** Per-use-case model + token + temperature config. All model env vars fall back to OPENROUTER_MODEL_DRAFT. */
function getModelConfig(type: string, articleKind: ArticleKind): {
  model: string | undefined
  maxTokens: number
  temperature: number
  timeoutMs: number
} {
  if (type === 'dilemma') return {
    model:       process.env.OPENROUTER_MODEL_DILEMMA_DRAFT ?? process.env.OPENROUTER_MODEL_DRAFT,
    maxTokens:   1400,
    temperature: 0.9,
    timeoutMs:   45_000,
  }
  if (articleKind === 'cornerstone') return {
    model:       process.env.OPENROUTER_MODEL_CORNERSTONE_DRAFT
                 ?? process.env.OPENROUTER_MODEL_ARTICLE_DRAFT
                 ?? process.env.OPENROUTER_MODEL_DRAFT,
    maxTokens:   5500,
    temperature: 0.75,
    timeoutMs:   120_000,
  }
  // standard article
  return {
    model:       process.env.OPENROUTER_MODEL_ARTICLE_DRAFT ?? process.env.OPENROUTER_MODEL_DRAFT,
    maxTokens:   2500,
    temperature: 0.80,
    timeoutMs:   60_000,
  }
}

function getTranslationConfig(articleKind: ArticleKind): {
  model: string | undefined
  maxTokens: number
  timeoutMs: number
} {
  return {
    model:     process.env.OPENROUTER_MODEL_TRANSLATION
               ?? process.env.OPENROUTER_MODEL_ARTICLE_DRAFT
               ?? process.env.OPENROUTER_MODEL_DRAFT,
    maxTokens: articleKind === 'cornerstone' ? 5500 : 2500,
    timeoutMs: articleKind === 'cornerstone' ? 120_000 : 60_000,
  }
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
  const auth = await requireAdmin()
  if (auth instanceof NextResponse) return auth

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

  const { type, locale, topic, mode, allowLowNovelty, articleKind, angle, notes, style } = body as Record<string, unknown>
  const dilemmaStyle: 'moral' | 'lifestyle' = style === 'lifestyle' ? 'lifestyle' : 'moral'
  const NOVELTY_THRESHOLD = dilemmaStyle === 'lifestyle' ? LIFESTYLE_NOVELTY_THRESHOLD : MORAL_NOVELTY_THRESHOLD

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
  const cleanArticleKind: ArticleKind =
    (type === 'blog_article' && articleKind === 'cornerstone') ? 'cornerstone' : 'standard'
  const cleanAngle = typeof angle === 'string' ? angle.trim().slice(0, 200) : undefined
  const cleanNotes = typeof notes === 'string' ? notes.trim().slice(0, 400) : undefined

  // Blog articles: save not supported — they require manual editing into lib/blog.ts
  if (cleanMode === 'save' && type === 'blog_article') {
    return NextResponse.json({ error: 'blog_article_save_not_supported' }, { status: 400 })
  }

  const cleanTopic = (topic as string).trim()
  const inventory = await buildContentInventory()

  const preCheck = scoreNovelty(
    { type: type as GenerationType, locale: locale as GenerationLocale, title: cleanTopic },
    inventory,
  )

  const ARCHETYPE_THRESHOLD = 3
  const archetypeSaturation = getArchetypeSaturation(inventory)
  const saturatedArchetypeLabels = MORAL_ARCHETYPES
    .filter(a => (archetypeSaturation.get(a.id) ?? 0) >= ARCHETYPE_THRESHOLD)
    .map(a => a.label)

  const localeItems = inventory.filter(i => i.type === 'dilemma' && i.locale === (locale as 'en' | 'it'))
  const categoryCounts: Record<string, number> = {}
  for (const item of localeItems) {
    if (item.category) categoryCounts[item.category] = (categoryCounts[item.category] ?? 0) + 1
  }

  const inventorySummary = {
    totalDilemmas:               inventory.filter(i => i.type === 'dilemma').length,
    totalBlogArticles:           inventory.filter(i => i.type === 'blog_article').length,
    categories:                  [...new Set(inventory.map(i => i.category).filter(Boolean))] as string[],
    recentKeywords:              inventory.flatMap(i => i.keywords).slice(0, 30),
    similarTitles:               preCheck.similarItems.map(s => s.title),
    categoryCounts,
    saturatedArchetypes:         saturatedArchetypeLabels,
    existingQuestionsInCategory: [],
  }

  const similarContentWarnings = preCheck.similarItems
    .filter(s => s.similarity >= 50)
    .map(s => `"${s.title}" (${s.similarity}% similar)`)

  const promptInput = {
    type:     type as GenerationType,
    locale:   locale as GenerationLocale,
    topic:    cleanTopic,
    inventory: inventorySummary,
    similarContentWarnings,
    articleKind: cleanArticleKind,
    angle:    cleanAngle,
    notes:    cleanNotes,
  }

  const existingLifestyleQs = dilemmaStyle === 'lifestyle'
    ? inventory.filter(i => i.type === 'dilemma' && i.category === 'lifestyle' && i.locale === (locale as string)).map(i => i.title).slice(0, 6)
    : []
  const { system, prompt } = type === 'dilemma'
    ? (dilemmaStyle === 'lifestyle'
        ? buildLifestyleDilemmaPrompt(locale as GenerationLocale, cleanTopic, existingLifestyleQs)
        : buildDilemmaPrompt(promptInput))
    : buildBlogArticlePrompt(promptInput)

  const { model, maxTokens, temperature, timeoutMs } = getModelConfig(type as string, cleanArticleKind)
  const generated = await generateWithOpenRouter({ system, prompt, model, maxTokens, temperature }, timeoutMs)

  if (!generated.ok) {
    return NextResponse.json({ error: generated.error }, { status: 502 })
  }

  const validation = validateGeneratedOutput(
    generated.text,
    type as 'dilemma' | 'blog_article',
    locale as 'en' | 'it',
    inventory,
    cleanArticleKind,
  )

  if (!validation.ok) {
    return NextResponse.json(
      { error: validation.error, raw: validation.raw },
      { status: 422 },
    )
  }

  const candidate = validation.candidate

  // Archetype saturation penalty — dilemmas only
  if (type === 'dilemma') {
    const dc = candidate as ValidatedDilemma
    const candidateText = `${dc.question} ${dc.optionA} ${dc.optionB}`
    const matchedArchetypes = detectMoralArchetypes(candidateText)
    const saturatedMatches = matchedArchetypes.filter(id => (archetypeSaturation.get(id) ?? 0) >= ARCHETYPE_THRESHOLD)
    if (saturatedMatches.length > 0) {
      const penalty = Math.min(15, saturatedMatches.length * 8)
      dc.noveltyScore = Math.max(0, dc.noveltyScore - penalty)
      for (const id of saturatedMatches) dc.warnings.push(`archetype_saturation:${id}`)
    }
  }

  // ── Blog article preview → generate bilingual translation ─────────────────
  if (type === 'blog_article' && cleanMode === 'preview') {
    const sourceArticle = candidate as ValidatedBlogArticle
    const targetLocale: 'en' | 'it' = (locale as string) === 'en' ? 'it' : 'en'
    const { model: tModel, maxTokens: tMaxTokens, timeoutMs: tTimeout } = getTranslationConfig(cleanArticleKind)

    const { system: tSystem, prompt: tPrompt } = buildTranslationPrompt(
      sourceArticle,
      targetLocale,
      cleanArticleKind,
    )

    const translationGenerated = await generateWithOpenRouter(
      { system: tSystem, prompt: tPrompt, model: tModel, maxTokens: tMaxTokens, temperature: 0.65 },
      tTimeout,
    )

    if (!translationGenerated.ok) {
      return NextResponse.json({
        ok: true,
        mode: 'preview',
        candidate: sourceArticle,
        translation: null,
        translationFailed: true,
        translationError: translationGenerated.error,
      })
    }

    const translationValidation = validateGeneratedOutput(
      translationGenerated.text,
      'blog_article',
      targetLocale,
      inventory,
      cleanArticleKind,
    )

    if (!translationValidation.ok) {
      return NextResponse.json({
        ok: true,
        mode: 'preview',
        candidate: sourceArticle,
        translation: null,
        translationFailed: true,
        translationError: translationValidation.error,
      })
    }

    return NextResponse.json({
      ok: true,
      mode: 'preview',
      candidate: sourceArticle,
      translation: translationValidation.candidate,
      translationFailed: false,
    })
  }

  // Preview mode (dilemma)
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

  // ── Semantic review (save path only) ─────────────────────────────────────
  const comparisonItems = buildComparisonItems(
    locale as string,
    dilemmaCandidate.category,
    dilemmaCandidate.similarItems.map(s => ({ id: s.id, title: s.title })),
    inventory,
  )

  const reviewOutcome = await runSemanticReview(
    {
      candidate: {
        question: dilemmaCandidate.question,
        optionA:  dilemmaCandidate.optionA,
        optionB:  dilemmaCandidate.optionB,
        category: dilemmaCandidate.category,
        locale:   locale as string,
      },
      comparisonItems,
    },
    15_000,
  )

  if (!reviewOutcome.ok) {
    dilemmaCandidate.warnings.push('semantic_review_failed')
  } else if (isBlockingVerdict(reviewOutcome.result.verdict)) {
    dilemmaCandidate.warnings.push(`semantic_review:${reviewOutcome.result.verdict}`)
  }

  const scenario = dilemmaToScenario(dilemmaCandidate, cleanTopic)
  if (dilemmaStyle === 'lifestyle') scenario.dilemmaStyle = 'lifestyle'
  if (reviewOutcome.ok) {
    scenario.semanticReview = {
      verdict:           reviewOutcome.result.verdict,
      reason:            reviewOutcome.result.reason,
      closestMatchId:    reviewOutcome.result.closestMatch?.id,
      closestMatchTitle: reviewOutcome.result.closestMatch?.title,
    }
  }

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
