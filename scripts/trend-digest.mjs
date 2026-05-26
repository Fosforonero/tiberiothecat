#!/usr/bin/env node
/**
 * trend-digest.mjs — weekly read-only digest of current world trends for
 * SplitVote landing-page / new-article PM review.
 *
 * Pulls the same Google Trends RSS + Reddit signals the daily cron uses,
 * scores them for "moral-dilemma fit", and emits a markdown digest the PM
 * can scan in 2-3 minutes to pick 1-2 trends worthy of a dedicated landing
 * page or blog article that week.
 *
 * AI-TREND-DRAFTS-SCALE-01 (sprint-1 companion) — does NOT auto-generate
 * landing pages. Trend signal in, PM judgment out.
 *
 * SAFE_AUTONOMOUS — read-only. No Redis writes, no AI calls, no admin actions.
 *
 * Run: node scripts/trend-digest.mjs
 * Output: reports/trend-digest-<YYYY-MM-DD>.md
 */

import fs   from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT      = path.resolve(__dirname, '..')

// ── Trend fetchers (mirror lib/trend-signals.ts) ──────────────

async function fetchGoogleTrends(geo, locale) {
  try {
    const r = await fetch(
      `https://trends.google.com/trends/trendingsearches/daily/rss?geo=${geo}`,
      { cache: 'no-store' },
    )
    if (!r.ok) return []
    const xml = await r.text()
    const matches = Array.from(xml.matchAll(/<item>[\s\S]*?<title><!\[CDATA\[(.*?)\]\]><\/title>/g))
    return matches.slice(0, 15).map((m, i) => ({
      source:   'google_trends',
      title:    m[1].trim(),
      locale,
      score:    Math.round(100 - i * 6),
      velocity: Math.round(90 - i * 5),
    }))
  } catch {
    return []
  }
}

async function fetchReddit(subreddit, locale) {
  try {
    const r = await fetch(
      `https://www.reddit.com/r/${subreddit}/hot.json?limit=15`,
      {
        headers: { 'User-Agent': 'splitvote-bot/1.0 (trend-digest)' },
        cache: 'no-store',
      },
    )
    if (!r.ok) return []
    const j = await r.json()
    const posts = j?.data?.children ?? []
    return posts.slice(0, 15).map((p, i) => ({
      source:   'reddit',
      title:    p.data?.title ?? '',
      url:      p.data?.url ?? '',
      locale,
      score:    Math.round(100 - i * 6),
      velocity: Math.round(80 - i * 5),
    }))
  } catch {
    return []
  }
}

// ── Moral-dilemma fit heuristic ───────────────────────────────
// Surface-level: looks for ethical/social/relational/policy keywords
// in the trend title. NOT a semantic classifier — meant to filter the
// obvious noise (sports scores, celebrity gossip, product launches) so
// PM eyes go on the interesting ones first.

const MORAL_FIT_KEYWORDS = [
  // EN
  'ethic', 'moral', 'right', 'wrong', 'fair', 'unfair', 'justice', 'injustice',
  'privacy', 'censor', 'free speech', 'abortion', 'euthanasia', 'death',
  'guilty', 'innocent', 'verdict', 'prison', 'sentence',
  'cheat', 'lie', 'truth', 'secret', 'betray', 'loyal',
  'ai', 'algorithm', 'automation', 'gene', 'editing', 'climate', 'inequality',
  'family', 'parent', 'child', 'relationship', 'friend', 'work',
  'tax', 'wealth', 'poverty', 'immigration', 'refugee',
  'gun', 'violence', 'protest', 'strike',
  // IT
  'etica', 'morale', 'giusto', 'sbagliato', 'verità', 'menzogna',
  'giustizia', 'ingiustizia', 'privacy', 'libertà', 'censura',
  'famiglia', 'figli', 'genitor', 'amico', 'lavoro', 'tradimento',
  'tasse', 'ricchezza', 'povertà', 'immigrazione',
]

const NOISE_KEYWORDS = [
  // Sports
  'vs', 'match', 'final', 'season', 'champion', 'goal', 'tournament',
  'partita', 'finale', 'stagione',
  // Entertainment
  'episode', 'season', 'movie', 'film', 'trailer', 'release date',
  'album', 'tour', 'concert',
  'episodio', 'trailer',
  // Products
  'iphone', 'galaxy', 'launch', 'sale', 'deal', 'price',
  'sconto', 'prezzo', 'offerta',
  // Weather / sci
  'eclipse', 'aurora', 'forecast', 'meteo',
]

function fitScore(title) {
  const t = title.toLowerCase()
  let score = 0
  for (const k of MORAL_FIT_KEYWORDS) if (t.includes(k)) score += 10
  for (const k of NOISE_KEYWORDS)     if (t.includes(k)) score -= 8
  return Math.max(0, Math.min(100, 50 + score))
}

