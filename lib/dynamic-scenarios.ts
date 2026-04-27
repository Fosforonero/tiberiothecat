/**
 * Dynamic scenarios — stored in Upstash Redis, generated daily by the cron job.
 *
 * Two Redis keys:
 *   dynamic:scenarios  — approved/published (public-facing)
 *   dynamic:drafts     — generated but not yet reviewed by admin
 */

import { redis } from './redis'
import type { Scenario } from './scenarios'

const DYNAMIC_KEY = 'dynamic:scenarios'
const DRAFTS_KEY  = 'dynamic:drafts'
const MAX_DYNAMIC = 60
const MAX_DRAFTS  = 30

export type DilemmaStatus = 'draft' | 'approved' | 'rejected'
export type TrendSource   = 'google_trends' | 'reddit' | 'rss' | 'internal_feedback' | 'mixed' | 'openrouter'

export interface DilemmaScores {
  viralScore:    number  // 0-100
  seoScore:      number  // 0-100
  noveltyScore:  number  // 0-100
  feedbackScore: number  // 0-100 (starts at 50, updated as users rate)
  finalScore:    number  // weighted average
}

export interface DynamicScenario extends Scenario {
  generatedAt:        string          // ISO timestamp
  approvedAt?:        string          // ISO timestamp, set on approval
  trend:              string
  locale:             string
  status?:            DilemmaStatus
  trendSource?:       TrendSource
  trendUrl?:          string          // optional source URL
  seoTitle?:          string
  seoDescription?:    string
  keywords?:          string[]
  scores?:            DilemmaScores
  // Autopublish audit metadata — set when AUTO_PUBLISH_DILEMMAS=true
  autoPublished?:     boolean
  qualityGateScore?:  number
  qualityGateReasons?: string[]
  generatedBy?:       'cron' | 'admin' | 'seed_batch'
}

// ── Approved (public) scenarios ───────────────────────────────

export async function getDynamicScenarios(): Promise<DynamicScenario[]> {
  try {
    const raw = await redis.get<DynamicScenario[]>(DYNAMIC_KEY)
    if (!Array.isArray(raw)) return []
    return raw.map(s => ({ ...s, status: s.status ?? 'approved' }))
  } catch {
    return []
  }
}

export async function getDynamicScenariosByLocale(locale: string): Promise<DynamicScenario[]> {
  const all = await getDynamicScenarios()
  return all.filter(s => s.locale === locale)
}

export async function getDynamicScenario(id: string): Promise<DynamicScenario | undefined> {
  // Public consumers must only resolve approved scenarios.
  // Drafts are visible only through admin-specific APIs.
  const approved = await getDynamicScenarios()
  return approved.find(s => s.id === id)
}

export async function saveDynamicScenarios(newOnes: DynamicScenario[]): Promise<void> {
  const existing = await getDynamicScenarios()
  const existingIds = new Set(existing.map(s => s.id))
  const toAdd = newOnes
    .filter(s => !existingIds.has(s.id))
    .map(s => ({ ...s, status: 'approved' as DilemmaStatus }))
  const merged = [...toAdd, ...existing].slice(0, MAX_DYNAMIC)
  await redis.set(DYNAMIC_KEY, merged)
}

// ── Draft queue ───────────────────────────────────────────────

export async function getDraftScenarios(): Promise<DynamicScenario[]> {
  try {
    const raw = await redis.get<DynamicScenario[]>(DRAFTS_KEY)
    return Array.isArray(raw) ? raw : []
  } catch {
    return []
  }
}

export async function saveDraftScenarios(newOnes: DynamicScenario[]): Promise<void> {
  const existing = await getDraftScenarios()
  const existingIds = new Set(existing.map(s => s.id))
  const toAdd = newOnes
    .filter(s => !existingIds.has(s.id))
    .map(s => ({ ...s, status: 'draft' as DilemmaStatus }))
  // Sort by finalScore desc before saving
  const merged = [...toAdd, ...existing]
    .slice(0, MAX_DRAFTS)
    .sort((a, b) => (b.scores?.finalScore ?? 0) - (a.scores?.finalScore ?? 0))
  await redis.set(DRAFTS_KEY, merged)
}

export async function approveDraftScenario(id: string): Promise<boolean> {
  const drafts = await getDraftScenarios()
  const idx = drafts.findIndex(s => s.id === id)
  if (idx === -1) return false

  const scenario: DynamicScenario = {
    ...drafts[idx],
    status: 'approved',
    approvedAt: new Date().toISOString(),
  }
  const newDrafts = drafts.filter(s => s.id !== id)

  await Promise.all([
    redis.set(DRAFTS_KEY, newDrafts),
    saveDynamicScenarios([scenario]),
  ])
  return true
}

export async function rejectDraftScenario(id: string): Promise<boolean> {
  const drafts = await getDraftScenarios()
  if (!drafts.find(s => s.id === id)) return false
  await redis.set(DRAFTS_KEY, drafts.filter(s => s.id !== id))
  return true
}

// ── Feedback score update ────────────────────────────────────

/**
 * Update the feedbackScore of an approved scenario based on up/down ratings.
 * feedbackScore = (upvotes / total) * 100, clamped to [0,100].
 */
export async function updateFeedbackScore(
  id: string,
  upvotes: number,
  downvotes: number,
): Promise<void> {
  const scenarios = await getDynamicScenarios()
  const idx = scenarios.findIndex(s => s.id === id)
  if (idx === -1) return

  const total = upvotes + downvotes
  const feedbackScore = total > 0 ? Math.round((upvotes / total) * 100) : 50

  const s = scenarios[idx]
  const oldScores = s.scores
  if (oldScores) {
    const newFinalScore = computeFinalScore({ ...oldScores, feedbackScore })
    scenarios[idx] = {
      ...s,
      scores: { ...oldScores, feedbackScore, finalScore: newFinalScore },
    }
    await redis.set(DYNAMIC_KEY, scenarios)
  }
}

function computeFinalScore(scores: Omit<DilemmaScores, 'finalScore'>): number {
  return Math.round(
    scores.viralScore   * 0.35 +
    scores.seoScore     * 0.25 +
    scores.noveltyScore * 0.25 +
    scores.feedbackScore * 0.15
  )
}

// ── Semantic dedup ────────────────────────────────────────────

function tokenize(text: string): Set<string> {
  return new Set(text.toLowerCase().split(/\W+/).filter(w => w.length > 3))
}

function jaccardSimilarity(a: string, b: string): number {
  const sa = tokenize(a)
  const sb = tokenize(b)
  const intersection = [...sa].filter(x => sb.has(x)).length
  const union = new Set([...sa, ...sb]).size
  return union === 0 ? 0 : intersection / union
}

export function isSimilarToExisting(
  candidate: Pick<DynamicScenario, 'id' | 'question' | 'trend'>,
  existing: Pick<DynamicScenario, 'id' | 'question' | 'trend'>[],
  threshold = 0.4,
): boolean {
  if (existing.some(e => e.id === candidate.id)) return true
  return existing.some(e =>
    jaccardSimilarity(candidate.question, e.question) > threshold ||
    (candidate.trend && e.trend && jaccardSimilarity(candidate.trend, e.trend) > 0.6)
  )
}
