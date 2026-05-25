#!/usr/bin/env node
/**
 * audit-editorial-warnings.mjs — DYNAMIC-DILEMMA-EDITORIAL-WARNINGS-DRYRUN-01
 *
 * Run: node scripts/audit-editorial-warnings.mjs
 * Output:
 *   reports/dynamic-dilemma-editorial-warnings-dryrun-<YYYY-MM-DD>.md
 *   reports/dynamic-dilemma-editorial-warnings-dryrun-<YYYY-MM-DD>.json
 *
 * SAFE_AUTONOMOUS — read-only. Fetches `dynamic:scenarios` and
 * `dynamic:drafts` from Upstash via REST GET. No writes, no AI calls, no
 * admin actions, no save-mode change. Runs the four editorial-shape
 * regexes from commit 30fe2ac (lib/content-quality-gates.ts) against
 * every approved + draft dynamic dilemma in production Redis.
 *
 * The four regexes are duplicated here verbatim for the dry-run only —
 * the source of truth remains lib/content-quality-gates.ts. If this
 * audit triggers tuning, change the regex in the .ts file and copy back
 * here for any follow-up dry-run.
 */

import fs   from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT      = path.resolve(__dirname, '..')

// ── Load .env.local ───────────────────────────────────────────────────────────

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
  } catch { /* .env.local absent — Redis fetch will fail and the script will exit */ }
}
loadEnvFile()

const UPSTASH_URL   = process.env.KV_REST_API_URL   ?? process.env.UPSTASH_REDIS_REST_URL   ?? ''
const UPSTASH_TOKEN = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN ?? ''

