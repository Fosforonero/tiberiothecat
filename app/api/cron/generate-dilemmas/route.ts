/**
 * Vercel Cron endpoint — runs daily at 06:00 UTC.
 * 1. Fetches trending topics from Google Trends RSS + Reddit /r/worldnews
 * 2. Sends them to Claude API
 * 3. Parses the generated dilemmas
 * 4. Stores them in Upstash Redis via saveDynamicScenarios()
 *
 * Protect with CRON_SECRET env var (set same value in vercel.json cron headers).
 */

import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { saveDynamicScenarios } from '@/lib/dynamic-scenarios'
import type { DynamicScenario } from '@/lib/dynamic-scenarios'
import type { Category } from '@/lib/scenarios'

const client = new Anthropic()

// ── Fetch trending topics ──────────────────────────────────────

async function fetchGoogleTrends(): Promise<string[]> {
  try {
    const res = await fetch(
      'https://trends.google.com/trends/trendingsearches/daily/rss?geo=US',
      { next: { revalidate: 0 } }
    )
    const xml = await res.text()
    // Extract <title> values (skip the first which is the feed title)
    const matches = [...xml.matchAll(/<item>[\s\S]*?<title><!\[CDATA\[(.*?)\]\]><\/title>/g)]
    return matches.slice(0, 8).map((m) => m[1].trim())
  } catch {
    return []
  }
}

async function fetchRedditNews(): Promise<string[]> {
  try {
    const res = await fetch(
      'https://www.reddit.com/r/worldnews/hot.json?limit=8',
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

// ── Generate dilemmas via Claude ───────────────────────────────

async function generateDilemmas(trends: string[]): Promise<DynamicScenario[]> {
  const today = new Date().toISOString().split('T')[0]
  const trendList = trends.map((t, i) => `${i + 1}. ${t}`).join('\n')

  const prompt = `You are generating viral moral dilemma polls for splitvote.io — a site where people vote on impossible ethical questions in real time.

Today's trending topics and news headlines:
${trendList}

Generate exactly 3 moral dilemmas INSPIRED by these trends (not directly copied — adapt them into timeless ethical questions).

Rules:
- Each dilemma must be a genuine ethical conflict with no obvious right answer
- Options A and B should represent roughly equal, defensible positions
- Keep language simple and punchy — these are social media content
- Do NOT use real people's names
- Categories must be one of: morality, survival, loyalty, justice, freedom, technology, society, relationships
- IDs must be URL-safe lowercase with hyphens, unique, and NOT match any of these existing IDs:
  trolley, lifeboat, truth-friend, cure-secret, time-machine, privacy-terror, rich-or-fair, memory-erase, steal-medicine, robot-judge, organ-harvest, mercy-kill, whistleblower, confess-crime, plane-parachute, zombie-apocalypse, pandemic-dose, report-friend, cover-accident, sibling-secret, innocent-juror, death-row-exonerated, revenge-vs-forgiveness, censor-speech, mandatory-vaccine, surveillance-city, ai-art-copyright, self-driving-crash, brain-upload, delete-social-media, ai-replaces-jobs, deepfake-expose, tax-billionaires, open-borders, universal-basic-income, drug-legalization, prison-abolition, love-or-career, old-secret-affair, forgive-cheater, save-partner-vs-stranger

Respond with ONLY a JSON array — no explanation, no markdown:
[
  {
    "id": "unique-slug",
    "question": "The dilemma question (1-2 sentences, gripping)",
    "optionA": "First choice (concise, starts with verb or noun)",
    "optionB": "Second choice (concise, starts with verb or noun)",
    "emoji": "single relevant emoji",
    "category": "one of the 8 categories above",
    "trend": "the trend/headline that inspired this"
  }
]`

  const message = await client.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = message.content[0].type === 'text' ? message.content[0].text : ''

  // Extract JSON from the response
  const jsonMatch = text.match(/\[[\s\S]*\]/)
  if (!jsonMatch) throw new Error('No JSON array found in response')

  const parsed: Array<{
    id: string
    question: string
    optionA: string
    optionB: string
    emoji: string
    category: Category
    trend: string
  }> = JSON.parse(jsonMatch[0])

  const now = new Date().toISOString()
  return parsed
    .filter((d) => d.id && d.question && d.optionA && d.optionB && d.emoji && d.category)
    .map((d) => ({
      ...d,
      generatedAt: now,
    }))
}

// ── Route handler ──────────────────────────────────────────────

export async function GET(request: NextRequest) {
  // Verify the cron secret to prevent unauthorized runs
  const secret = request.headers.get('x-cron-secret')
  const expectedSecret = process.env.CRON_SECRET
  if (expectedSecret && secret !== expectedSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // 1. Fetch trends
    const [googleTrends, redditNews] = await Promise.all([
      fetchGoogleTrends(),
      fetchRedditNews(),
    ])

    const allTrends = [...googleTrends, ...redditNews].slice(0, 10)

    if (allTrends.length === 0) {
      return NextResponse.json({ ok: false, reason: 'No trends fetched' })
    }

    // 2. Generate dilemmas
    const dilemmas = await generateDilemmas(allTrends)

    if (dilemmas.length === 0) {
      return NextResponse.json({ ok: false, reason: 'No dilemmas generated' })
    }

    // 3. Save to Redis
    await saveDynamicScenarios(dilemmas)

    return NextResponse.json({
      ok: true,
      generated: dilemmas.length,
      trends: allTrends,
      dilemmas: dilemmas.map((d) => ({ id: d.id, question: d.question, trend: d.trend })),
    })
  } catch (err) {
    console.error('[cron/generate-dilemmas]', err)
    return NextResponse.json(
      { ok: false, error: String(err) },
      { status: 500 }
    )
  }
}
