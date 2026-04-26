/**
 * Normalized trend signal system for SplitVote dilemma generation.
 *
 * Architecture: plug-in sources, each normalized to a TrendSignal[].
 * The cron job calls fetchTrendSignals() to get a weighted, ranked list.
 *
 * Current sources:
 *   google_trends   35%  — always enabled
 *   reddit          25%  — always enabled
 *   rss             20%  — always enabled (GDELT/Reuters)
 *   internal_feedback 20% — uses recent feedback data from Redis
 *
 * Future social sources (disabled until official API access):
 *   x               0%   — ENABLE_X_TRENDS=true
 *   instagram       0%   — ENABLE_INSTAGRAM_TRENDS=true
 *   tiktok          0%   — ENABLE_TIKTOK_TRENDS=true
 *
 * Budget cap:
 *   TREND_DAILY_BUDGET_CENTS (default 0) — reserved for paid APIs
 */

export type TrendSource =
  | 'google_trends'
  | 'reddit'
  | 'rss'
  | 'internal_feedback'
  | 'x'
  | 'instagram'
  | 'tiktok'

export interface TrendSignal {
  source:    TrendSource
  title:     string
  url?:      string
  locale:    'en' | 'it'
  score:     number  // 0-100, normalized within source
  velocity:  number  // 0-100, freshness/rate-of-rise
  fetchedAt: string  // ISO timestamp
}

// ── Source weights ──────────────────────────────────────────

const BASE_WEIGHTS: Record<TrendSource, number> = {
  google_trends:      0.35,
  reddit:             0.25,
  rss:                0.20,
  internal_feedback:  0.20,
  x:                  0,
  instagram:          0,
  tiktok:             0,
}

function getWeights(): Record<TrendSource, number> {
  const w = { ...BASE_WEIGHTS }
  if (process.env.ENABLE_X_TRENDS === 'true')         w.x = 0.10
  if (process.env.ENABLE_INSTAGRAM_TRENDS === 'true') w.instagram = 0.10
  if (process.env.ENABLE_TIKTOK_TRENDS === 'true')    w.tiktok = 0.10
  // Renormalize so weights sum to 1
  const total = Object.values(w).reduce((a, b) => a + b, 0)
  if (total === 0) return w
  return Object.fromEntries(
    Object.entries(w).map(([k, v]) => [k, v / total])
  ) as Record<TrendSource, number>
}

// ── Individual source fetchers ──────────────────────────────

async function fetchGoogleTrends(geo: string, locale: 'en' | 'it'): Promise<TrendSignal[]> {
  try {
    const res = await fetch(
      `https://trends.google.com/trends/trendingsearches/daily/rss?geo=${geo}`,
      { next: { revalidate: 0 } }
    )
    const xml = await res.text()
    const matches = Array.from(xml.matchAll(/<item>[\s\S]*?<title><!\[CDATA\[(.*?)\]\]><\/title>/g))
    const now = new Date().toISOString()
    return matches.slice(0, 10).map((m, i) => ({
      source:    'google_trends' as TrendSource,
      title:     m[1].trim(),
      locale,
      score:     Math.round(100 - i * 9),   // #1 = 100, #10 = 19
      velocity:  Math.round(90 - i * 8),
      fetchedAt: now,
    }))
  } catch {
    return []
  }
}

async function fetchReddit(subreddit: string, locale: 'en' | 'it'): Promise<TrendSignal[]> {
  try {
    const res = await fetch(
      `https://www.reddit.com/r/${subreddit}/hot.json?limit=10`,
      {
        headers: { 'User-Agent': 'splitvote-bot/1.0' },
        next: { revalidate: 0 },
      }
    )
    const json = await res.json()
    const posts = (json?.data?.children ?? []) as Array<{ data: { title: string; url: string; score: number } }>
    const maxScore = posts[0]?.data?.score || 1
    const now = new Date().toISOString()
    return posts
      .filter(p => p.data.title.length > 20)
      .slice(0, 8)
      .map((p, i) => ({
        source:    'reddit' as TrendSource,
        title:     p.data.title,
        url:       `https://reddit.com${p.data.url}`.slice(0, 200),
        locale,
        score:     Math.round((p.data.score / maxScore) * 100),
        velocity:  Math.round(80 - i * 9),
        fetchedAt: now,
      }))
  } catch {
    return []
  }
}

