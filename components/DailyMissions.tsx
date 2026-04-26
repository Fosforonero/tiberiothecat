'use client'

import { useEffect, useState } from 'react'
import { MISSIONS, getLevelInfo, type MissionId } from '@/lib/missions'

interface Props {
  userId: string
  xp: number
  streakDays: number
  votesToday?: number
}

export default function DailyMissions({ userId, xp, streakDays, votesToday = 0 }: Props) {
  const [completed, setCompleted] = useState<Set<MissionId>>(new Set())
  const [loading, setLoading] = useState(true)
  const [completing, setCompleting] = useState<MissionId | null>(null)

  const levelInfo = getLevelInfo(xp)

  useEffect(() => {
    // Fetch today's completed missions from the API
    fetch('/api/missions')
      .then(r => r.json())
      .then(data => {
        if (data.completed) setCompleted(new Set(data.completed))
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [userId])

  async function completeMission(id: MissionId) {
    if (completed.has(id) || completing) return
    setCompleting(id)
    try {
      const res = await fetch('/api/missions/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ missionId: id }),
      })
      if (res.ok) {
        setCompleted(prev => new Set([...prev, id]))
      }
    } catch { /* non-blocking */ }
    finally { setCompleting(null) }
  }

  const totalXpAvailable = MISSIONS.reduce((s, m) => s + (completed.has(m.id) ? 0 : m.xp), 0)
  const completedCount = completed.size

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[#0d0d1a]/60 p-5 mb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-sm font-black uppercase tracking-widest text-[var(--muted)]">
          Today&apos;s Missions
        </h2>
        <span className="text-xs text-[var(--muted)]">
          {completedCount}/{MISSIONS.length} done
        </span>
      </div>

      {/* XP bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-xs mb-1">
          <span className={`font-bold ${levelInfo.color}`}>
            Lv.{levelInfo.level} {levelInfo.title}
          </span>
          <span className="text-[var(--muted)]">
            {levelInfo.xpIntoLevel} / {levelInfo.xpNeeded} XP
          </span>
        </div>
        <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-700"
            style={{ width: `${levelInfo.progressPct}%` }}
          />
        </div>
      </div>

      {/* Streak */}
      {streakDays > 0 && (
        <div className="flex items-center gap-2 mb-4 text-sm">
          <span className="text-orange-400">🔥</span>
          <span className="font-bold text-orange-400">{streakDays}-day streak</span>
          <span className="text-[var(--muted)] text-xs">— keep voting daily!</span>
        </div>
      )}

      {/* Missions list */}
      {loading ? (
        <div className="space-y-2">
          {MISSIONS.map(m => (
            <div key={m.id} className="h-12 rounded-xl bg-white/3 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {MISSIONS.map(m => {
            const done = completed.has(m.id)
            const isCompleting = completing === m.id

            // Auto-detect mission progress for vote-based missions
            const autoProgress = (() => {
              if (m.id === 'vote_3') return `${Math.min(votesToday, 3)}/3 votes`
              return null
            })()

            return (
              <button
                key={m.id}
                onClick={() => !done && completeMission(m.id)}
                disabled={done || isCompleting}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border text-left transition-all ${
                  done
                    ? 'border-green-500/30 bg-green-500/10 opacity-75 cursor-default'
                    : 'border-[var(--border)] bg-[#0a0a1a]/40 hover:border-blue-500/30 hover:bg-blue-500/5 cursor-pointer'
                }`}
              >
                <span className="text-xl flex-shrink-0">{done ? '✅' : m.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-bold ${done ? 'text-green-400 line-through' : 'text-white'}`}>
                    {m.title}
                  </p>
                  {!done && autoProgress && (
                    <p className="text-[10px] text-[var(--muted)]">{autoProgress}</p>
                  )}
                </div>
                <span className={`text-xs font-bold flex-shrink-0 ${done ? 'text-green-400' : 'text-yellow-400'}`}>
                  {isCompleting ? '…' : `+${m.xp} XP`}
                </span>
              </button>
            )
          })}
        </div>
      )}

      {totalXpAvailable > 0 && !loading && (
        <p className="text-xs text-[var(--muted)] text-center mt-3">
          Complete all missions to earn <span className="text-yellow-400 font-bold">+{totalXpAvailable} XP</span>
        </p>
      )}
      {totalXpAvailable === 0 && !loading && (
        <p className="text-xs text-green-400 text-center mt-3 font-bold">
          🎉 All missions complete for today!
        </p>
      )}
    </div>
  )
}
