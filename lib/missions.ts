// ── Mission definitions ──────────────────────────────────────────
export type MissionId =
  | 'vote_3'
  | 'vote_5'
  | 'vote_2_categories'
  | 'vote_3_categories'
  | 'challenge_friend'
  | 'share_result'
  | 'share_and_challenge'
  | 'daily_dilemma'

export interface Mission {
  id: MissionId
  title: string
  description: string
  xp: number
  icon: string
}

// Full mission pool — 7 rotatable + 1 permanent special (daily_dilemma)
export const MISSIONS: Mission[] = [
  {
    id: 'vote_3',
    title: 'Vote on 3 dilemmas',
    description: 'Cast your vote on 3 different dilemmas today',
    xp: 30,
    icon: '🗳️',
  },
  {
    id: 'vote_5',
    title: 'Vote on 5 dilemmas',
    description: 'Cast your vote on 5 different dilemmas today',
    xp: 45,
    icon: '🔥',
  },
  {
    id: 'vote_2_categories',
    title: 'Explore 2 categories',
    description: 'Vote in at least 2 different categories',
    xp: 25,
    icon: '🗂️',
  },
  {
    id: 'vote_3_categories',
    title: 'Explore 3 categories',
    description: 'Vote in at least 3 different categories today',
    xp: 40,
    icon: '🧭',
  },
  {
    id: 'challenge_friend',
    title: 'Challenge a friend',
    description: 'Copy and send a challenge link',
    xp: 20,
    icon: '⚡',
  },
  {
    id: 'share_result',
    title: 'Share a result',
    description: 'Share one of your results',
    xp: 15,
    icon: '📤',
  },
  {
    id: 'share_and_challenge',
    title: 'Share & challenge',
    description: 'Share a result AND send a challenge link today',
    xp: 35,
    icon: '🚀',
  },
  {
    id: 'daily_dilemma',
    title: 'Dilemma of the Day',
    description: "Vote on today's featured dilemma",
    xp: 50,
    icon: '🌟',
  },
]

// ── Daily rotation ─────────────────────────────────────────────────
// Special mission is always daily_dilemma (50 XP).
// 3 daily missions rotate through the other 7 in a 7-day cycle.
const SPECIAL_ID: MissionId = 'daily_dilemma'
const DAILY_POOL = MISSIONS.filter(m => m.id !== SPECIAL_ID)
const SPECIAL_MISSION = MISSIONS.find(m => m.id === SPECIAL_ID)!

/**
 * Returns today's daily mission set: 3 rotating missions + 1 permanent special.
 * Deterministic per UTC calendar day — all users see the same pool each day.
 */
export function getDailyMissions(): { daily: Mission[]; special: Mission } {
  const dayIndex = Math.floor(Date.now() / 86_400_000) // UTC day since epoch
  const n = DAILY_POOL.length // 7
  // Three consecutive modular indices — always unique since offsets 0,1,2 are distinct
  const daily = [0, 1, 2].map(offset => DAILY_POOL[(dayIndex + offset) % n])
  return { daily, special: SPECIAL_MISSION }
}

// ── Server-computed mission state (returned by GET /api/missions) ─
export interface MissionState extends Mission {
  progress: number
  required: number
  completed: boolean
  claimable: boolean
  comingSoon: boolean
  isSpecial?: boolean
}

// ── XP Levels ────────────────────────────────────────────────────
export interface Level {
  level: number
  title: string
  xpRequired: number
  color: string
}

export const LEVELS: Level[] = [
  { level: 1, title: 'New Voter',     xpRequired: 0,    color: 'text-slate-400'  },
  { level: 2, title: 'Debater',       xpRequired: 100,  color: 'text-blue-400'   },
  { level: 3, title: 'Philosopher',   xpRequired: 300,  color: 'text-purple-400' },
  { level: 4, title: 'Contrarian',    xpRequired: 600,  color: 'text-orange-400' },
  { level: 5, title: 'Moral Hacker',  xpRequired: 1000, color: 'text-red-400'    },
  { level: 6, title: 'Dilemma Master',xpRequired: 2000, color: 'text-yellow-400' },
]

export interface LevelInfo {
  level: number
  title: string
  color: string
  xpIntoLevel: number
  xpNeeded: number
  progressPct: number
}

export function getLevelInfo(xp: number): LevelInfo {
  let current = LEVELS[0]
  let next = LEVELS[1]

  for (let i = 0; i < LEVELS.length; i++) {
    if (xp >= LEVELS[i].xpRequired) {
      current = LEVELS[i]
      next = LEVELS[i + 1] ?? LEVELS[LEVELS.length - 1]
    } else {
      break
    }
  }

  const xpIntoLevel = xp - current.xpRequired
  const xpNeeded = next.xpRequired - current.xpRequired
  const progressPct = xpNeeded > 0 ? Math.min(100, Math.round((xpIntoLevel / xpNeeded) * 100)) : 100

  return {
    level: current.level,
    title: current.title,
    color: current.color,
    xpIntoLevel,
    xpNeeded,
    progressPct,
  }
}
