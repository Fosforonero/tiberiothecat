// ── Companion species definitions ────────────────────────────────
export type CompanionSpecies = 'spark' | 'blip' | 'momo' | 'shade' | 'orbit'

export interface CompanionDef {
  id: CompanionSpecies
  name: string
  description: string
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  unlockCondition: string
  // Emoji per stage 1-5
  stageEmoji: [string, string, string, string, string]
  color: string
}

export const COMPANIONS: CompanionDef[] = [
  {
    id: 'spark',
    name: 'Spark',
    description: 'A curious little energy being who loves bold choices.',
    rarity: 'common',
    unlockCondition: 'Available to all users',
    stageEmoji: ['⚡', '⚡', '🌟', '💫', '✨'],
    color: 'text-yellow-400',
  },
  {
    id: 'blip',
    name: 'Blip',
    description: 'A glitchy digital creature that feeds on data and dilemmas.',
    rarity: 'common',
    unlockCondition: 'Available to all users',
    stageEmoji: ['🔮', '🔮', '💎', '🌀', '🌐'],
    color: 'text-purple-400',
  },
  {
    id: 'momo',
    name: 'Momo',
    description: 'A cheerful forest spirit who weighs every decision carefully.',
    rarity: 'rare',
    unlockCondition: 'Earn the 10 Votes badge',
    stageEmoji: ['🍄', '🍄', '🌿', '🌲', '🌳'],
    color: 'text-green-400',
  },
  {
    id: 'shade',
    name: 'Shade',
    description: 'A mysterious lunar entity who thrives in moral ambiguity.',
    rarity: 'epic',
    unlockCondition: 'Maintain a 7-day streak',
    stageEmoji: ['🌑', '🌒', '🌓', '🌔', '🌕'],
    color: 'text-blue-400',
  },
  {
    id: 'orbit',
    name: 'Orbit',
    description: 'A cosmic wanderer who has seen every dilemma in the universe.',
    rarity: 'legendary',
    unlockCondition: 'Reach 100 votes',
    stageEmoji: ['🪐', '🪐', '🌌', '☄️', '🌠'],
    color: 'text-orange-400',
  },
]

export const COMPANION_MAP: Record<CompanionSpecies, CompanionDef> = Object.fromEntries(
  COMPANIONS.map(c => [c.id, c])
) as Record<CompanionSpecies, CompanionDef>

// Stage thresholds (based on votes_count)
export function getCompanionStage(votesCount: number): 1 | 2 | 3 | 4 | 5 {
  if (votesCount >= 500) return 5
  if (votesCount >= 100) return 4
  if (votesCount >= 50)  return 3
  if (votesCount >= 10)  return 2
  return 1
}

export const STAGE_LABELS: Record<number, string> = {
  1: 'Hatchling',
  2: 'Fledgling',
  3: 'Explorer',
  4: 'Champion',
  5: 'Legendary',
}

export const STAGE_THRESHOLDS = [0, 10, 50, 100, 500]

/** Returns votes needed to reach the next stage, or 0 if at max. */
export function votesToNextStage(votesCount: number): number {
  const stage = getCompanionStage(votesCount)
  if (stage === 5) return 0
  return STAGE_THRESHOLDS[stage] - votesCount
}

export const RARITY_STYLES: Record<string, string> = {
  common:    'border-slate-500/40 bg-slate-500/10 text-slate-300',
  rare:      'border-blue-500/40  bg-blue-500/10  text-blue-300',
  epic:      'border-purple-500/40 bg-purple-500/10 text-purple-300',
  legendary: 'border-yellow-500/40 bg-yellow-500/10 text-yellow-300',
}
