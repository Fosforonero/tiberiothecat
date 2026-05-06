/**
 * Manual seed exclusion/cooldown list.
 *
 * Seeds in this list are filtered out before AI generation calls so that
 * repeatedly-failing topics do not waste OpenRouter quota. Add entries here
 * when a seed consistently produces semantic duplicates or preflight blocks.
 *
 * status:
 *   'blocked'  — excluded indefinitely (no `until` required)
 *   'cooldown' — excluded until `until` ISO date (or indefinitely when absent)
 *
 * locale:
 *   'en' | 'it' — locale-specific exclusion
 *   'all'       — applies to all locales (default when omitted)
 */

export type SeedExclusionStatus = 'blocked' | 'cooldown'

export interface SeedExclusion {
  seedId:  string
  reason:  string
  locale?: 'en' | 'it' | 'all'
  until?:  string             // ISO date string; if absent, exclusion is indefinite
  status:  SeedExclusionStatus
}

export const SEED_EXCLUSIONS: SeedExclusion[] = [
  {
    seedId: 'know-when-or-how-you-die',
    reason: 'Repeatedly generated semantic duplicates in latest batch (×10); inventory already saturated with death/mortality variants',
    status: 'cooldown',
  },
  {
    seedId: 'loved-by-everyone-or-known-by-few',
    reason: 'Repeatedly generated semantic duplicates in latest batch (×10); too similar to existing fame/intimacy approved dilemmas',
    status: 'cooldown',
  },
  {
    seedId: 'never-lie-or-never-lied-to',
    reason: 'Repeatedly generated semantic duplicates in latest batch (×9); honesty/deception angle already covered by multiple approved scenarios',
    status: 'cooldown',
  },
]

/**
 * Returns whether a seed is currently excluded for the given locale.
 * Expired `until` dates are treated as no longer excluded.
 */
export function isSeedExcluded(
  seedId: string,
  locale: 'en' | 'it',
): { excluded: boolean; reason?: string; status?: SeedExclusionStatus } {
  const exclusion = SEED_EXCLUSIONS.find(e => e.seedId === seedId)
  if (!exclusion) return { excluded: false }

  // Locale-specific: only apply to matching locale
  if (exclusion.locale && exclusion.locale !== 'all' && exclusion.locale !== locale) {
    return { excluded: false }
  }
  // Time-limited: skip if past expiry
  if (exclusion.until && new Date(exclusion.until) < new Date()) {
    return { excluded: false }
  }
  return { excluded: true, reason: exclusion.reason, status: exclusion.status }
}