if (!UPSTASH_URL || !UPSTASH_TOKEN) {
  console.error('[audit-editorial-warnings] Missing KV_REST_API_URL / KV_REST_API_TOKEN. Aborting.')
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

// ── Editorial-shape regexes (duplicated from lib/content-quality-gates.ts) ────
// Source of truth: lib/content-quality-gates.ts (commit 30fe2ac).
// These copies exist ONLY for this read-only dry-run audit. Do not change
// them here without changing the .ts source — they must stay byte-equivalent.

const EDITORIAL_TRADEOFF_MARKERS_RE = new RegExp(
  [
    '\\beven if\\b',
    '\\beven though\\b',
    '\\bknowing that\\b',
    '\\bat the cost of\\b',
    '\\bin exchange for\\b',
    '\\bin return for\\b',
    '\\brisking\\b',
    'which (?:cost|risk|danger|harm|injustice|tradeoff|trade-off|side) do you accept',
    'more (?:dangerous|harmful|risky|costly|painful|unjust)',
    'but (?:doubles|halves|raises|lowers|costs|penalizes|harms|sacrifices|cuts|locks out|leaves out|forces)',
    '\\banche se\\b',
    '\\bsapendo che\\b',
    '\\bal costo di\\b',
    '\\brischiando\\b',
    '\\bin cambio di\\b',
    'quale (?:costo|rischio|ingiustizia|pericolo|danno|tradeoff|lato) accetti',
    'più (?:pericoloso|dannoso|rischioso|grave|costoso|doloroso|ingiusto)',
    '\\bma (?:raddoppia|penalizza|danneggia|costa|costringe|sacrifica|aumenta|riduce|toglie|esclude)',
    '\\bpur (?:proteggendo|salvando|riducendo|aumentando|garantendo|dando)',
    '\\bnonostante\\b',
  ].join('|'),
  'i',
)

const ABSTRACT_POLICY_RE = new RegExp(
  [
    'should\\s+(?:governments?|countries|society|the\\s+government|the\\s+state|companies|platforms|nations|policymakers|the\\s+public)\\b',
    'should\\s+(?:we|society)\\s+(?:ban|allow|support|oppose|regulate|permit|prohibit|endorse|reject)\\b',
    'dovrebbero\\s+(?:i\\s+(?:governi|paesi|governanti|cittadini)|le\\s+aziende|gli\\s+stati|le\\s+piattaforme|le\\s+nazioni)\\b',
    '(?:i\\s+(?:governi|paesi|governanti|cittadini)|la\\s+società|lo\\s+stato|le\\s+aziende|le\\s+piattaforme|gli\\s+stati)\\s+dovrebbe(?:ro)?\\b',
    'si\\s+dovrebbe(?:ro)?\\s+(?:vietare|permettere|sostenere|regolare|limitare|consentire|proibire)\\b',
  ].join('|'),
  'i',
)

const SUPPORT_OPPOSE_RE = new RegExp(
  [
    '\\b(?:support|oppose|endorse|reject|approve|disapprove|ban|allow|regulate|permit|prohibit)\\b',
    '\\b(?:sostenere|sostieni|sostenga|opporsi|opponi|appoggiare|respingere|approvare|disapprovare|vietare|vieti|permettere|permetti|regolare|regoli|consentire|consenti|proibire|proibisci)\\b',
  ].join('|'),
  'i',
)

const UNDEFINED_ACTOR_RE = new RegExp(
  [
    '\\b(?:countries|governments|companies|the\\s+society|society|the\\s+others|the\\s+government|the\\s+state|the\\s+platform|policymakers|nations|the\\s+public)\\b',
    '\\b(?:un\\s+paese|i\\s+paesi|gli\\s+altri|il\\s+governo|lo\\s+stato|la\\s+società|le\\s+aziende|le\\s+piattaforme|i\\s+governanti|le\\s+nazioni|i\\s+cittadini)\\b',
  ].join('|'),
  'i',
)

const UNDEFINED_ACTION_RE = new RegExp(
  [
    '\\b(?:slow|restrict|limit|curb|throttle|slow\\s+down)\\b',
    '\\b(?:rallentare|rallentino|rallenti|rallentiamo|limitare|limiti|limitino|restringere|ridurre|riduci|riducano|frenare|freni|frenino)\\b',
  ].join('|'),
  'i',
)

const WARNING_CODES = [
  'abstract_policy_question',
  'support_oppose_framing',
  'undefined_collective_actor',
  'undefined_action_verb',
]

function editorialWarnings(question, isLifestyle) {
  if (isLifestyle) return []
  const warnings = []
  const hasTradeoffMarker = EDITORIAL_TRADEOFF_MARKERS_RE.test(question)
  if (hasTradeoffMarker) return warnings
  if (ABSTRACT_POLICY_RE.test(question))  warnings.push('abstract_policy_question')
  if (SUPPORT_OPPOSE_RE.test(question))   warnings.push('support_oppose_framing')
  if (UNDEFINED_ACTOR_RE.test(question))  warnings.push('undefined_collective_actor')
  if (UNDEFINED_ACTION_RE.test(question)) warnings.push('undefined_action_verb')
  return warnings
}

// ── Main audit ────────────────────────────────────────────────────────────────

function inferLifestyle(s) {
  if (s.dilemmaStyle === 'lifestyle') return true
  if (s.dilemmaStyle === 'moral') return false
  return s.category === 'lifestyle'
}

function summarize(items, label) {
  const total       = items.length
  const byLocale    = { en: 0, it: 0, other: 0 }
  const byCategory  = {}
  const moralOnly   = items.filter(i => !i.isLifestyle)
  const flagCounts  = Object.fromEntries(WARNING_CODES.map(c => [c, 0]))
  const totalFlagged = moralOnly.filter(i => i.warnings.length > 0).length
  const moralCount   = moralOnly.length
  const lifestyleCount = total - moralCount

  for (const i of items) {
    if (i.locale === 'en')      byLocale.en  += 1
    else if (i.locale === 'it') byLocale.it  += 1
    else                        byLocale.other += 1
    byCategory[i.category] = (byCategory[i.category] ?? 0) + 1
  }
  for (const i of moralOnly) {
    for (const w of i.warnings) flagCounts[w] += 1
  }

  return {
    label,
    total,
    moralCount,
    lifestyleCount,
    totalFlagged,
    flagRatePct: moralCount ? Math.round((totalFlagged / moralCount) * 1000) / 10 : 0,
    byLocale,
    byCategory,
    flagCounts,
    flagRatesPct: Object.fromEntries(
      WARNING_CODES.map(c => [c, moralCount ? Math.round((flagCounts[c] / moralCount) * 1000) / 10 : 0])
    ),
  }
}

function topFlagged(items, limit = 20) {
  return items
    .filter(i => i.warnings.length > 0)
    .sort((a, b) => b.warnings.length - a.warnings.length || (b.scoreFinal ?? 0) - (a.scoreFinal ?? 0))
    .slice(0, limit)
}

function escapeMd(s) {
  return (s ?? '').toString().replace(/\|/g, '\\|').replace(/\r?\n/g, ' ').slice(0, 240)
}

function isoDate() {
  return new Date().toISOString().slice(0, 10)
}

function mapItems(list, status) {
  return list.map(s => {
    const isLifestyle = inferLifestyle(s)
    const warnings = editorialWarnings(s.question ?? '', isLifestyle)
    return {
      id:         s.id ?? '(no-id)',
      locale:     s.locale ?? 'unknown',
      category:   s.category ?? 'unknown',
      isLifestyle,
      dilemmaStyle: s.dilemmaStyle ?? null,
      status,
      question:   s.question ?? '',
      optionA:    s.optionA ?? '',
      optionB:    s.optionB ?? '',
      scoreFinal: s.scores?.finalScore ?? null,
      trend:      s.trend ?? null,
      generatedAt: s.generatedAt ?? null,
      approvedAt:  s.approvedAt ?? null,
      tradeoffMarkerHit: !isLifestyle && EDITORIAL_TRADEOFF_MARKERS_RE.test(s.question ?? ''),
      warnings,
    }
  })
}

async function main() {
  const [rawApproved, rawDrafts] = await Promise.all([
    redisGet('dynamic:scenarios'),
    redisGet('dynamic:drafts'),
  ])
  const approvedRaw = parseList(rawApproved)
  const draftsRaw   = parseList(rawDrafts)

  const approvedItems = mapItems(approvedRaw, 'approved')
  const draftItems    = mapItems(draftsRaw, 'draft')

  const approvedSummary = summarize(approvedItems, 'approved')
  const draftsSummary   = summarize(draftItems, 'drafts')

  const topApproved = topFlagged(approvedItems, 20)
  const topDrafts   = topFlagged(draftItems, 20)

  // Tradeoff-marker-suppressed: how many moral approved would have been
  // flagged if not for the suppressor. Helpful for tuning the suppressor.
  const suppressedApproved = approvedItems.filter(i => !i.isLifestyle && i.tradeoffMarkerHit)

  const date = isoDate()
  const jsonOut = path.join(ROOT, 'reports', `dynamic-dilemma-editorial-warnings-dryrun-${date}.json`)
  const mdOut   = path.join(ROOT, 'reports', `dynamic-dilemma-editorial-warnings-dryrun-${date}.md`)

  fs.writeFileSync(jsonOut, JSON.stringify({
    generatedAt: new Date().toISOString(),
    approved: approvedSummary,
    drafts:   draftsSummary,
    suppressedApprovedCount: suppressedApproved.length,
    topApproved,
    topDrafts,
  }, null, 2))

  const md = renderMarkdown({
    date,
    approvedSummary, draftsSummary,
    topApproved, topDrafts,
    suppressedApproved,
    totalApproved: approvedItems.length,
    totalDrafts:   draftItems.length,
  })
  fs.writeFileSync(mdOut, md)

  console.log(`[audit-editorial-warnings] approved=${approvedItems.length} drafts=${draftItems.length}`)
  console.log(`[audit-editorial-warnings] approved flag rate (moral only): ${approvedSummary.flagRatePct}% (${approvedSummary.totalFlagged}/${approvedSummary.moralCount})`)
  console.log(`[audit-editorial-warnings] draft flag rate (moral only):    ${draftsSummary.flagRatePct}% (${draftsSummary.totalFlagged}/${draftsSummary.moralCount})`)
  console.log(`[audit-editorial-warnings] tradeoff-marker suppressed (approved moral): ${suppressedApproved.length}`)
  console.log(`[audit-editorial-warnings] report written: ${path.relative(ROOT, mdOut)}`)
  console.log(`[audit-editorial-warnings] json   written: ${path.relative(ROOT, jsonOut)}`)
}

function renderTopTable(items) {
  if (items.length === 0) return '_None flagged._\n'
  const header = '| # | id | locale | category | warnings | question |\n|---|---|---|---|---|---|\n'
  const rows = items.map((i, idx) =>
    `| ${idx + 1} | \`${escapeMd(i.id)}\` | ${i.locale} | ${i.category} | ${i.warnings.join(', ')} | ${escapeMd(i.question)} |`
  ).join('\n')
  return header + rows + '\n'
}

function renderCounts(label, summary) {
  const lines = []
  lines.push(`**${label}** — total: ${summary.total} (moral: ${summary.moralCount}, lifestyle: ${summary.lifestyleCount})`)
  lines.push('')
  lines.push(`- Locale: EN ${summary.byLocale.en} · IT ${summary.byLocale.it}${summary.byLocale.other ? ` · other ${summary.byLocale.other}` : ''}`)
  lines.push(`- Total flagged (moral only): **${summary.totalFlagged} / ${summary.moralCount} = ${summary.flagRatePct}%**`)
  lines.push('')
  lines.push('| warning | count | %  of moral |')
  lines.push('|---|---:|---:|')
  for (const code of WARNING_CODES) {
    lines.push(`| \`${code}\` | ${summary.flagCounts[code]} | ${summary.flagRatesPct[code]}% |`)
  }
  lines.push('')
  lines.push('Category breakdown (all dilemmas in this bucket):')
  lines.push('')
  lines.push('| category | count |')
  lines.push('|---|---:|')
  for (const [cat, n] of Object.entries(summary.byCategory).sort((a, b) => b[1] - a[1])) {
    lines.push(`| ${cat} | ${n} |`)
  }
  lines.push('')
  return lines.join('\n')
}

function renderMarkdown({
  date, approvedSummary, draftsSummary, topApproved, topDrafts,
  suppressedApproved, totalApproved, totalDrafts,
}) {
  return `# Dynamic Dilemma Editorial-Shape Warnings — Dry-Run ${date}

**Sprint:** \`DYNAMIC-DILEMMA-EDITORIAL-WARNINGS-DRYRUN-01\`
**Mode:** Read-only audit. No Redis writes, no save-mode change, no admin action.
**Source of truth for regexes:** \`lib/content-quality-gates.ts\` (commit \`30fe2ac\`).
**Audit script:** \`scripts/audit-editorial-warnings.mjs\` (regexes duplicated verbatim for this dry-run only).

## TL;DR

- Approved dynamic dilemmas audited: **${totalApproved}**.
- Draft dynamic dilemmas audited: **${totalDrafts}**.
- Approved flag rate (moral-only): **${approvedSummary.totalFlagged} / ${approvedSummary.moralCount} = ${approvedSummary.flagRatePct}%**.
- Draft flag rate (moral-only): **${draftsSummary.totalFlagged} / ${draftsSummary.moralCount} = ${draftsSummary.flagRatePct}%**.
- Approved moral questions suppressed by an explicit tradeoff marker: **${suppressedApproved.length}**.

## What the four warnings mean

| Code | Fires when (in the question, moral only, no tradeoff marker present) |
|---|---|
| \`abstract_policy_question\` | Referendum-style "Should governments / countries / society X?" + IT equivalents. |
| \`support_oppose_framing\` | Policy-poll verbs: support, oppose, ban, allow, regulate, permit + IT equivalents. |
| \`undefined_collective_actor\` | Broad noun actors: countries, society, the others, un Paese, gli altri, il governo, la società, etc. |
| \`undefined_action_verb\` | Vague action verbs: slow, restrict, limit, curb + IT (rallentare, limitare, restringere, ridurre, frenare). |

Suppression: \`EDITORIAL_TRADEOFF_MARKERS_RE\` matches explicit-cost / comparative-risk phrasing
("even if", "ma raddoppia", "più pericoloso", "which cost do you accept", "quale ingiustizia accetti", etc.).

## Approved dynamic pool

${renderCounts('Approved', approvedSummary)}

### Top ${Math.min(20, topApproved.length)} flagged approved dilemmas

${renderTopTable(topApproved)}

## Draft dynamic pool

${renderCounts('Drafts', draftsSummary)}

### Top ${Math.min(20, topDrafts.length)} flagged draft dilemmas

${renderTopTable(topDrafts)}

## Manual triage — likely TP vs FP (sample interpretation)

The audit produces raw warning counts; assigning each flagged item to
likely-true-positive / likely-false-positive / unclear requires human
judgement. Inspect the top tables above and use this rubric:

- **Likely TP** — the question is a referendum-shaped "Should X?" or a
  vague collective-actor + vague-verb construction with no cost language.
  The voter could answer without picturing a cost on the losing side.
- **Likely FP** — the question is concrete, identity-relevant, names a
  specific person/scene, and happens to contain a surface token that the
  regex matched (e.g. "the state" referring to "the U.S. state of X" in
  a personal-narrative dilemma, or "allow" inside an option-style verb
  in an otherwise concrete moral situation).
- **Unclear** — the dilemma is borderline; the warning may signal a real
  weakness but the question is salvageable with light editing.

## Recommendation

See \`reports/dynamic-dilemma-editorial-warnings-dryrun-${date}.json\` for the
full machine-readable dataset. The narrative recommendation belongs in
the human-curated section appended to this file after manual triage.
`
}

main().catch(err => {
  console.error('[audit-editorial-warnings] FATAL:', err)
  process.exit(1)
})
