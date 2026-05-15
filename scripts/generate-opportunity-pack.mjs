#!/usr/bin/env node
/**
 * generate-opportunity-pack.mjs — Manual trend → opportunity pack writer
 *
 * Run:   node scripts/generate-opportunity-pack.mjs <input-path>
 *        npm run content:opportunity-pack -- <input-path>
 *
 * Input:  JSON file at <input-path> describing a trend opportunity (see schema below).
 * Output:
 *   content-output/content-intelligence-<slug>-<date>.md
 *   content-output/content-intelligence-<slug>-<date>.json
 *
 *   ⚠ `content-output/` is a LOCAL GENERATED ARTIFACTS folder — gitignored and
 *   vercelignored. The source of truth is the INPUT JSON under
 *   `scripts/opportunity-packs-input/`. Regenerate the output by re-running
 *   this script after editing the input.
 *
 * SAFE_AUTONOMOUS — read-only.
 * - No AI calls.
 * - No DB writes.
 * - No auto-publish.
 * - Reads Redis (approved + drafts) only to run a duplicate/saturation check; falls back
 *   to "no Redis" mode silently if .env.local or KV creds are missing.
 *
 * Schema (input JSON):
 *   slug                  string  kebab-case identifier (e.g. "bioethics-bodyoids")
 *   date                  string  ISO YYYY-MM-DD
 *   title                 string  Human title for the pack
 *   trendOrigin           string  e.g. "manual" | "picoclaw" | "news" | "research"
 *   summary               string  editorial paragraph (1–4 sentences)
 *   sources               { title, url, publisher }[]   external sources
 *   riskLevel             "low" | "medium" | "high"
 *   riskFlags             string[]                       free-form tags
 *   guardrails            string[]                       editorial guardrails — copy verbatim into admin review
 *   candidateCategory     Category                       primary category for proposed dilemmas
 *   alternateCategories   Category[]                     other allowed categories
 *   candidateSearchIntent string                         single-line intent (SEO/UX framing)
 *   saturationKeywords    string[]                       keywords used for inventory check (lowercase)
 *   dilemmasEN            DilemmaProposal[]              6–8 proposals
 *   dilemmasIT            DilemmaProposal[]              6–8 proposals (parity expected)
 *   suggestedWorkflow     { primary, alternates, notes } workflow recommendation
 *   internalRefs          string[]                       optional refs to internal docs
 *
 *   DilemmaProposal: { id, question, optionA, optionB, emoji, category }
 *
 * Categories (from lib/scenarios.ts):
 *   morality | survival | loyalty | justice | freedom | technology | society | relationships | lifestyle
 *
 * Workflow primary values:
 *   admin_draft     manual admin draft creation, no AI call
 *   seed_batch      add as seed pack/topic for AI generation
 *   static          merge into lib/scenarios.ts as evergreen
 *   blog            commission a blog article
 *   landing         build an SEO landing page
 */

import fs   from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT      = path.resolve(__dirname, '..')

// ── CLI ───────────────────────────────────────────────────────────────────────

const argInput = process.argv[2]
if (!argInput) {
  console.error('Usage: node scripts/generate-opportunity-pack.mjs <input-path>')
  process.exit(2)
}
const inputPath = path.isAbsolute(argInput) ? argInput : path.join(ROOT, argInput)
if (!fs.existsSync(inputPath)) {
  console.error(`Input file not found: ${inputPath}`)
  process.exit(2)
}

// ── Load .env.local (graceful — static-only when missing) ─────────────────────