async function fetchRSS(locale: 'en' | 'it'): Promise<TrendSignal[]> {
  // Free RSS feeds — no API key needed
  const feeds = locale === 'it'
    ? [
        'https://www.ansa.it/sito/ansait_rss.xml',
        'https://www.corriere.it/rss/homepage.xml',
      ]
    : [
        'https://feeds.reuters.com/reuters/topNews',
        'https://rss.nytimes.com/services/xml/rss/nyt/World.xml',
      ]

  const now = new Date().toISOString()
  const results: TrendSignal[] = []

  for (const url of feeds) {
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': 'splitvote-bot/1.0' },
        next: { revalidate: 0 },
        signal: AbortSignal.timeout(4000),
      })
      const xml = await res.text()
      // Parse <title> inside <item> tags
      const itemRe = /<item[\s\S]*?<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/g
      const matches = Array.from(xml.matchAll(itemRe))
      matches.slice(0, 5).forEach((m, i) => {
        const title = m[1].trim().replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
        if (title.length < 10 || title.toLowerCase().includes('rss') || title.toLowerCase().includes('feed')) return
        results.push({
          source:    'rss' as TrendSource,
          title,
          url,
          locale,
          score:     Math.round(70 - i * 10),
          velocity:  50,
          fetchedAt: now,
        })
      })
    } catch { /* non-blocking */ }
  }

  return results
}

// ── Combined fetcher ────────────────────────────────────────

export async function fetchTrendSignals(locale: 'en' | 'it'): Promise<TrendSignal[]> {
  const geo       = locale === 'it' ? 'IT' : 'US'
  const subreddit = locale === 'it' ? 'italy' : 'worldnews'

  const [google, reddit, rss] = await Promise.all([
    fetchGoogleTrends(geo, locale),
    fetchReddit(subreddit, locale),
    fetchRSS(locale),
  ])

  const weights = getWeights()

  // Combine and compute a weighted finalScore for each signal
  const all: TrendSignal[] = [
    ...google.map(s => ({ ...s, score: Math.round(s.score * weights.google_trends * 100 / 35) })),
    ...reddit.map(s => ({ ...s, score: Math.round(s.score * weights.reddit * 100 / 25) })),
    ...rss.map(s => ({ ...s, score: Math.round(s.score * weights.rss * 100 / 20) })),
  ]

  // Deduplicate by normalised title similarity (first occurrence wins)
  const seen = new Set<string>()
  const deduped: TrendSignal[] = []
  for (const sig of all) {
    const key = sig.title.toLowerCase().slice(0, 40).replace(/\W/g, '')
    if (!seen.has(key)) {
      seen.add(key)
      deduped.push(sig)
    }
  }

  // Sort by score desc, return top 12
  return deduped.sort((a, b) => b.score - a.score).slice(0, 12)
}

// ── Score helper for draft ranking ──────────────────────────

/**
 * Compute seoScore 0-100 from a generated dilemma's SEO fields.
 */
export function computeSeoScore(
  seoTitle?: string,
  seoDescription?: string,
  keywords?: string[],
): number {
  let score = 0
  if (seoTitle && seoTitle.length >= 30 && seoTitle.length <= 65) score += 40
  else if (seoTitle && seoTitle.length > 0) score += 20
  if (seoDescription && seoDescription.length >= 80 && seoDescription.length <= 165) score += 40
  else if (seoDescription && seoDescription.length > 0) score += 20
  if (keywords && keywords.length >= 4) score += 20
  else if (keywords && keywords.length > 0) score += 10
  return score
}

/**
 * Compute noveltyScore 0-100: how different is this dilemma from the most recent 60?
 * High score = very novel.
 */
export function computeNoveltyScore(
  question: string,
  existingQuestions: string[],
): number {
  if (existingQuestions.length === 0) return 100
  const tokenize = (t: string) =>
    new Set(t.toLowerCase().split(/\W+/).filter(w => w.length > 3))
  const qTokens = tokenize(question)
  const maxSim = Math.max(
    ...existingQuestions.map(eq => {
      const eTokens = tokenize(eq)
      const intersection = [...qTokens].filter(x => eTokens.has(x)).length
      const union = new Set([...qTokens, ...eTokens]).size
      return union === 0 ? 0 : intersection / union
    })
  )
  return Math.round((1 - maxSim) * 100)
}

/**
 * Compute viralScore 0-100 from the trend signal that inspired the dilemma.
 */
export function computeViralScore(
  trendSignal?: TrendSignal | null,
): number {
  if (!trendSignal) return 40
  return Math.round(trendSignal.score * 0.7 + trendSignal.velocity * 0.3)
}
