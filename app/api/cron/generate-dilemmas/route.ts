/**
 * Vercel Cron endpoint — runs daily at 06:00 UTC.
 * 1. Fetches multi-source trend signals (Google Trends, Reddit, RSS)
 * 2. Sends to Claude API — generates EN + IT dilemmas with SEO fields
 * 3. Validates, deduplicates (semantic), scores each draft
 * 4. Saves to draft queue (admin must approve before going public)
 *
 * Auth: Authorization: Bearer <CRON_SECRET>  (Vercel native)
 *       x-cron-secret: <CRON_SECRET>         (internal admin calls)
 */

import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import {
  saveDraftScenarios,
  saveDynamicScenarios,
  getDynamicScenarios,
  getDraftScenarios,
  isSimilarToExisting,
} from '@/lib/dynamic-scenarios'
import type { DynamicScenario, DilemmaScores } from '@/lib/dynamic-scenarios'
import {
  fetchTrendSignals,
  computeSeoScore,
  computeNoveltyScore,
  computeViralScore,
} from '@/lib/trend-signals'
import type { TrendSignal } from '@/lib/trend-signals'
import type { Category } from '@/lib/scenarios'
import { runQualityGates } from '@/lib/content-quality-gates'

export const runtime = 'nodejs'

// ── Validation ─────────────────────────────────────────────────

const VALID_CATEGORIES: Category[] = [
  'morality', 'survival', 'loyalty', 'justice',
  'freedom', 'technology', 'society', 'relationships',
]

const EXISTING_IDS = new Set([
  'trolley', 'lifeboat', 'truth-friend', 'cure-secret', 'time-machine',
  'privacy-terror', 'rich-or-fair', 'memory-erase', 'steal-medicine',
  'robot-judge', 'organ-harvest', 'mercy-kill', 'whistleblower', 'confess-crime',
  'plane-parachute', 'zombie-apocalypse', 'pandemic-dose', 'report-friend',
  'cover-accident', 'sibling-secret', 'innocent-juror', 'death-row-exonerated',
  'revenge-vs-forgiveness', 'censor-speech', 'mandatory-vaccine', 'surveillance-city',
  'ai-art-copyright', 'self-driving-crash', 'brain-upload', 'delete-social-media',
  'ai-replaces-jobs', 'deepfake-expose', 'tax-billionaires', 'open-borders',
  'universal-basic-income', 'drug-legalization', 'prison-abolition',
  'love-or-career', 'old-secret-affair', 'forgive-cheater', 'save-partner-vs-stranger',
])

const BLOCKED_PATTERNS = [
  /trump/i, /biden/i, /putin/i, /xi jinping/i, /musk/i, /bezos/i,
  /kill yourself/i, /suicide/i, /rape/i, /child porn/i,
]

function isValidDilemma(d: Partial<DynamicScenario>): boolean {
  if (!d.id || !d.question || !d.optionA || !d.optionB || !d.emoji || !d.category) return false
  if (!VALID_CATEGORIES.includes(d.category as Category)) return false
  if (!/^[a-z0-9-]+$/.test(d.id)) return false
  if (d.id.length < 3 || d.id.length > 60) return false
  if (EXISTING_IDS.has(d.id)) return false
  if (d.question.length < 20 || d.question.length > 300) return false
  if (d.optionA.length < 5 || d.optionA.length > 100) return false
  if (d.optionB.length < 5 || d.optionB.length > 100) return false
  const allText = `${d.id} ${d.question} ${d.optionA} ${d.optionB} ${d.trend ?? ''}`
  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(allText)) return false
  }
  return true
}

// ── Generate dilemmas via Claude ───────────────────────────────

interface GeneratedDilemmaRaw {
  id: string
  question: string
  optionA: string
  optionB: string
  emoji: string
  category: Category
  trend: string
  seoTitle: string
  seoDescription: string
  keywords: string[]
  // Expert insight fields — optional, draft-only, admin review required before shown publicly
  insightBody?: string
  insightWhySplit?: string
  insightPerspectiveA?: string
  insightPerspectiveB?: string
}

