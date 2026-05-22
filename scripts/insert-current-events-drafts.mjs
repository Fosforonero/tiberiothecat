#!/usr/bin/env node
/**
 * Insert manually authored current-events dilemmas into dynamic:drafts.
 *
 * SAFE DEFAULT: dry-run. Pass --write to mutate Redis.
 *
 * Source of truth is an input JSON under scripts/current-events-drafts-input/.
 * Public approval still happens through the admin UI; this script never writes
 * dynamic:scenarios and never auto-publishes.
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { Redis } from '@upstash/redis'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')

const inputArg = process.argv.find(arg => arg.endsWith('.json'))
const shouldWrite = process.argv.includes('--write')
const envFileArg = process.argv.find(arg => arg.startsWith('--env-file='))

if (!inputArg) {
  console.error('Usage: node scripts/insert-current-events-drafts.mjs <input.json> [--write]')
  process.exit(2)
}

const inputPath = path.isAbsolute(inputArg) ? inputArg : path.join(ROOT, inputArg)
if (!fs.existsSync(inputPath)) {
  console.error(`Input file not found: ${inputPath}`)
  process.exit(2)
}

function loadEnvFile() {
  try {
    const envPath = envFileArg
      ? path.resolve(ROOT, envFileArg.slice('--env-file='.length))
      : path.join(ROOT, '.env.local')
    const content = fs.readFileSync(envPath, 'utf8')
    for (const line of content.split('\n')) {
      const t = line.trim()
      if (!t || t.startsWith('#')) continue
      const eq = t.indexOf('=')
      if (eq === -1) continue
      const key = t.slice(0, eq).trim()
      const val = t.slice(eq + 1).trim().replace(/^["']|["']$/g, '')
      if (!process.env[key]) process.env[key] = val
    }
  } catch {
    // .env.local absent
  }
}

loadEnvFile()

const UPSTASH_URL = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL ?? ''
const UPSTASH_TOKEN = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN ?? ''
const REDIS_OK = Boolean(UPSTASH_URL && UPSTASH_TOKEN)
const redis = REDIS_OK ? new Redis({ url: UPSTASH_URL, token: UPSTASH_TOKEN }) : null
const DRAFTS_KEY = 'dynamic:drafts'
const APPROVED_KEY = 'dynamic:scenarios'
const MAX_DRAFTS = 120

const VALID_CATEGORIES = new Set([
  'morality',
  'survival',
  'loyalty',
  'justice',
  'freedom',
  'technology',
  'society',
  'relationships',
  'lifestyle',
])

function fail(message) {
  console.error(message)
  process.exit(2)
}

async function redisGet(key) {
  if (!REDIS_OK) return null
  const raw = await redis.get(key)
  // Be forgiving: an earlier REST-based version could double-encode arrays.
  let value = raw
  for (let i = 0; i < 2 && typeof value === 'string'; i++) {
    try {
      value = JSON.parse(value)
    } catch {
      break
    }
  }
  return value
}

async function redisSet(key, value) {
  if (!REDIS_OK) throw new Error('Redis credentials missing')
  return redis.set(key, value)
}

function validateDraft(draft, index) {
  const prefix = `drafts[${index}]`
  for (const field of ['id', 'locale', 'question', 'optionA', 'optionB', 'emoji', 'category', 'trend', 'trendUrl']) {
    if (typeof draft[field] !== 'string' || draft[field].trim().length === 0) {
      fail(`${prefix}.${field} must be a non-empty string`)
    }
  }
  if (!['en', 'it'].includes(draft.locale)) fail(`${prefix}.locale must be en|it`)
  if (!VALID_CATEGORIES.has(draft.category)) fail(`${prefix}.category is invalid: ${draft.category}`)
  if (draft.question.length > 500) fail(`${prefix}.question exceeds 500 chars`)
  if (draft.optionA.length > 220) fail(`${prefix}.optionA exceeds 220 chars`)
  if (draft.optionB.length > 220) fail(`${prefix}.optionB exceeds 220 chars`)
  if (draft.seoTitle && draft.seoTitle.length > 90) fail(`${prefix}.seoTitle exceeds 90 chars`)
  if (draft.seoDescription && draft.seoDescription.length > 190) fail(`${prefix}.seoDescription exceeds 190 chars`)
  if (!Array.isArray(draft.keywords) || draft.keywords.length === 0) fail(`${prefix}.keywords must be a non-empty array`)
}

function scoreDraft(draft) {
  const batchDateToken = String(input.date ?? '')
    .replace(/[^0-9]/g, '')
  const currentEventsBoost = batchDateToken && draft.id.includes(`news-${batchDateToken}`) ? 8 : 0
  const seoScore = Math.min(90, 68 + currentEventsBoost + Math.min(8, draft.keywords.length))
  const viralScore = draft.category === 'technology' ? 78 : draft.category === 'society' ? 75 : 72
  const noveltyScore = 76
  const feedbackScore = 50
  const finalScore = Math.round(viralScore * 0.35 + seoScore * 0.25 + noveltyScore * 0.25 + feedbackScore * 0.15)
  return { viralScore, seoScore, noveltyScore, feedbackScore, finalScore }
}

const input = JSON.parse(fs.readFileSync(inputPath, 'utf8'))
if (!Array.isArray(input.drafts) || input.drafts.length === 0) fail('input.drafts must be a non-empty array')
input.drafts.forEach(validateDraft)

console.log(`\nSplitVote current-events draft inserter`)
console.log(`batch: ${input.batchId ?? path.basename(inputPath)}`)
console.log(`mode: ${shouldWrite ? 'WRITE dynamic:drafts' : 'DRY RUN only'}`)
console.log(`redis: ${REDIS_OK ? 'configured' : 'missing credentials'}`)

if (!REDIS_OK) fail('Redis credentials missing. Aborting.')

const [existingDraftsRaw, approvedRaw] = await Promise.all([
  redisGet(DRAFTS_KEY),
  redisGet(APPROVED_KEY),
])

const existingDrafts = Array.isArray(existingDraftsRaw) ? existingDraftsRaw : []
const approved = Array.isArray(approvedRaw) ? approvedRaw : []
const existingIds = new Set([...existingDrafts, ...approved].map(item => item.id))

const generatedAt = new Date().toISOString()
const prepared = input.drafts
  .filter(draft => !existingIds.has(draft.id))
  .map(draft => ({
    id: draft.id,
    question: draft.question,
    optionA: draft.optionA,
    optionB: draft.optionB,
    emoji: draft.emoji,
    category: draft.category,
    generatedAt,
    trend: draft.trend,
    locale: draft.locale,
    status: 'draft',
    trendSource: 'rss',
    trendUrl: draft.trendUrl,
    seoTitle: draft.seoTitle,
    seoDescription: draft.seoDescription,
    keywords: draft.keywords,
    scores: scoreDraft(draft),
    generatedBy: 'admin',
    dilemmaStyle: 'moral',
  }))

const skipped = input.drafts.length - prepared.length
console.log(`existing drafts: ${existingDrafts.length}`)
console.log(`approved: ${approved.length}`)
console.log(`input drafts: ${input.drafts.length}`)
console.log(`new drafts: ${prepared.length}`)
console.log(`skipped existing ids: ${skipped}`)

for (const draft of prepared) {
  console.log(`  + ${draft.locale.toUpperCase()} ${draft.id} [${draft.category}] final:${draft.scores.finalScore}`)
}

if (!shouldWrite) {
  console.log('\nDry run complete. Re-run with --write to insert into dynamic:drafts.')
  process.exit(0)
}

const merged = [...prepared, ...existingDrafts]
  .slice(0, MAX_DRAFTS)
  .sort((a, b) => (b.scores?.finalScore ?? 0) - (a.scores?.finalScore ?? 0))

await redisSet(DRAFTS_KEY, merged)
console.log(`\nInserted ${prepared.length} new draft(s). dynamic:drafts now has ${merged.length} item(s).`)
