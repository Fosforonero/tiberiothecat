/**
 * lib/badges.ts — Streak milestone badge constants and UI helpers.
 *
 * Award logic lives in the Supabase DB function `increment_user_vote_count`
 * (migration_v14). This module provides constants for UI display and an
 * optional server-side award function for admin/maintenance use.
 *
 * Never call awardStreakMilestoneBadges from client code — it requires
 * the admin (service-role) client.
 */

import { createAdminClient } from '@/lib/supabase/admin'

export const STREAK_MILESTONES = [
  { days: 7,  badgeId: 'streak_7',  emoji: '📅', label: '7-Day Streak',  rarity: 'rare'      },
  { days: 15, badgeId: 'streak_15', emoji: '🗓️', label: '15-Day Streak', rarity: 'epic'      },
  { days: 30, badgeId: 'streak_30', emoji: '🏅', label: '30-Day Streak', rarity: 'legendary' },
] as const

export type StreakMilestoneBadgeId = 'streak_7' | 'streak_15' | 'streak_30'

/** Returns the milestones the user has reached given their current streak. */
export function getEarnedMilestones(streakDays: number) {
  return STREAK_MILESTONES.filter(m => streakDays >= m.days)
}

/**
 * Returns progress info toward the next unearned milestone.
 * Used to render streak progress bars in the dashboard.
 */
export function getStreakProgress(streakDays: number): {
  nextMilestone: typeof STREAK_MILESTONES[number] | null
  prevDays: number
  pct: number
  allEarned: boolean
} {
  const next = STREAK_MILESTONES.find(m => streakDays < m.days) ?? null
  if (!next) return { nextMilestone: null, prevDays: 30, pct: 100, allEarned: true }

  const prevIdx = STREAK_MILESTONES.indexOf(next) - 1
  const prevDays = prevIdx >= 0 ? STREAK_MILESTONES[prevIdx].days : 0
  const pct = Math.max(0, Math.round(((streakDays - prevDays) / (next.days - prevDays)) * 100))
  return { nextMilestone: next, prevDays, pct, allEarned: false }
}

/**
 * Server-side award helper (admin/service-role only).
 * Primary award path is the DB function `increment_user_vote_count`.
 * Use this for maintenance backfills or admin tooling only.
 *
 * Idempotent: ON CONFLICT DO NOTHING is handled by the unique(user_id, badge_id)
 * constraint in user_badges.
 */
export async function awardStreakMilestoneBadges(
  userId: string,
  streakDays: number,
): Promise<void> {
  const admin = createAdminClient()
  const eligible = STREAK_MILESTONES.filter(m => streakDays >= m.days)
  if (eligible.length === 0) return

  await admin
    .from('user_badges')
    .upsert(
      eligible.map(m => ({ user_id: userId, badge_id: m.badgeId })),
      { onConflict: 'user_id,badge_id', ignoreDuplicates: true },
    )
}
