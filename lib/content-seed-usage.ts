import { redis } from '@/lib/redis'
import { CONTENT_SEED_USAGE_REDIS_KEY } from '@/lib/content-seed-packs'

export interface SeedUsageRecord {
  generatedCount: number
  savedDraftCount: number
  dryRunCount: number
  rejectedCount: number
  lastUsedAt: string
  lastStatus: string
}

export type SeedUsageMap = Record<string, SeedUsageRecord>

export async function loadSeedUsageMap(): Promise<SeedUsageMap> {
  try {
    return (await redis.get<SeedUsageMap>(CONTENT_SEED_USAGE_REDIS_KEY)) ?? {}
  } catch {
    return {}
  }
}

export function batchUpdateSeedUsage(
  updates: Array<{ seedId: string; status: string }>,
  existingMap: SeedUsageMap,
): SeedUsageMap {
  const next = { ...existingMap }
  const now = new Date().toISOString()
  for (const { seedId, status } of updates) {
    const prev = next[seedId] ?? {
      generatedCount: 0, savedDraftCount: 0, dryRunCount: 0,
      rejectedCount: 0, lastUsedAt: now, lastStatus: status,
    }
    next[seedId] = {
      generatedCount:  prev.generatedCount + 1,
      savedDraftCount: prev.savedDraftCount + (status === 'saved' || status === 'auto_published' ? 1 : 0),
      dryRunCount:     prev.dryRunCount     + (status === 'dry_run' ? 1 : 0),
      rejectedCount:   prev.rejectedCount   + (status === 'skipped_novelty' || status === 'skipped_preflight' || status === 'error' ? 1 : 0),
      lastUsedAt:      now,
      lastStatus:      status,
    }
  }
  return next
}

export async function saveSeedUsageMap(map: SeedUsageMap): Promise<void> {
  try {
    await redis.set(CONTENT_SEED_USAGE_REDIS_KEY, map)
  } catch {
    // fail-open — usage tracking is best-effort
  }
}
