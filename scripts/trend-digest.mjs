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

const WIKIPEDIA_META_EN = new Set(['Main_Page', 'Wikipedia', 'Special:Search'])
const WIKIPEDIA_META_IT = new Set(['Pagina_principale', 'Speciale:Ricerca', 'Wikipedia'])

function isWikipediaTopic(article, locale) {
  if (!article || article.includes(':')) return false
  const meta = locale === 'it' ? WIKIPEDIA_META_IT : WIKIPEDIA_META_EN
  return !meta.has(article)
}

async function fetchWikipediaTrending(locale) {
  try {
    const t = new Date(Date.now() - 2 * 86_400_000)
    const yyyy = t.getUTCFullYear()
    const mm = String(t.getUTCMonth() + 1).padStart(2, '0')
    const dd = String(t.getUTCDate()).padStart(2, '0')
    const project = locale === 'it' ? 'it.wikipedia' : 'en.wikipedia'
    const r = await fetch(
      `https://wikimedia.org/api/rest_v1/metrics/pageviews/top/${project}/all-access/${yyyy}/${mm}/${dd}`,
      {
        headers: { 'User-Agent': 'splitvote-bot/1.0 (trend-digest)' },
        cache: 'no-store',
      },
    )
    if (!r.ok) return []
    const j = await r.json()
    const articles = j?.items?.[0]?.articles ?? []
    const topics = articles.filter(a => isWikipediaTopic(a.article, locale)).slice(0, 12)
    if (topics.length === 0) return []
    const maxViews = topics[0].views || 1
    return topics.map((a, i) => ({
      source:   'wikipedia',
      title:    a.article.replace(/_/g, ' '),
      url:      `https://${project}.org/wiki/${encodeURIComponent(a.article)}`,
      locale,
      score:    Math.round(30 + (a.views / maxViews) * 70),
      velocity: Math.round(80 - i * 5),
    }))
  } catch {
    return []
  }
}