async function generateDilemmas(
  signals: TrendSignal[],
  locale: 'en' | 'it',
  count = 3,
  feedbackHint = '',
): Promise<Array<GeneratedDilemmaRaw & { _signal?: TrendSignal }>> {
  const client = new Anthropic()
  const trendList = signals.map((s, i) => `${i + 1}. ${s.title} [score:${s.score} src:${s.source}]`).join('\n')

  const langInstructions = locale === 'it'
    ? `Write ALL text fields in ITALIAN (question, optionA, optionB, seoTitle, seoDescription, keywords). The id must still be URL-safe English lowercase with hyphens (e.g. "lavoro-o-famiglia"). The trend field is the original Italian trend headline.`
    : `Write ALL text fields in ENGLISH. The id must be URL-safe lowercase with hyphens.`

  const prompt = `You are generating viral moral dilemma polls for splitvote.io — a site where people vote on impossible ethical questions in real time.

Today's trending topics and news headlines (${locale.toUpperCase()}):
${trendList}

${langInstructions}

Generate exactly ${count} moral dilemmas INSPIRED by these trends (not directly copied — adapt them into timeless ethical questions).
${feedbackHint ? `\n${feedbackHint}\n` : ''}
Rules:
- Each dilemma must be a genuine ethical conflict with no obvious right answer
- Options A and B should represent roughly equal, defensible positions
- Keep language simple and punchy — these are social media content
- Do NOT use real people's names (politicians, celebrities, executives)
- Avoid anything defamatory, sexual, or about self-harm
- Categories must be one of: morality, survival, loyalty, justice, freedom, technology, society, relationships
- IDs must be URL-safe lowercase with hyphens (English slug even for IT), NOT match: ${Array.from(EXISTING_IDS).slice(0, 20).join(', ')}…
- seoTitle: compelling headline for Google (50-60 chars)
- seoDescription: 1-2 sentence description for Google snippet (120-160 chars)
- keywords: 5-8 SEO keywords as JSON array
- insightBody: 1-2 sentences on the core philosophical or psychological tension (educational, NOT professional advice)
- insightWhySplit: 1 sentence explaining why reasonable people end up on opposite sides
- insightPerspectiveA: starts "Choosing this option may suggest…" — cautious, non-diagnostic framing for option A (use "may", "might", "could suggest" — never definitive claims about users' psychology)
- insightPerspectiveB: starts "Choosing this option may suggest…" — same style for option B

Respond with ONLY a JSON array — no explanation, no markdown:
[{"id":"…","question":"…","optionA":"…","optionB":"…","emoji":"…","category":"…","trend":"…","seoTitle":"…","seoDescription":"…","keywords":["…"],"insightBody":"…","insightWhySplit":"…","insightPerspectiveA":"…","insightPerspectiveB":"…"}]`

  const message = await client.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 2048,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = message.content[0].type === 'text' ? message.content[0].text : ''
  const jsonMatch = text.match(/\[[\s\S]*\]/)
  if (!jsonMatch) throw new Error(`No JSON array found in Claude response (${locale})`)

  const parsed: GeneratedDilemmaRaw[] = JSON.parse(jsonMatch[0])

  // Try to match each generated dilemma back to its inspiring signal
  return parsed.map(d => {
    const matchedSignal = signals.find(sig =>
      d.trend?.toLowerCase().includes(sig.title.toLowerCase().slice(0, 15)) ||
      sig.title.toLowerCase().includes(d.trend?.toLowerCase().slice(0, 15) ?? '')
    )
    return { ...d, _signal: matchedSignal }
  })
}

