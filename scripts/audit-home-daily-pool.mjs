#!/usr/bin/env node
/**
 * audit-home-daily-pool.mjs — read-only audit of next N daily home dilemmas
 *
 * Replicates `app/page.tsx::HomePage` ordering:
 *   allScenarios = [...uniqueDynamicEn, ...staticEn]
 *   index = floor(Date.now() / 86_400_000) % allScenarios.length
 *
 * Prints the dilemma the home is serving today + next 9 days,
 * with question + options + editorial-shape warnings (regexes
 * duplicated from lib/content-quality-gates.ts).
 *
 * SAFE_AUTONOMOUS — Redis REST GET only. No writes, no AI calls.
 *
 * Run: node scripts/audit-home-daily-pool.mjs
 * Output: reports/home-daily-pool-audit-<YYYY-MM-DD>.md
 */

import fs   from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT      = path.resolve(__dirname, '..')

function loadEnvFile() {
  try {
    const content = fs.readFileSync(path.join(ROOT, '.env.local'), 'utf8')
    for (const line of content.split('\n')) {
      const t = line.trim()
      if (!t || t.startsWith('#')) continue
      const eq = t.indexOf('=')
      if (eq === -1) continue
      const key = t.slice(0, eq).trim()
      const val = t.slice(eq + 1).trim().replace(/^["']|["']$/g, '')
      if (!process.env[key]) process.env[key] = val
    }
  } catch { /* ignore */ }
}
loadEnvFile()

const UPSTASH_URL   = process.env.KV_REST_API_URL   ?? process.env.UPSTASH_REDIS_REST_URL   ?? ''
const UPSTASH_TOKEN = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN ?? ''

if (!UPSTASH_URL || !UPSTASH_TOKEN) {
  console.error('[audit-home-daily-pool] Missing KV_REST_API_URL / KV_REST_API_TOKEN. Aborting.')
  process.exit(2)
}

async function redisGet(key) {
  const r = await fetch(`${UPSTASH_URL}/get/${encodeURIComponent(key)}`, {
    headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` },
  })
  if (!r.ok) throw new Error(`Redis GET ${key} failed: HTTP ${r.status}`)
  const j = await r.json()
  if (j.result == null) return null
  return typeof j.result === 'string' ? JSON.parse(j.result) : j.result
}

function parseList(raw) {
  if (Array.isArray(raw)) return raw
  if (typeof raw === 'string') {
    try { const p = JSON.parse(raw); return Array.isArray(p) ? p : [] } catch { return [] }
  }
  return []
}

const EDITORIAL_TRADEOFF_MARKERS_RE = new RegExp(
  [
    '\\beven if\\b', '\\beven though\\b', '\\bknowing that\\b',
    '\\bat the cost of\\b', '\\bin exchange for\\b', '\\bin return for\\b', '\\brisking\\b',
    'which (?:cost|risk|danger|harm|injustice|tradeoff|trade-off|side) do you accept',
    'more (?:dangerous|harmful|risky|costly|painful|unjust)',
    'but (?:doubles|halves|raises|lowers|costs|penalizes|harms|sacrifices|cuts|locks out|leaves out|forces)',
    '\\banche se\\b', '\\bsapendo che\\b', '\\bal costo di\\b', '\\brischiando\\b', '\\bin cambio di\\b',
    'quale (?:costo|rischio|ingiustizia|pericolo|danno|tradeoff|lato) accetti',
    'più (?:pericoloso|dannoso|rischioso|grave|costoso|doloroso|ingiusto)',
    '\\bma (?:raddoppia|penalizza|danneggia|costa|costringe|sacrifica|aumenta|riduce|toglie|esclude)',
    '\\bpur (?:proteggendo|salvando|riducendo|aumentando|garantendo|dando)',
    '\\bnonostante\\b',
  ].join('|'), 'i',
)
const ABSTRACT_POLICY_RE = new RegExp(
  [
    'should\\s+(?:governments?|countries|society|the\\s+government|the\\s+state|companies|platforms|nations|policymakers|the\\s+public)\\b',
    'should\\s+(?:we|society)\\s+(?:ban|allow|support|oppose|regulate|permit|prohibit|endorse|reject)\\b',
    'dovrebbero\\s+(?:i\\s+(?:governi|paesi|governanti|cittadini)|le\\s+aziende|gli\\s+stati|le\\s+piattaforme|le\\s+nazioni)\\b',
    '(?:i\\s+(?:governi|paesi|governanti|cittadini)|la\\s+società|lo\\s+stato|le\\s+aziende|le\\s+piattaforme|gli\\s+stati)\\s+dovrebbe(?:ro)?\\b',
    'si\\s+dovrebbe(?:ro)?\\s+(?:vietare|permettere|sostenere|regolare|limitare|consentire|proibire)\\b',
  ].join('|'), 'i',
)
const SUPPORT_OPPOSE_RE = new RegExp(
  [
    '\\b(?:support|oppose|endorse|reject|approve|disapprove|ban|allow|regulate|permit|prohibit)\\b',
    '\\b(?:sostenere|sostieni|sostenga|opporsi|opponi|appoggiare|respingere|approvare|disapprovare|vietare|vieti|permettere|permetti|regolare|regoli|consentire|consenti|proibire|proibisci)\\b',
  ].join('|'), 'i',
)
const UNDEFINED_ACTOR_RE = new RegExp(
  [
    '\\b(?:countries|governments|companies|the\\s+society|society|the\\s+others|the\\s+government|the\\s+state|the\\s+platform|policymakers|nations|the\\s+public)\\b',
    '\\b(?:un\\s+paese|i\\s+paesi|gli\\s+altri|il\\s+governo|lo\\s+stato|la\\s+società|le\\s+aziende|le\\s+piattaforme|i\\s+governanti|le\\s+nazioni|i\\s+cittadini)\\b',
  ].join('|'), 'i',
)
const UNDEFINED_ACTION_RE = new RegExp(
  [
    '\\b(?:slow|restrict|limit|curb|throttle|slow\\s+down)\\b',
    '\\b(?:rallentare|rallentino|rallenti|rallentiamo|limitare|limiti|limitino|restringere|ridurre|riduci|riducano|frenare|freni|frenino)\\b',
  ].join('|'), 'i',
)

const PERSONAL_STAKE_RE = new RegExp(
  [
    '\\b(?:you|your|yours|yourself|yourselves)\\b',
    '\\btu\\b', '\\b(?:tuo|tua|tuoi|tue)\\b', '\\bti\\b', '\\bte\\b',
    '\\bvoi\\b', '\\b(?:vostro|vostra|vostri|vostre)\\b', '\\bvi\\b',
  ].join('|'), 'i',
)

const DECISION_VERB_RE = new RegExp(
  [
    '\\?',
    '\\bwould\\s+you\\b', '\\bdo\\s+you\\b', '\\bwhat\\s+do\\s+you\\b',
    '\\bwhich\\s+do\\s+you\\b', '\\bare\\s+you\\b',
    '\\blo\\s+faresti\\b', '\\blo\\s+fai\\b',
    '\\bcosa\\s+(?:scegli|fai|decidi)\\b', '\\bchi\\s+scegli\\b',
    '\\baccetti\\b', '\\bsei\\s+disposto\\b', '\\bvale\\s+la\\s+pena\\b',
  ].join('|'), 'i',
)

function countWords(s) {
  return ((s ?? '').match(/\S+/g) ?? []).length
}

function editorialWarnings(question, optionA, optionB, isLifestyle) {
  if (isLifestyle) return []
  const warnings = []
  const hasTradeoffMarker = EDITORIAL_TRADEOFF_MARKERS_RE.test(question)
  if (!hasTradeoffMarker) {
    if (ABSTRACT_POLICY_RE.test(question))  warnings.push('abstract_policy_question')
    if (SUPPORT_OPPOSE_RE.test(question))   warnings.push('support_oppose_framing')
    if (UNDEFINED_ACTOR_RE.test(question))  warnings.push('undefined_collective_actor')
    if (UNDEFINED_ACTION_RE.test(question)) warnings.push('undefined_action_verb')
  }
  if (!PERSONAL_STAKE_RE.test(question)) warnings.push('missing_personal_stake')
  if (countWords(question) > 28 && !DECISION_VERB_RE.test(question)) warnings.push('wordy_setup_question')
  if (countWords(optionA) > 22) warnings.push('wordy_option:optionA')
  if (countWords(optionB) > 22) warnings.push('wordy_option:optionB')
  return warnings
}

function inferLifestyle(s) {
  if (s.dilemmaStyle === 'lifestyle') return true
  if (s.dilemmaStyle === 'moral') return false
  return s.category === 'lifestyle'
}

function readStaticEn() {
  const file = fs.readFileSync(path.join(ROOT, 'lib/scenarios.ts'), 'utf8')
  // Match a full scenario block: { id, question, optionA, optionB, ..., category, }
  // Quotes can be ' or " and the same quote must close. Allow any non-newline content.
  const re = /\{\s*id:\s*(['"])([^'"\n]+)\1\s*,\s*question:\s*(['"])([\s\S]*?[^\\])\3\s*,\s*optionA:\s*(['"])([\s\S]*?[^\\])\5\s*,\s*optionB:\s*(['"])([\s\S]*?[^\\])\7\s*,[\s\S]*?category:\s*(['"])([^'"\n]+)\9/g
  const matches = [...file.matchAll(re)]
  return matches.map(m => ({
    id:       m[2],
    question: m[4].replace(/\\'/g, "'").replace(/\\"/g, '"'),
    optionA:  m[6].replace(/\\'/g, "'").replace(/\\"/g, '"'),
    optionB:  m[8].replace(/\\'/g, "'").replace(/\\"/g, '"'),
    category: m[10],
    locale:   'en',
  }))
}

function annotate(s, source) {
  const isLifestyle = inferLifestyle(s)
  return {
    id:        s.id ?? '(no-id)',
    locale:    s.locale ?? 'en',
    category:  s.category ?? 'unknown',
    source,
    isLifestyle,
    question:  s.question ?? '',
    optionA:   s.optionA ?? '',
    optionB:   s.optionB ?? '',
    warnings:  editorialWarnings(s.question ?? '', s.optionA ?? '', s.optionB ?? '', isLifestyle),
  }
}

function escapeMd(s) {
  return (s ?? '').toString().replace(/\|/g, '\\|').replace(/\r?\n/g, ' ').slice(0, 400)
}

function isoDate(d = new Date()) {
  return d.toISOString().slice(0, 10)
}

function dateFromOffset(daysAhead) {
  const d = new Date()
  d.setUTCDate(d.getUTCDate() + daysAhead)
  return isoDate(d)
}

async function main() {
  const rawApproved = await redisGet('dynamic:scenarios')
  const approvedRaw = parseList(rawApproved)

  const dynamicEn = approvedRaw.filter(s => s.locale === 'en')

  const staticEn = readStaticEn()
  const staticIds = new Set(staticEn.map(s => s.id))
  const uniqueDynamic = dynamicEn.filter(d => !staticIds.has(d.id))

  const allScenarios = [
    ...uniqueDynamic.map(s => annotate(s, 'dynamic')),
    ...staticEn.map(s => annotate(s, 'static')),
  ]

  const N = allScenarios.length
  const daysSinceEpoch = Math.floor(Date.now() / 86_400_000)
  const todayIdx = daysSinceEpoch % N

  const HORIZON = 10
  const upcoming = []
  for (let i = 0; i < HORIZON; i++) {
    const idx = (daysSinceEpoch + i) % N
    upcoming.push({
      offsetDays: i,
      date:       dateFromOffset(i),
      poolIndex:  idx,
      ...allScenarios[idx],
    })
  }

  const moralOnly = allScenarios.filter(s => !s.isLifestyle)
  const moralFlagged = moralOnly.filter(s => s.warnings.length > 0)
  const flagRatePct  = moralOnly.length ? Math.round((moralFlagged.length / moralOnly.length) * 1000) / 10 : 0

  const date = isoDate()
  const mdOut = path.join(ROOT, 'reports', `home-daily-pool-audit-${date}.md`)

  const lines = []
  lines.push(`# Home daily pool audit — ${date}`)
  lines.push('')
  lines.push('Read-only audit of the next 10 dilemmas the EN home will serve via `getDailyScenario`.')
  lines.push('Pool ordering mirrors `app/page.tsx`: `[...uniqueDynamicEn, ...staticEn]`. Index uses `floor(Date.now() / 86_400_000) % poolLength`.')
  lines.push('')
  lines.push('## Pool summary')
  lines.push('')
  lines.push(`- Dynamic EN approved (after dedup vs static): **${uniqueDynamic.length}**`)
  lines.push(`- Static EN: **${staticEn.length}**`)
  lines.push(`- Total pool length: **${N}**`)
  lines.push(`- Today's pool index: **${todayIdx}** (daysSinceEpoch=${daysSinceEpoch})`)
  lines.push(`- Editorial-shape flag rate (moral, whole pool): **${flagRatePct}%** (${moralFlagged.length}/${moralOnly.length})`)
  lines.push('')
  lines.push('## Next 10 daily dilemmas')
  lines.push('')
  lines.push('| Offset | Date (UTC) | Pool idx | Source | Locale | Category | Style | Warnings | Question | Option A | Option B |')
  lines.push('|---:|---|---:|---|---|---|---|---|---|---|---|')
  for (const u of upcoming) {
    const tag = u.offsetDays === 0 ? '**TODAY**' : `+${u.offsetDays}d`
    lines.push(
      `| ${tag} | ${u.date} | ${u.poolIndex} | ${u.source} | ${u.locale} | ${u.category} | ${u.isLifestyle ? 'lifestyle' : 'moral'} | ${u.warnings.join(', ') || '—'} | ${escapeMd(u.question)} | ${escapeMd(u.optionA)} | ${escapeMd(u.optionB)} |`,
    )
  }
  lines.push('')
  lines.push('## Per-day detail (full text)')
  lines.push('')
  for (const u of upcoming) {
    const tag = u.offsetDays === 0 ? '**TODAY**' : `+${u.offsetDays}d`
    lines.push(`### ${tag} — ${u.date} — pool idx ${u.poolIndex}`)
    lines.push('')
    lines.push(`- id: \`${u.id}\``)
    lines.push(`- source: ${u.source}`)
    lines.push(`- locale: ${u.locale}`)
    lines.push(`- category: ${u.category}`)
    lines.push(`- style: ${u.isLifestyle ? 'lifestyle' : 'moral'}`)
    lines.push(`- editorial warnings: ${u.warnings.length ? u.warnings.join(', ') : 'none'}`)
    lines.push('')
    lines.push(`> Q: ${u.question}`)
    lines.push('')
    lines.push(`- A: ${u.optionA}`)
    lines.push(`- B: ${u.optionB}`)
    lines.push('')
  }
  fs.writeFileSync(mdOut, lines.join('\n'))

  console.log(`[audit-home-daily-pool] pool=${N} (dynamic-unique=${uniqueDynamic.length}, static=${staticEn.length})`)
  console.log(`[audit-home-daily-pool] today's idx=${todayIdx}`)
  console.log(`[audit-home-daily-pool] today's id=${allScenarios[todayIdx].id} (${allScenarios[todayIdx].source})`)
  console.log(`[audit-home-daily-pool] report written: ${path.relative(ROOT, mdOut)}`)
}

main().catch(e => { console.error(e); process.exit(1) })