async function fetchHackerNews() {
  try {
    const idsRes = await fetch('https://hacker-news.firebaseio.com/v0/topstories.json', { cache: 'no-store' })
    if (!idsRes.ok) return []
    const ids = await idsRes.json()
    const topIds = ids.slice(0, 12)
    const stories = await Promise.all(topIds.map(async id => {
      try {
        const r = await fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`, { cache: 'no-store' })
        if (!r.ok) return null
        return await r.json()
      } catch {
        return null
      }
    }))
    const valid = stories.filter(s => s && typeof s.title === 'string' && s.title.length > 15 && s.type !== 'job').slice(0, 10)
    if (valid.length === 0) return []
    const maxScore = valid[0].score || 1
    return valid.map((s, i) => ({
      source:   'hackernews',
      title:    s.title,
      url:      s.url,
      locale:   'en',
      score:    Math.round((s.score / maxScore) * 100),
      velocity: Math.round(75 - i * 7),
    }))
  } catch {
    return []
  }
}

// ── 9GAG meme/culture signal (read-only) ───────────────────────
// Treated as meme/culture only. NOT a factual news source. Items are
// classified `safe` / `review` / `block`. Suggests possible SplitVote
// dilemma angles, never creates drafts. If 9GAG blocks or changes HTML,
// fail soft and keep the rest of the digest working.

const NINEGAG_BLOCK_TOKENS = [
  // NSFW / explicit content markers
  'nsfw', 'nude', 'naked', 'porn', 'sex tape', 'onlyfans', 'xxx',
  'anal', 'penis', 'vagina', 'boobs',
  // Graphic violence / shock
  'gore', 'beheading', 'execution', 'mutilat', 'corpse', 'dismember',
  // Hate signals (broad markers; final call still belongs to editor)
  'nazi', 'kkk', 'hitler joke',
]

const NINEGAG_REVIEW_TOKENS = [
  // Political / news-like (needs factual verification before public use)
  'politic', 'election', 'president', 'minister', 'congress', 'parliament',
  'war', 'invasion', 'occupation', 'genocide', 'ceasefire', 'sanction',
  'protest', 'riot', 'shooting', 'terror', 'attack',
  // Health / public-policy claims
  'covid', 'vaccine', 'climate', 'pandemic',
  // Religion (frequent source of moral-dilemma misfires)
  'islam', 'christian', 'jewish', 'religion', 'church', 'mosque', 'allah',
  // Identity / dark humor
  'suicide', 'self harm', 'gender', 'trans', 'lgbt',
  // Immigration / border
  'immigration', 'refugee', 'migrant', 'border',
]

const ANGLE_TEMPLATES = [
  { match: ['relationship', 'partner', 'girlfriend', 'boyfriend', 'dating', 'wife', 'husband', 'marriage'],
    angle: 'Possible angle: a small-betrayal-vs-honesty dilemma in a relationship.' },
  { match: ['work', 'boss', 'job', 'office', 'colleague', 'coworker', 'manager'],
    angle: 'Possible angle: loyalty to a colleague vs. honesty with the boss.' },
  { match: ['parent', 'mom', 'dad', 'mother', 'father', 'kid', 'child', 'teen'],
    angle: 'Possible angle: parent privacy vs. teen autonomy.' },
  { match: ['friend', 'friendship', 'best friend'],
    angle: 'Possible angle: telling a friend an uncomfortable truth vs. protecting their feelings.' },
  { match: ['ai', 'algorithm', 'chatgpt', 'gpt', 'robot', 'machine learning'],
    angle: 'Possible angle: should an AI make a decision a human is biased about?' },
  { match: ['dog', 'cat', 'pet', 'animal', 'shelter'],
    angle: 'Possible angle: saving your pet vs. minor harm to a stranger.' },
  { match: ['social media', 'instagram', 'tiktok', 'facebook', 'twitter', 'reddit', 'viral post', 'goes viral'],
    angle: 'Possible angle: viral content vs. dignity of the people in it.' },
  { match: ['money', 'rich', 'poor', 'broke', 'salary', 'tax', 'inheritance'],
    angle: 'Possible angle: a financial choice with a moral cost.' },
  { match: ['gym', 'fitness', 'diet', 'food', 'cheat day'],
    angle: 'Possible angle: lifestyle vs. honesty about discipline.' },
  { match: ['gaming', 'gamer', 'video game', 'speedrun', 'cheat code'],
    angle: 'Possible angle: cheating in a game vs. winning fairly.' },
  { match: ['school', 'student', 'teacher', 'exam', 'homework'],
    angle: 'Possible angle: helping a friend cheat vs. fair competition.' },
]

function classify9GagItem(it) {
  const haystack = [
    String(it.title  || '').toLowerCase(),
    String(it.section || '').toLowerCase(),
    ...(Array.isArray(it.tags) ? it.tags.map(t => String(t).toLowerCase()) : []),
  ].join(' | ')

  for (const tok of NINEGAG_BLOCK_TOKENS)  if (haystack.includes(tok)) return 'block'
  for (const tok of NINEGAG_REVIEW_TOKENS) if (haystack.includes(tok)) return 'review'
  return 'safe'
}

function suggestDilemmaAngle(it) {
  const haystack = [
    String(it.title || ''),
    Array.isArray(it.tags) ? it.tags.join(' ') : '',
    String(it.section || ''),
  ].join(' ').toLowerCase()
  for (const tpl of ANGLE_TEMPLATES) {
    if (tpl.match.some(k => haystack.includes(k))) return tpl.angle
  }
  return 'Brainstorm a moral-dilemma angle from the meme theme above.'
}

function parseNineGagHtml(html) {
  const items = []

  // Strategy 1: JSON-LD ItemList blocks (most stable across redesigns).
  try {
    const ldRe = /<script[^>]+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi
    for (const m of html.matchAll(ldRe)) {
      try {
        const data = JSON.parse(m[1])
        const entities = Array.isArray(data) ? data : [data]
        for (const e of entities) {
          if (e?.['@type'] === 'ItemList' && Array.isArray(e.itemListElement)) {
            for (const li of e.itemListElement.slice(0, 30)) {
              const post = li?.item || li
              const title = post?.name || post?.headline
              const urlOut = post?.url
              if (typeof title === 'string' && title.length > 3) {
                items.push({
                  title:   title.slice(0, 140),
                  url:     typeof urlOut === 'string' ? urlOut : '',
                  tags:    Array.isArray(post?.keywords) ? post.keywords.slice(0, 5) : [],
                  section: '',
                })
              }
            }
          }
        }
      } catch { /* one block parse fail is fine */ }
    }
  } catch { /* JSON-LD strategy failed entirely */ }

  // Strategy 2: data-entry-* attributes (heuristic fallback if JSON-LD absent).
  if (items.length === 0) {
    try {
      const entryRe = /data-entry-url="([^"]+)"[^>]*data-entry-title="([^"]+)"/g
      for (const m of html.matchAll(entryRe)) {
        items.push({
          title:   m[2].slice(0, 140),
          url:     m[1],
          tags:    [],
          section: '',
        })
        if (items.length >= 20) break
      }
    } catch { /* skip */ }
  }

  // De-dup by URL or title, cap at 12.
  const seen = new Set()
  const dedup = []
  for (const it of items) {
    const key = it.url || it.title
    if (seen.has(key)) continue
    seen.add(key)
    dedup.push(it)
    if (dedup.length >= 12) break
  }
  return dedup.map((it, i) => ({
    source:   '9gag',
    title:    it.title,
    url:      it.url,
    locale:   'en',
    score:    Math.round(70 - i * 4),
    velocity: 0,
    tags:     it.tags,
    section:  it.section,
  }))
}

async function fetchNineGagTrending() {
  const url = 'https://9gag.com/trending'
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 6000)
    const r = await fetch(url, {
      headers: {
        'User-Agent':      'Mozilla/5.0 (compatible; splitvote-bot/1.0; +https://splitvote.io)',
        'Accept':          'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      cache:  'no-store',
      signal: controller.signal,
    })
    clearTimeout(timer)
    if (!r.ok) {
      console.log(`[9gag] HTTP ${r.status} — source unavailable, skipping`)
      return []
    }
    const html = await r.text()
    const items = parseNineGagHtml(html)
    if (items.length === 0) {
      console.log('[9gag] HTML did not match known structure — failing soft')
    }
    return items
  } catch (e) {
    console.log(`[9gag] fetch failed (${e?.message || 'unknown'}) — failing soft`)
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

function renderNineGagSection(items) {
  const lines = []
  lines.push('## 9GAG Meme Radar')
  lines.push('')
  lines.push('Read-only meme/culture signal — **NOT a factual news source**. Each item is classified `safe` / `review` / `block`. The radar suggests possible SplitVote dilemma angles but never creates drafts. Verify any news-like claim against a primary source before using it publicly.')
  lines.push('')

  if (items.length === 0) {
    lines.push('_9GAG source unavailable or returned no parseable posts. Failing soft — rest of the digest is unaffected._')
    lines.push('')
    return lines.join('\n')
  }

  const classified = items.map(it => ({ ...it, status: classify9GagItem(it) }))
  const safe   = classified.filter(c => c.status === 'safe')
  const review = classified.filter(c => c.status === 'review')
  const block  = classified.filter(c => c.status === 'block')

  lines.push(`Found ${items.length} hot meme(s): **${safe.length} safe**, **${review.length} review**, **${block.length} block**.`)
  lines.push('')
  lines.push('| # | Status | Title (truncated) | Possible dilemma angle |')
  lines.push('|---:|---|---|---|')
  classified.forEach((it, i) => {
    const emoji = it.status === 'safe' ? '🟢 safe' : it.status === 'review' ? '🟡 review' : '🔴 block'
    const angle = it.status === 'block' ? '_excluded_' : escapeMd(suggestDilemmaAngle(it))
    lines.push(`| ${i + 1} | ${emoji} | ${escapeMd(it.title)} | ${angle} |`)
  })
  lines.push('')

  if (block.length > 0) {
    lines.push(`_${block.length} item(s) classified \`block\` and excluded from angle suggestions (NSFW / graphic / hate-speech tokens detected)._`)
    lines.push('')
  }
  if (review.length > 0) {
    lines.push(`_${review.length} item(s) classified \`review\` — political, religious, or news-like signal. Editor must verify factual claims against a primary source before any public use._`)
    lines.push('')
  }
  lines.push('**Anti-reuse reminder:** Do not reuse 9GAG images, captions, or user posts verbatim in SplitVote dilemmas. These titles are research signal only — paraphrase the underlying theme.')
  lines.push('')
  return lines.join('\n')
}

async function main() {
  const [wikiEn, wikiIt, rdMain, rdIt, hn, nineGag] = await Promise.all([
    fetchWikipediaTrending('en'),
    fetchWikipediaTrending('it'),
    fetchReddit('popular', 'en'),
    fetchReddit('italy', 'it'),
    fetchHackerNews(),
    fetchNineGagTrending(),
  ])

  const annotate = arr => arr.map(s => ({ ...s, fitScore: fitScore(s.title) }))

  const en = [...annotate(wikiEn), ...annotate(rdMain), ...annotate(hn)].sort((a, b) => b.score - a.score)
  const it = [...annotate(wikiIt), ...annotate(rdIt)].sort((a, b) => b.score - a.score)

  const date = isoDate()
  const out = path.join(ROOT, 'reports', `trend-digest-${date}.md`)

  const lines = []
  lines.push(`# Trend digest — ${date}`)
  lines.push('')
  lines.push('Read-only weekly digest of world trends for SplitVote landing-page / new-article PM review.')
  lines.push('')
  lines.push('Pulls the same Wikipedia top-pageviews + Reddit + HackerNews signals the daily dilemma-generation cron uses, then scores each title for moral-dilemma fit (keyword heuristic — not semantic). High-fit, high-score trends are surfaced as landing-page candidates.')
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
  lines.push(renderLocaleSection('en', 'Wikipedia EN + Reddit r/popular + HackerNews', en))
  lines.push('## IT trends')
  lines.push('')
  lines.push(renderLocaleSection('it', 'Wikipedia IT + Reddit r/italy', it))
  lines.push(renderNineGagSection(nineGag))

  fs.writeFileSync(out, lines.join('\n'))

  const candidatesEn = en.filter(s => classifyFit(s.fitScore) === 'high' && s.score >= 60).length
  const candidatesIt = it.filter(s => classifyFit(s.fitScore) === 'high' && s.score >= 60).length

  // 9GAG status breakdown (meme/culture, not landing candidates).
  const ng = nineGag.map(it => classify9GagItem(it))
  const ngSafe   = ng.filter(s => s === 'safe').length
  const ngReview = ng.filter(s => s === 'review').length
  const ngBlock  = ng.filter(s => s === 'block').length

  console.log(`[trend-digest] en=${en.length} signals, ${candidatesEn} landing candidate(s)`)
  console.log(`[trend-digest] it=${it.length} signals, ${candidatesIt} landing candidate(s)`)
  console.log(`[trend-digest] 9gag=${nineGag.length} items (safe=${ngSafe}, review=${ngReview}, block=${ngBlock})`)
  console.log(`[trend-digest] report written: ${path.relative(ROOT, out)}`)
}

main().catch(e => { console.error(e); process.exit(1) })