function classifyFit(s) {
  if (s >= 70) return 'high'
  if (s >= 45) return 'maybe'
  return 'low'
}

// ── Markdown report ──────────────────────────────────────────

function escapeMd(s) {
  return (s ?? '').toString().replace(/\|/g, '\\|').replace(/\r?\n/g, ' ').slice(0, 200)
}

function isoDate(d = new Date()) {
  return d.toISOString().slice(0, 10)
}

function renderLocaleSection(locale, label, signals) {
  const lines = []
  lines.push(`### ${label}`)
  lines.push('')
  if (signals.length === 0) {
    lines.push('_No signals fetched (source unavailable or rate-limited)._')
    lines.push('')
    return lines.join('\n')
  }
  lines.push('| # | Source | Score | Fit | Trend |')
  lines.push('|---:|---|---:|---|---|')
  signals.forEach((s, i) => {
    const fit = classifyFit(s.fitScore)
    const fitEmoji = fit === 'high' ? '🟢 high' : fit === 'maybe' ? '🟡 maybe' : '⚪ low'
    lines.push(`| ${i + 1} | ${s.source} | ${s.score} | ${fitEmoji} | ${escapeMd(s.title)} |`)
  })
  lines.push('')

  const candidates = signals
    .filter(s => classifyFit(s.fitScore) === 'high' && s.score >= 60)
    .slice(0, 5)
  if (candidates.length > 0) {
    lines.push(`**Landing-page candidates (${label}):**`)
    lines.push('')
    for (const c of candidates) {
      lines.push(`- **${escapeMd(c.title)}** _(${c.source}, score=${c.score})_`)
    }
    lines.push('')
  }
  return lines.join('\n')
}

async function main() {
  const [gtEn, gtIt, rdMain, rdIt] = await Promise.all([
    fetchGoogleTrends('US', 'en'),
    fetchGoogleTrends('IT', 'it'),
    fetchReddit('popular', 'en'),
    fetchReddit('italy', 'it'),
  ])

  const annotate = arr => arr.map(s => ({ ...s, fitScore: fitScore(s.title) }))

  const en = [...annotate(gtEn), ...annotate(rdMain)].sort((a, b) => b.score - a.score)
  const it = [...annotate(gtIt), ...annotate(rdIt)].sort((a, b) => b.score - a.score)

  const date = isoDate()
  const out = path.join(ROOT, 'reports', `trend-digest-${date}.md`)

  const lines = []
  lines.push(`# Trend digest — ${date}`)
  lines.push('')
  lines.push('Read-only weekly digest of world trends for SplitVote landing-page / new-article PM review.')
  lines.push('')
  lines.push('Pulls the same Google Trends RSS + Reddit signals the daily dilemma-generation cron uses, ')
  lines.push('then scores each title for moral-dilemma fit (keyword heuristic — not semantic). High-fit, ')
  lines.push('high-score trends are surfaced as landing-page candidates.')
  lines.push('')
  lines.push('**This is a PM-judgment tool. Landing pages and full articles are NEVER auto-generated.**')
  lines.push('')
  lines.push('## How to read it')
  lines.push('')
  lines.push('- **Fit 🟢 high**: the title contains ethical / social / relational keywords — likely a real moral-dilemma angle.')
  lines.push('- **Fit 🟡 maybe**: ambiguous — read the title and decide.')
  lines.push('- **Fit ⚪ low**: sports / entertainment / products — skip unless you spot a hidden angle.')
  lines.push('- **Landing-page candidates** = fit 🟢 high AND score ≥ 60. These are the rows worth a 5-second look.')
  lines.push('')
  lines.push('## EN trends')
  lines.push('')
  lines.push(renderLocaleSection('en', 'Google Trends US + Reddit r/popular', en))
  lines.push('## IT trends')
  lines.push('')
  lines.push(renderLocaleSection('it', 'Google Trends IT + Reddit r/italy', it))

  fs.writeFileSync(out, lines.join('\n'))

  const candidatesEn = en.filter(s => classifyFit(s.fitScore) === 'high' && s.score >= 60).length
  const candidatesIt = it.filter(s => classifyFit(s.fitScore) === 'high' && s.score >= 60).length

  console.log(`[trend-digest] en=${en.length} signals, ${candidatesEn} landing candidate(s)`)
  console.log(`[trend-digest] it=${it.length} signals, ${candidatesIt} landing candidate(s)`)
  console.log(`[trend-digest] report written: ${path.relative(ROOT, out)}`)
}

main().catch(e => { console.error(e); process.exit(1) })
