/**
 * Dynamic scenarios — stored in Upstash Redis, generated daily by the cron job.
 * These are shown alongside the static scenarios in lib/scenarios.ts.
 */

import { redis } from './redis'
import type { Scenario } from './scenarios'

const DYNAMIC_KEY = 'dynamic:scenarios'
const MAX_DYNAMIC = 60 // keep at most 60 AI-generated dilemmas (30 EN + 30 IT)

export interface DynamicScenario extends Scenario {
  generatedAt: string   // ISO timestamp
  trend:       string   // the trend that inspired it
  locale:      string   // 'en' | 'it'
  seoTitle?:       string  // <title> tag for the scenario page
  seoDescription?: string  // <meta description>
  keywords?:       string[] // SEO keywords
}

/**
 * Fetch all dynamic scenarios from Redis.
 */
export async function getDynamicScenarios(): Promise<DynamicScenario[]> {
  try {
    const raw = await redis.get<DynamicScenario[]>(DYNAMIC_KEY)
    return Array.isArray(raw) ? raw : []
  } catch {
    return []
  }
}

/**
 * Fetch dynamic scenarios filtered by locale.
 */
export async function getDynamicScenariosByLocale(locale: string): Promise<DynamicScenario[]> {
  const all = await getDynamicScenarios()
  return all.filter(s => s.locale === locale)
}

/**
 * Save new dynamic scenarios to Redis, prepending to existing list.
 * Automatically trims to MAX_DYNAMIC to avoid unbounded growth.
 */
export async function saveDynamicScenarios(newOnes: DynamicScenario[]): Promise<void> {
  const existing = await getDynamicScenarios()

  // Deduplicate by id
  const existingIds = new Set(existing.map((s) => s.id))
  const toAdd = newOnes.filter((s) => !existingIds.has(s.id))

  const merged = [...toAdd, ...existing].slice(0, MAX_DYNAMIC)
  await redis.set(DYNAMIC_KEY, merged)
}

/**
 * Get a single dynamic scenario by id.
 */
export async function getDynamicScenario(id: string): Promise<DynamicScenario | undefined> {
  const all = await getDynamicScenarios()
  return all.find((s) => s.id === id)
}