function loadEnvFile() {
  try {
    const content = fs.readFileSync(path.join(ROOT, '.env.local'), 'utf8')
    for (const line of content.split('\n')) {
      const t = line.trim()
      if (!t || t.startsWith('#')) continue
      const eq  = t.indexOf('=')
      if (eq === -1) continue
      const key = t.slice(0, eq).trim()
      const val = t.slice(eq + 1).trim().replace(/^["']|["']$/g, '')
      if (!process.env[key]) process.env[key] = val
    }
  } catch { /* .env.local absent — Redis check skipped */ }
}
loadEnvFile()

const UPSTASH_URL   = process.env.KV_REST_API_URL   ?? process.env.UPSTASH_REDIS_REST_URL   ?? ''
const UPSTASH_TOKEN = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN ?? ''
const REDIS_OK      = Boolean(UPSTASH_URL && UPSTASH_TOKEN)

async function redisGet(key) {
  if (!REDIS_OK) return null
  try {
    const r = await fetch(`${UPSTASH_URL}/get/${encodeURIComponent(key)}`, {
      headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` },
    })
    if (!r.ok) return null
    const j = await r.json()
    if (j.result == null) return null
    return typeof j.result === 'string' ? JSON.parse(j.result) : j.result
  } catch { return null }
}

// ── Text similarity (Jaccard on 4+ char tokens, mirror of report script) ──────

function norm(t) {
  return String(t ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'')
    .replace(/[^\w\s]/g,' ').replace(/\s+/g,' ').trim()
}
function tokens(t) { return new Set(norm(t).split(' ').filter(w => w.length > 3)) }
function jaccard(a, b) {
  const sa = tokens(a), sb = tokens(b)
  const inter = [...sa].filter(x => sb.has(x)).length
  const union = new Set([...sa, ...sb]).size
  return union === 0 ? 0 : inter / union
}

// ── Validation ────────────────────────────────────────────────────────────────

const VALID_CATEGORIES = new Set([
  'morality','survival','loyalty','justice','freedom',
  'technology','society','relationships','lifestyle',
])
const VALID_RISK    = new Set(['low','medium','high'])
const VALID_WORKFLOW = new Set(['admin_draft','seed_batch','static','blog','landing'])

function validateInput(p) {
  const errs = []
  const need = (k, t) => { if (typeof p[k] !== t) errs.push(`${k} must be ${t}`) }
  const needArr = (k, min, max) => {
    if (!Array.isArray(p[k]))                          errs.push(`${k} must be an array`)
    else if (min != null && p[k].length < min)         errs.push(`${k} must have ≥ ${min} items (got ${p[k].length})`)
    else if (max != null && p[k].length > max)         errs.push(`${k} must have ≤ ${max} items (got ${p[k].length})`)
  }
  need('slug', 'string')
  need('date', 'string')
  need('title', 'string')
  need('trendOrigin', 'string')
  need('summary', 'string')
  needArr('sources', 1)
  if (!VALID_RISK.has(p.riskLevel)) errs.push(`riskLevel must be one of low|medium|high (got ${p.riskLevel})`)
  needArr('riskFlags', 0)
  needArr('guardrails', 1)
  if (!VALID_CATEGORIES.has(p.candidateCategory)) errs.push(`candidateCategory invalid (got ${p.candidateCategory})`)
  needArr('alternateCategories', 0)
  for (const c of p.alternateCategories ?? []) {
    if (!VALID_CATEGORIES.has(c)) errs.push(`alternateCategories: invalid value "${c}"`)
  }
  need('candidateSearchIntent', 'string')
  needArr('saturationKeywords', 1)
  needArr('dilemmasEN', 6, 8)
  needArr('dilemmasIT', 6, 8)
  for (const loc of ['dilemmasEN','dilemmasIT']) {
    for (const [i, d] of (p[loc] ?? []).entries()) {
      if (!d.id || !d.question || !d.optionA || !d.optionB || !d.emoji || !d.category) {
        errs.push(`${loc}[${i}]: missing required field (id/question/optionA/optionB/emoji/category)`)
      }
      if (d.category && !VALID_CATEGORIES.has(d.category)) {
        errs.push(`${loc}[${i}]: invalid category "${d.category}"`)
      }
    }
  }
  if (!p.suggestedWorkflow || typeof p.suggestedWorkflow !== 'object') {
    errs.push('suggestedWorkflow must be an object')
  } else if (!VALID_WORKFLOW.has(p.suggestedWorkflow.primary)) {
    errs.push(`suggestedWorkflow.primary must be one of ${[...VALID_WORKFLOW].join('|')}`)
  }
  return errs
}

// ── Read input ────────────────────────────────────────────────────────────────

let pack
try {
  pack = JSON.parse(fs.readFileSync(inputPath, 'utf8'))
} catch (e) {
  console.error(`Invalid JSON in ${inputPath}: ${e.message}`)
  process.exit(2)
}
const errs = validateInput(pack)
if (errs.length > 0) {
  console.error('Validation errors:')
  for (const e of errs) console.error(`  - ${e}`)
  process.exit(2)
}

// ── Console banner ────────────────────────────────────────────────────────────

console.log('\n══════════════════════════════════════════════════════════')
console.log('  SplitVote — Opportunity Pack Generator')
console.log(`  pack: ${pack.slug}   date: ${pack.date}   risk: ${pack.riskLevel}`)
console.log(`  redis: ${REDIS_OK ? 'connected' : 'static-only (no inventory cross-check)'}`)
console.log('══════════════════════════════════════════════════════════')

// ── Saturation check against approved + drafts ───────────────────────────────

const [approvedRaw, draftsRaw] = await Promise.all([
  redisGet('dynamic:scenarios'),
  redisGet('dynamic:drafts'),
])
const approved = Array.isArray(approvedRaw) ? approvedRaw : []
const drafts   = Array.isArray(draftsRaw)   ? draftsRaw   : []

const kwLo = pack.saturationKeywords.map(k => k.toLowerCase())
function matchesKeyword(text) {
  const lo = norm(text)
  return kwLo.some(k => lo.includes(norm(k)))
}

const inventorySample = []
for (const s of [...approved, ...drafts]) {
  const txt = `${s.question ?? ''} ${s.optionA ?? ''} ${s.optionB ?? ''} ${(s.keywords ?? []).join(' ')}`
  if (matchesKeyword(txt)) {
    inventorySample.push({
      id:        s.id,
      locale:    s.locale === 'it' ? 'it' : 'en',
      status:    s.status ?? (drafts.some(d => d.id === s.id) ? 'draft' : 'approved'),
      category:  s.category,
      question:  String(s.question ?? '').slice(0, 180),
    })
  }
}

const SAT_THRESH = 0.45
const saturationCheck = []
for (const loc of ['EN','IT']) {
  const props  = pack[`dilemmas${loc}`]
  const pool   = inventorySample.filter(s => loc === 'IT' ? s.locale === 'it' : s.locale === 'en')
  for (const d of props) {
    const matches = pool
      .map(s => ({
        ...s,
        similarity: Math.round(jaccard(d.question, s.question) * 100),
      }))
      .filter(m => m.similarity > 10)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 3)
    const flagged = matches.some(m => m.similarity >= SAT_THRESH * 100)
    saturationCheck.push({
      locale:    loc.toLowerCase(),
      proposalId: d.id,
      proposalQ:  d.question.slice(0, 140),
      flagged,
      topMatches: matches,
    })
  }
}
const flaggedCount = saturationCheck.filter(s => s.flagged).length

// ── Inventory snapshot ───────────────────────────────────────────────────────

const inv = {
  approvedTotal: approved.length,
  draftsTotal:   drafts.length,
  approvedKeywordHits: inventorySample.filter(s => s.status !== 'draft').length,
  draftKeywordHits:    inventorySample.filter(s => s.status === 'draft').length,
}

// ── Output ───────────────────────────────────────────────────────────────────

const outDir   = path.join(ROOT, 'content-output')
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true })

const baseName = `content-intelligence-${pack.slug}-${pack.date}`
const outJson  = path.join(outDir, `${baseName}.json`)
const outMd    = path.join(outDir, `${baseName}.md`)

const jsonReport = {
  type:                 'opportunity-pack',
  schemaVersion:        '1.0',
  generatedAt:          new Date().toISOString(),
  redisMode:            REDIS_OK ? 'connected' : 'static-only',
  slug:                 pack.slug,
  date:                 pack.date,
  title:                pack.title,
  trendOrigin:          pack.trendOrigin,
  summary:              pack.summary,
  sources:              pack.sources,
  riskLevel:            pack.riskLevel,
  riskFlags:            pack.riskFlags,
  guardrails:           pack.guardrails,
  candidateCategory:    pack.candidateCategory,
  alternateCategories:  pack.alternateCategories ?? [],
  candidateSearchIntent: pack.candidateSearchIntent,
  saturationKeywords:   pack.saturationKeywords,
  inventorySnapshot:    inv,
  inventorySampleSize:  inventorySample.length,
  saturationCheck,
  saturationFlaggedCount: flaggedCount,
  dilemmasEN:           pack.dilemmasEN,
  dilemmasIT:           pack.dilemmasIT,
  suggestedWorkflow:    pack.suggestedWorkflow,
  internalRefs:         pack.internalRefs ?? [],
  notes: {
    nextSteps: [
      'Editorial review of each dilemma against the listed guardrails (mandatory).',
      'If admin_draft workflow: open /admin → Dynamic Dilemmas → create draft per dilemma (no AI call).',
      'If seed_batch workflow: add seeds to lib/content-seed-packs.ts in a separate PR, do not skip review.',
      'No auto-publish. Each dilemma must be admin-approved before reaching public routes.',
    ],
    safety: [
      'This pack is read-only output. No DB or Redis writes were performed.',
      'No AI generation occurred during pack creation.',
      'PM must review guardrails before any seed batch / admin draft uses these texts.',
    ],
  },
}

fs.writeFileSync(outJson, JSON.stringify(jsonReport, null, 2))

// ── Markdown ─────────────────────────────────────────────────────────────────

function mdEscape(s) { return String(s ?? '').replace(/\|/g, '\\|') }

const md = []
md.push(`# Opportunity Pack — ${pack.title}`)
md.push('')
md.push(`**Slug:** \`${pack.slug}\`  |  **Date:** ${pack.date}  |  **Risk:** ${pack.riskLevel.toUpperCase()}  |  **Trend origin:** ${pack.trendOrigin}`)
md.push(`**Redis mode:** ${REDIS_OK ? 'connected (inventory cross-check active)' : 'static-only (no inventory cross-check)'}`)
md.push('')
md.push('> **Read-only output.** No DB writes, no AI calls, no auto-publish. Editorial review required before any seed/admin-draft action.')
md.push('')
md.push('## 1. Editorial summary')
md.push('')
md.push(pack.summary)
md.push('')
md.push('## 2. Sources used')
md.push('')
for (const s of pack.sources) {
  md.push(`- [${mdEscape(s.title)}](${s.url})${s.publisher ? ` — _${mdEscape(s.publisher)}_` : ''}`)
}
md.push('')
md.push('## 3. Risk level & flags')
md.push('')
md.push(`- **Level:** ${pack.riskLevel}`)
if (pack.riskFlags.length > 0) {
  md.push(`- **Flags:** ${pack.riskFlags.map(f => `\`${f}\``).join(', ')}`)
}
md.push('')
md.push('## 4. Guardrails (must be carried into admin review)')
md.push('')
for (const g of pack.guardrails) md.push(`- ${g}`)
md.push('')
md.push('## 5. Duplicate / saturation check')
md.push('')
md.push(`Inventory cross-checked against \`dynamic:scenarios\` (${inv.approvedTotal}) and \`dynamic:drafts\` (${inv.draftsTotal}).`)
md.push(`Saturation keywords used: ${pack.saturationKeywords.map(k => `\`${k}\``).join(', ')}.`)
md.push(`Matches found in inventory: **${inventorySample.length}** (approved: ${inv.approvedKeywordHits}, drafts: ${inv.draftKeywordHits}).`)
md.push(`Proposals flagged as too similar (Jaccard ≥ ${Math.round(SAT_THRESH * 100)}%): **${flaggedCount} / ${pack.dilemmasEN.length + pack.dilemmasIT.length}**.`)
md.push('')
if (saturationCheck.some(s => s.topMatches.length > 0)) {
  md.push('### Top near-matches per proposal')
  md.push('')
  md.push('| Locale | Proposal | Top match (id) | Similarity |')
  md.push('|---|---|---|---|')
  for (const s of saturationCheck) {
    if (s.topMatches.length === 0) continue
    const t = s.topMatches[0]
    md.push(`| ${s.locale.toUpperCase()} | ${mdEscape(s.proposalQ.slice(0, 60))}… | \`${t.id}\` (${t.status}) | ${t.similarity}%${s.flagged ? ' ⚠' : ''} |`)
  }
  md.push('')
} else {
  md.push('_No near-matches found — no overlap with approved/draft inventory on the supplied keywords._')
  md.push('')
}
md.push('## 6. Candidate category & search intent')
md.push('')
md.push(`- **Primary category:** \`${pack.candidateCategory}\``)
if ((pack.alternateCategories ?? []).length > 0) {
  md.push(`- **Alternates:** ${pack.alternateCategories.map(c => `\`${c}\``).join(', ')}`)
}
md.push(`- **Search intent:** ${pack.candidateSearchIntent}`)
md.push('')
md.push('## 7. Proposed dilemmas — EN')
md.push('')
md.push('| # | id | category | emoji | question |')
md.push('|---|---|---|---|---|')
for (const [i, d] of pack.dilemmasEN.entries()) {
  md.push(`| ${i + 1} | \`${d.id}\` | ${d.category} | ${d.emoji} | ${mdEscape(d.question)} |`)
}
md.push('')
md.push('### EN options')
md.push('')
for (const d of pack.dilemmasEN) {
  md.push(`- **\`${d.id}\`**`)
  md.push(`  - A: ${mdEscape(d.optionA)}`)
  md.push(`  - B: ${mdEscape(d.optionB)}`)
}
md.push('')
md.push('## 8. Proposed dilemmas — IT')
md.push('')
md.push('| # | id | category | emoji | question |')
md.push('|---|---|---|---|---|')
for (const [i, d] of pack.dilemmasIT.entries()) {
  md.push(`| ${i + 1} | \`${d.id}\` | ${d.category} | ${d.emoji} | ${mdEscape(d.question)} |`)
}
md.push('')
md.push('### IT options')
md.push('')
for (const d of pack.dilemmasIT) {
  md.push(`- **\`${d.id}\`**`)
  md.push(`  - A: ${mdEscape(d.optionA)}`)
  md.push(`  - B: ${mdEscape(d.optionB)}`)
}
md.push('')
md.push('## 9. Suggested workflow')
md.push('')
md.push(`- **Primary:** \`${pack.suggestedWorkflow.primary}\``)
if ((pack.suggestedWorkflow.alternates ?? []).length > 0) {
  md.push(`- **Alternates:** ${pack.suggestedWorkflow.alternates.map(a => `\`${a}\``).join(', ')}`)
}
if (pack.suggestedWorkflow.notes) {
  md.push('')
  md.push(pack.suggestedWorkflow.notes)
}
md.push('')
md.push('### Workflow options reference')
md.push('')
md.push('- `admin_draft` — paste into `/admin → Dynamic Dilemmas` as manual drafts (no AI). Best for high-risk topics.')
md.push('- `seed_batch` — add seeds to `lib/content-seed-packs.ts` for AI generation. Requires PM-approved seed PR; quality gates apply.')
md.push('- `static` — promote to `lib/scenarios.ts` after editorial review. Evergreen content only.')
md.push('- `blog` — commission a blog article in `lib/blog.ts` referencing one or more dilemmas.')
md.push('- `landing` — build an SEO landing page (`/<slug>` + `/it/<slug>`).')
md.push('')
md.push('## 10. Internal references')
md.push('')
if ((pack.internalRefs ?? []).length > 0) {
  for (const r of pack.internalRefs) md.push(`- ${r}`)
} else {
  md.push('_None provided._')
}
md.push('')
md.push('---')
md.push('')
md.push('## Pre-action checklist')
md.push('')
md.push('- [ ] Editorial review confirmed each dilemma respects the guardrails above')
md.push('- [ ] No proposal flagged by saturation check, or PM has explicitly approved overlap')
md.push('- [ ] Suggested workflow agreed with PM')
md.push('- [ ] EN/IT parity confirmed')
md.push('- [ ] No auto-publish path enabled (all dilemmas land as draft → admin approval)')
md.push('')
md.push(`*Generated by \`scripts/generate-opportunity-pack.mjs\` — SAFE_AUTONOMOUS, read-only.*`)

fs.writeFileSync(outMd, md.join('\n'))

// ── Summary ──────────────────────────────────────────────────────────────────

console.log('')
console.log(`  Inventory matches on saturation keywords: ${inventorySample.length}`)
console.log(`  Proposals flagged (≥ ${Math.round(SAT_THRESH * 100)}%):           ${flaggedCount}/${pack.dilemmasEN.length + pack.dilemmasIT.length}`)
console.log(`  Suggested workflow:                       ${pack.suggestedWorkflow.primary}`)
console.log('')
console.log(`  JSON → content-output/${baseName}.json`)
console.log(`  MD  → content-output/${baseName}.md`)
console.log('')
