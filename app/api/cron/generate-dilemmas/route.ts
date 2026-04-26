/**
 * Vercel Cron endpoint — runs daily at 06:00 UTC.
 * 1. Fetches trending topics (US for EN, IT for Italian)
 * 2. Sends to Claude API — generates EN + IT dilemmas with SEO fields
 * 3. Validates + filters output
 * 4. Stores in Upstash Redis via saveDynamicScenarios()
 *
 * Protect with CRON_SECRET env var (set same value in vercel.json cron headers).
 */

import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { saveDynamicScenarios } from '@/lib/dynamic-scenarios'
import type { DynamicScenario } from '@/lib/dynamic-scenarios'
import type { Category } from '@/lib/scenarios'

export const runtime = 'nodejs'

// ── Fetch trending topics ──────────────────────────────────────

async function fetchGoogleTrends(geo: string): Promise<string[]> {
  try {
    const res = await fetch(
      `https://trends.google.com/trends/trendingsearches/daily/rss?geo=${geo}`,
      { next: { revalidate: 0 } }
    )
    const xml = await res.text()
    const matches = Array.from(xml.matchAll(/<item>[\s\S]*?<title><!\[CDATA\[(.*?)\]\]><\/title>/g))
    return matches.slice(0, 8).map((m) => m[1].trim())
  } catch {
    return []
  }
}

async function fetchRedditNews(subreddit = 'worldnews'): Promise<string[]> {
  try {
    const res = await fetch(
      `https://www.reddit.com/r/${subreddit}/hot.json?limit=8`,
      {
        headers: { 'User-Agent': 'splitvote-bot/1.0' },
        next: { revalidate: 0 },
      }
    )
    const json = await res.json()
    const posts = json?.data?.children ?? []
    return posts
      .map((p: { data: { title: string } }) => p.data.title)
      .filter((t: string) => t.length > 20)
      .slice(0, 5)
  } catch {
    return []
  }
}

// ── Validation helpers ─────────────────────────────────────────

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

// Patterns that suggest real people names or sensitive content
const BLOCKED_PATTERNS = [
  /trump/i, /biden/i, /putin/i, /xi jinping/i, /musk/i, /bezos/i,
  /kill yourself/i, /suicide/i, /rape/i, /child porn/i,
]

function isValidDilemma(d: Partial<DynamicScenario>): boolean {
  if (!d.id || !d.question || !d.optionA || !d.optionB || !d.emoji || !d.category) return false
  if (!VALID_CATEGORIES.includes(d.category as Category)) return false
  if (!/^[a-z0-9-]+$/.test(d.id)) return false // URL-safe slug only
  if (d.id.length < 3 || d.id.length > 60) return false
  if (EXISTING_IDS.has(d.id)) return false
  if (d.question.length < 20 || d.question.length > 300) return false
  if (d.optionA.length < 5 || d.optionA.length > 100) return false
  if (d.optionB.length < 5 || d.optionB.length > 100) return false

  // Check for blocked patterns across all text fields
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
}

