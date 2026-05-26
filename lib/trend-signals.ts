/**
 * Normalized trend signal system for SplitVote dilemma generation.
 *
 * Architecture: plug-in sources, each normalized to a TrendSignal[].
 * The cron job calls fetchTrendSignals() to get a weighted, ranked list.
 *
 * Active sources (TREND-SIGNAL-GOOGLE-FIX-01, 26 May 2026):
 *   wikipedia        30%  — top viewed Wikipedia articles per locale (free, stable, official Wikimedia API)
 *   reddit           25%  — r/worldnews (EN) / r/italy (IT) hot posts
 *   rss              20%  — Reuters + NYT (EN) / ANSA + Corriere (IT)
 *   hackernews       10%  — top stories (EN only — tech-ethics signal)
 *   internal_feedback 15% — recent SplitVote feedback weights (per category)
 *
 * Deprecated (left in type for backward compat with existing Redis data):
 *   google_trends    0%   — RSS endpoint discontinued 2026; pull replaced by Wikipedia
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
  | 'wikipedia'
  | 'hackernews'
  | 'google_trends'      // deprecated 26 May 2026 — kept for backward compat with existing Redis drafts
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
  wikipedia:          0.30,
  reddit:             0.25,
  rss:                0.20,
  hackernews:         0.10,
  internal_feedback:  0.15,
  google_trends:      0,    // deprecated 26 May 2026 — Google Trends RSS endpoint discontinued
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

// Wikipedia meta pages and namespaces to skip. These are always at the top
// of the daily pageview ranking and are not topical signals.
const WIKIPEDIA_META_PAGES_EN = new Set([
  'Main_Page', 'Wikipedia', 'Special:Search',
])
const WIKIPEDIA_META_PAGES_IT = new Set([
  'Pagina_principale', 'Speciale:Ricerca', 'Wikipedia',
])

function isWikipediaTopic(article: string, locale: 'en' | 'it'): boolean {
  if (!article) return false
  // Skip namespaced pages (Special:, Wikipedia:, File:, etc.) and the meta set.
  if (article.includes(':')) return false
  const meta = locale === 'it' ? WIKIPEDIA_META_PAGES_IT : WIKIPEDIA_META_PAGES_EN
  if (meta.has(article)) return false
  return true
}

async function fetchWikipediaTrending(locale: 'en' | 'it'): Promise<TrendSignal[]> {
  // Wikipedia exposes daily article pageview totals one day behind real-time,
  // so we ask for "yesterday" by going back 2 days from now in UTC. The API
  // accepts /YYYY/MM/DD as the trailing path segment.
  try {
    const now = new Date()
    const target = new Date(now.getTime() - 2 * 86_400_000)
    const yyyy = target.getUTCFullYear()
    const mm   = String(target.getUTCMonth() + 1).padStart(2, '0')
    const dd   = String(target.getUTCDate()).padStart(2, '0')
    const project = locale === 'it' ? 'it.wikipedia' : 'en.wikipedia'
    const url = `https://wikimedia.org/api/rest_v1/metrics/pageviews/top/${project}/all-access/${yyyy}/${mm}/${dd}`
    const res = await fetch(url, {
      headers: { 'User-Agent': 'splitvote-bot/1.0 (trend-signals; mat.pizzi@gmail.com)' },
      next: { revalidate: 0 },
      signal: AbortSignal.timeout(5000),
    })
    if (!res.ok) return []
    const json = await res.json() as { items?: Array<{ articles?: Array<{ article: string; views: number; rank: number }> }> }
    const articles = json.items?.[0]?.articles ?? []
    const topics = articles.filter(a => isWikipediaTopic(a.article, locale)).slice(0, 10)
    if (topics.length === 0) return []
    const maxViews = topics[0].views || 1
    const isoNow = new Date().toISOString()
    return topics.map((a, i) => ({
      source:    'wikipedia' as TrendSource,
      title:     a.article.replace(/_/g, ' '),
      url:       `https://${project}.org/wiki/${encodeURIComponent(a.article)}`,
      locale,
      // score: views-weighted, top item ~100, drops to ~30 by item 10
      score:     Math.round(30 + (a.views / maxViews) * 70),
      // velocity: rank-weighted (freshness signal is weaker than for news,
      // so velocity decays more gently)
      velocity:  Math.round(80 - i * 5),
      fetchedAt: isoNow,
    }))
  } catch {
    return []
  }
}

async function fetchHackerNews(): Promise<TrendSignal[]> {
  // HackerNews via official Firebase API. EN-only by convention (the audience
  // is global-English). Use as a tech-ethics-flavoured signal that complements
  // Reddit r/worldnews (geopolitics) and Reuters (mainstream news).
  try {
    const idsRes = await fetch('https://hacker-news.firebaseio.com/v0/topstories.json', {
      next: { revalidate: 0 },
      signal: AbortSignal.timeout(4000),
    })
    if (!idsRes.ok) return []
    const ids = await idsRes.json() as number[]
    const topIds = ids.slice(0, 12)

    const stories = await Promise.all(topIds.map(async id => {
      try {
        const r = await fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`, {
          next: { revalidate: 0 },
          signal: AbortSignal.timeout(3000),
        })
        if (!r.ok) return null
        return await r.json() as { title?: string; url?: string; score?: number; type?: string } | null
      } catch {
        return null
      }
    }))

    const valid = stories.filter(
      (s): s is { title: string; url?: string; score: number; type?: string } =>
        s !== null && typeof s.title === 'string' && s.title.length > 15 && s.type !== 'job'
    ).slice(0, 8)

    if (valid.length === 0) return []
    const maxScore = valid[0].score || 1
    const isoNow = new Date().toISOString()
    return valid.map((s, i) => ({
      source:    'hackernews' as TrendSource,
      title:     s.title,
      url:       s.url,
      locale:    'en' as const,
      score:     Math.round((s.score / maxScore) * 100),
      velocity:  Math.round(75 - i * 7),
      fetchedAt: isoNow,
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
  const subreddit = locale === 'it' ? 'italy' : 'worldnews'

  // HackerNews is EN-only by audience convention; skip it for IT.
  const [wiki, reddit, rss, hn] = await Promise.all([
    fetchWikipediaTrending(locale),
    fetchReddit(subreddit, locale),
    fetchRSS(locale),
    locale === 'en' ? fetchHackerNews() : Promise.resolve([] as TrendSignal[]),
  ])

  const weights = getWeights()

  // Combine and compute a weighted finalScore for each signal.
  // Each per-source score is scaled by (weight / baseWeight) so that the
  // weighted ranking respects the BASE_WEIGHTS table even when sources are
  // toggled on/off via env (the renormalized weights would otherwise
  // collapse to source presence rather than relative importance).
  const all: TrendSignal[] = [
    ...wiki.map(s   => ({ ...s, score: Math.round(s.score * weights.wikipedia  * 100 / 30) })),
    ...reddit.map(s => ({ ...s, score: Math.round(s.score * weights.reddit     * 100 / 25) })),
    ...rss.map(s    => ({ ...s, score: Math.round(s.score * weights.rss        * 100 / 20) })),
    ...hn.map(s     => ({ ...s, score: Math.round(s.score * weights.hackernews * 100 / 10) })),
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