// ── Route handler ──────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const authHeader   = request.headers.get('authorization')
  const bearerSecret = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
  const secret       = request.headers.get('x-cron-secret') ?? bearerSecret
  const expectedSecret = process.env.CRON_SECRET
  if (!expectedSecret) {
    return NextResponse.json({ error: 'Cron not configured' }, { status: 401 })
  }
  if (secret !== expectedSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const localeParam = request.nextUrl.searchParams.get('locale') as 'en' | 'it' | null
  const dryRun      = request.nextUrl.searchParams.get('dry') === '1'

  // Autopublish config — fail closed: only active when explicitly set to 'true'
  const shouldAutopublish = process.env.AUTO_PUBLISH_DILEMMAS === 'true'
  const maxPerRun = Math.max(1, parseInt(process.env.AUTO_PUBLISH_DILEMMAS_MAX_PER_RUN ?? '1', 10))
  let autoPublishedThisRun = 0

  try {
    const results: Record<string, unknown> = {}
    const localesToRun: Array<'en' | 'it'> = localeParam ? [localeParam] : ['en', 'it']

    const [existingApproved, existingDrafts] = await Promise.all([
      getDynamicScenarios(),
      getDraftScenarios(),
    ])
    const allExisting = [...existingApproved, ...existingDrafts]
    const existingQuestions = allExisting.map(s => s.question)

    for (const locale of localesToRun) {
      // Fetch multi-source trend signals
      const signals = await fetchTrendSignals(locale)

      if (signals.length === 0) {
        results[locale] = { ok: false, reason: 'No trend signals fetched' }
        continue
      }

      // Compute category-level feedback hint — weak soft signal for prompt framing only.
      // Non-blocking: if it fails, generation proceeds without it.
      let feedbackHint = ''
      try {
        const localeApproved = existingApproved.filter(s => s.locale === locale)
        const catScores = new Map<string, { sum: number; count: number }>()
        for (const s of localeApproved) {
          if (!s.scores || !s.category) continue
          const score = s.scores.feedbackScore
          if (score === 50) continue
          const entry = catScores.get(s.category) ?? { sum: 0, count: 0 }
          catScores.set(s.category, { sum: entry.sum + score, count: entry.count + 1 })
        }
        const catAverages = [...catScores.entries()]
          .filter(([, v]) => v.count >= 3)
          .map(([category, v]) => ({ category, avg: v.sum / v.count, count: v.count }))
        const highCats = catAverages
          .filter(c => c.avg >= 65)
          .sort((a, b) => b.avg - a.avg)
          .slice(0, 2).map(c => c.category)
        const lowCats = catAverages
          .filter(c => c.avg <= 40)
          .sort((a, b) => a.avg - b.avg)
          .slice(0, 2).map(c => c.category)
        if (highCats.length > 0 || lowCats.length > 0) {
          feedbackHint = `Internal audience feedback is a weak editorial hint, not a ranking rule.`
          if (highCats.length > 0)
            feedbackHint += `\nCategories with stronger recent feedback: ${highCats.join(', ')}`
          if (lowCats.length > 0)
            feedbackHint += `\nCategories with weaker recent feedback: ${lowCats.join(', ')}`
          feedbackHint += `\nUse this only as a light signal for topic framing and variety. Do not over-optimize for it. Do not avoid weaker categories entirely.`
        }
      } catch {
        // feedbackHint stays empty — generation proceeds without it
      }

      const rawDilemmas = await generateDilemmas(signals, locale, 3, feedbackHint)
      const now = new Date().toISOString()

      // Validate + score + dedup
      const deduped: DynamicScenario[] = []
      const dupIds: string[] = []
      const skippedInvalid: string[] = []

      for (const raw of rawDilemmas) {
        const expertInsightField = locale === 'it' ? 'expertInsightIt' : 'expertInsightEn'
        const expertInsightValue = raw.insightBody ? {
          body: raw.insightBody,
          ...(raw.insightWhySplit && { whyPeopleSplit: raw.insightWhySplit }),
          ...(raw.insightPerspectiveA && raw.insightPerspectiveB && {
            whatYourAnswerMaySuggest: { a: raw.insightPerspectiveA, b: raw.insightPerspectiveB },
          }),
        } : undefined

        const candidate: Partial<DynamicScenario> = {
          ...raw,
          locale,
          generatedAt: now,
          status: 'draft',
          trendSource: (raw._signal?.source as DynamicScenario['trendSource']) ?? 'mixed',
          trendUrl: raw._signal?.url,
          keywords: Array.isArray(raw.keywords) ? raw.keywords.slice(0, 8) : [],
          ...(expertInsightValue && { [expertInsightField]: expertInsightValue }),
        }

        if (!isValidDilemma(candidate)) {
          skippedInvalid.push(raw.id ?? '?')
          continue
        }

        if (isSimilarToExisting(
          { id: raw.id, question: raw.question, trend: raw.trend },
          [...allExisting, ...deduped],
        )) {
          dupIds.push(raw.id)
          continue
        }

        // Compute scores
        const viralScore   = computeViralScore(raw._signal ?? null)
        const seoScore     = computeSeoScore(raw.seoTitle, raw.seoDescription, raw.keywords)
        const noveltyScore = computeNoveltyScore(raw.question, existingQuestions)
        const feedbackScore = 50 // neutral starting point
        const finalScore   = Math.round(
          viralScore   * 0.35 +
          seoScore     * 0.25 +
          noveltyScore * 0.25 +
          feedbackScore * 0.15
        )

        const scores: DilemmaScores = { viralScore, seoScore, noveltyScore, feedbackScore, finalScore }

        const scenario: DynamicScenario = {
          ...(candidate as DynamicScenario),
          scores,
        }
        deduped.push(scenario)
        allExisting.push(scenario)
        existingQuestions.push(scenario.question)
      }

      if (deduped.length === 0) {
        results[locale] = {
          ok: false,
          reason: 'All generated dilemmas were filtered',
          skippedInvalid,
          dupIds,
          signals: signals.slice(0, 5).map(s => ({ title: s.title, source: s.source, score: s.score })),
        }
        continue
      }

      // Split deduped into autopublish vs draft based on quality gates
      const toAutoPublish: DynamicScenario[] = []
      const toDraft: DynamicScenario[] = []

      for (const scenario of deduped) {
        if (shouldAutopublish && autoPublishedThisRun < maxPerRun) {
          const gates = runQualityGates({
            locale:          scenario.locale,
            question:        scenario.question,
            optionA:         scenario.optionA,
            optionB:         scenario.optionB,
            category:        scenario.category,
            seoTitle:        scenario.seoTitle,
            seoDescription:  scenario.seoDescription,
            keywords:        scenario.keywords,
            scores:          scenario.scores,
          })
          if (gates.passed) {
            toAutoPublish.push({
              ...scenario,
              status:              'approved',
              approvedAt:          new Date().toISOString(),
              autoPublished:       true,
              qualityGateScore:    gates.score,
              qualityGateReasons:  gates.reasons,
              generatedBy:         'cron',
            })
            autoPublishedThisRun++
            continue
          }
        }
        toDraft.push({ ...scenario, generatedBy: 'cron' })
      }

      if (!dryRun) {
        if (toAutoPublish.length > 0) await saveDynamicScenarios(toAutoPublish)
        if (toDraft.length > 0) await saveDraftScenarios(toDraft)
      }

      results[locale] = {
        ok: true,
        generated:          deduped.length,
        autoPublished:      toAutoPublish.length,
        savedToDraft:       toDraft.length,
        skippedDuplicates:  dupIds.length,
        skippedInvalid:     skippedInvalid.length,
        dryRun,
        signals: signals.slice(0, 5).map(s => ({ title: s.title, source: s.source, score: s.score })),
        dilemmas: deduped.map(d => ({
          id:             d.id,
          question:       d.question,
          trend:          d.trend,
          trendSource:    d.trendSource,
          seoTitle:       d.seoTitle,
          keywords:       d.keywords,
          status:         toAutoPublish.find(a => a.id === d.id) ? 'auto_published' : d.status,
          scores:         d.scores,
          autoPublished:  toAutoPublish.some(a => a.id === d.id),
        })),
      }
    }

    return NextResponse.json({ ok: true, locales: localesToRun, results })
  } catch (err) {
    console.error('[cron/generate-dilemmas]', err)
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}