async function generateDilemmas(
  trends: string[],
  locale: 'en' | 'it',
  count = 3,
): Promise<DynamicScenario[]> {
  const client = new Anthropic()
  const trendList = trends.map((t, i) => `${i + 1}. ${t}`).join('\n')

  const langInstructions = locale === 'it'
    ? `Write ALL text fields in ITALIAN (question, optionA, optionB, seoTitle, seoDescription, keywords). The id must still be URL-safe English lowercase with hyphens (e.g. "lavoro-o-famiglia"). The trend field is the original Italian trend headline.`
    : `Write ALL text fields in ENGLISH. The id must be URL-safe lowercase with hyphens.`

  const prompt = `You are generating viral moral dilemma polls for splitvote.io — a site where people vote on impossible ethical questions in real time.

Today's trending topics and news headlines (${locale.toUpperCase()}):
${trendList}

${langInstructions}

Generate exactly ${count} moral dilemmas INSPIRED by these trends (not directly copied — adapt them into timeless ethical questions).

Rules:
- Each dilemma must be a genuine ethical conflict with no obvious right answer
- Options A and B should represent roughly equal, defensible positions
- Keep language simple and punchy — these are social media content
- Do NOT use real people's names (politicians, celebrities, executives)
- Avoid anything defamatory, sexual, or about self-harm
- Categories must be one of: morality, survival, loyalty, justice, freedom, technology, society, relationships
- IDs must be URL-safe lowercase with hyphens (English slug even for IT content), unique, and NOT match any of these: ${Array.from(EXISTING_IDS).join(', ')}
- seoTitle: compelling headline for Google (50-60 chars)
- seoDescription: 1-2 sentence description for Google snippet (120-160 chars)
- keywords: 5-8 SEO keywords as JSON array (lowercase, comma-separated)

Respond with ONLY a JSON array — no explanation, no markdown:
[
  {
    "id": "unique-slug-in-english",
    "question": "The dilemma question (1-2 sentences, gripping)",
    "optionA": "First choice (concise, starts with verb or noun)",
    "optionB": "Second choice (concise, starts with verb or noun)",
    "emoji": "single relevant emoji",
    "category": "one of the 8 categories above",
    "trend": "the trend/headline that inspired this",
    "seoTitle": "SEO title (50-60 chars)",
    "seoDescription": "Meta description (120-160 chars)",
    "keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"]
  }
]`

  const message = await client.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 2048,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = message.content[0].type === 'text' ? message.content[0].text : ''

  // Extract JSON from the response (handle markdown code blocks)
  const jsonMatch = text.match(/\[[\s\S]*\]/)
  if (!jsonMatch) throw new Error(`No JSON array found in Claude response (${locale})`)

  const parsed: GeneratedDilemmaRaw[] = JSON.parse(jsonMatch[0])

  const now = new Date().toISOString()
  return parsed
    .map((d) => ({
      ...d,
      locale,
      generatedAt: now,
      keywords: Array.isArray(d.keywords) ? d.keywords.slice(0, 8) : [],
    }))
    .filter(isValidDilemma) as DynamicScenario[]
}

// ── Route handler ──────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const secret = request.headers.get('x-cron-secret')
  const expectedSecret = process.env.CRON_SECRET
  if (expectedSecret && secret !== expectedSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Allow ?locale=en|it for targeted regeneration
  const localeParam = request.nextUrl.searchParams.get('locale') as 'en' | 'it' | null
  const dryRun = request.nextUrl.searchParams.get('dry') === '1'

  try {
    const results: Record<string, unknown> = {}

    const localesToRun: Array<'en' | 'it'> = localeParam
      ? [localeParam]
      : ['en', 'it']

    for (const locale of localesToRun) {
      // Fetch trends per locale
      const geo = locale === 'it' ? 'IT' : 'US'
      const subreddit = locale === 'it' ? 'italy' : 'worldnews'

      const [googleTrends, redditNews] = await Promise.all([
        fetchGoogleTrends(geo),
        fetchRedditNews(subreddit),
      ])

      const allTrends = [...googleTrends, ...redditNews].slice(0, 10)

      if (allTrends.length === 0) {
        results[locale] = { ok: false, reason: 'No trends fetched' }
        continue
      }

      // Generate dilemmas for this locale
      const dilemmas = await generateDilemmas(allTrends, locale, 3)

      if (dilemmas.length === 0) {
        results[locale] = { ok: false, reason: 'No valid dilemmas generated', trends: allTrends }
        continue
      }

      if (!dryRun) {
        await saveDynamicScenarios(dilemmas)
      }

      results[locale] = {
        ok: true,
        generated: dilemmas.length,
        dryRun,
        trends: allTrends,
        dilemmas: dilemmas.map((d) => ({
          id: d.id,
          question: d.question,
          trend: d.trend,
          seoTitle: d.seoTitle,
          keywords: d.keywords,
        })),
      }
    }

    return NextResponse.json({ ok: true, locales: localesToRun, results })
  } catch (err) {
    console.error('[cron/generate-dilemmas]', err)
    return NextResponse.json(
      { ok: false, error: String(err) },
      { status: 500 }
    )
  }
}
