// ── Mission definitions ──────────────────────────────────────────
export type MissionId =
  | 'vote_3'
  | 'vote_2_categories'
  | 'challenge_friend'
  | 'share_result'
  | 'daily_dilemma'

export interface Mission {
  id: MissionId
  title: string
  description: string
  xp: number
  icon: string
}

export const MISSIONS: Mission[] = [
  {
    id: 'vote_3',
    title: 'Vote on 3 dilemmas',
    description: 'Cast your vote on 3 different dilemmas today',
    xp: 30,
    icon: '🗳️',
  },
  {
    id: 'vote_2_categories',
    title: 'Explore 2 categories',
    description: 'Vote in at least 2 different categories',
    xp: 25,
    icon: '🗂️',
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
    id: 'daily_dilemma',
    title: 'Dilemma of the Day',
    description: "Vote on today's featured dilemma",
    xp: 50,
    icon: '🌟',
  },
]

// ── Server-computed mission state (returned by GET /api/missions) ─
export interface MissionState extends Mission {
  progress: number
  required: number
  completed: boolean
  claimable: boolean
  comingSoon: boolean
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
