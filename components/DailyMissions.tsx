'use client'

import { useEffect, useState } from 'react'
import { getLevelInfo, type MissionId, type MissionState } from '@/lib/missions'

interface Props {
  userId: string
  xp: number
  streakDays: number
}

export default function DailyMissions({ userId, xp, streakDays }: Props) {
  const [missions, setMissions] = useState<MissionState[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [claiming, setClaiming] = useState<MissionId | null>(null)
  const [claimError, setClaimError] = useState<string | null>(null)

  const levelInfo = getLevelInfo(xp)

  useEffect(() => {
    fetch('/api/missions')
      .then(r => r.json())
      .then(data => { if (data.missions) setMissions(data.missions) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [userId])

  async function claimMission(id: MissionId) {
    if (claiming) return
    setClaiming(id)
    setClaimError(null)
    try {
      const res = await fetch('/api/missions/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ missionId: id }),
      })
      if (res.ok) {
        setMissions(prev =>
          prev?.map(m =>
            m.id === id
              ? { ...m, completed: true, claimable: false, progress: m.required }
              : m,
          ) ?? null,
        )
      } else {
        const data = await res.json().catch(() => ({}))
        setClaimError(data.reason ?? data.error ?? 'Claim failed')
      }
    } catch {
      setClaimError('Network error')
    } finally {
      setClaiming(null)
    }
  }

  const completedCount   = (missions ?? []).filter(m => m.completed).length
  const missionCount     = (missions ?? []).length
  const totalXpAvailable = (missions ?? []).reduce((s, m) => s + (!m.completed ? m.xp : 0), 0)

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[#0d0d1a]/60 p-5 mb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-sm font-black uppercase tracking-widest text-[var(--muted)]">
          Today&apos;s Missions
        </h2>
        <span className="text-xs text-[var(--muted)]">
          {completedCount}/{missionCount} done
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

      {/* Claim error */}
      {claimError && (
        <div
          role="alert"
          aria-live="assertive"
          className="text-red-400 text-xs bg-red-900/20 rounded p-2 border border-red-500/20 mb-3"
        >
          {claimError}
        </div>
      )}

      {/* Missions list */}
      {loading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 rounded-xl bg-white/3 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {(missions ?? []).map(m => {
            const isClaiming = claiming === m.id

            return (
              <div
                key={m.id}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all ${
                  m.completed
                    ? 'border-green-500/30 bg-green-500/10 opacity-75'
                    : m.comingSoon
                      ? 'border-white/5 bg-white/3 opacity-50'
                      : m.claimable
                        ? 'border-blue-500/40 bg-blue-500/5'
                        : 'border-[var(--border)] bg-[#0a0a1a]/40'
                }`}
              >
                <span className="text-xl flex-shrink-0">
                  {m.completed ? '✅' : m.comingSoon ? '🔒' : m.icon}
                </span>

                <div className="flex-1 min-w-0">
                  <p
                    className={`text-xs font-bold ${
                      m.completed
                        ? 'text-green-400 line-through'
                        : m.comingSoon
                          ? 'text-white/40'
                          : 'text-white'
                    }`}
                  >
                    {m.title}
                  </p>
                  {m.comingSoon ? (
                    <p className="text-[10px] text-white/25">Coming soon</p>
                  ) : !m.completed ? (
                    <p className="text-[10px] text-[var(--muted)]">
                      {m.progress}/{m.required}
                    </p>
                  ) : null}
                </div>

                {/* Right side: XP indicator or Claim button */}
                {m.completed ? (
                  <span className="text-xs font-bold flex-shrink-0 text-green-400">
                    +{m.xp} XP ✓
                  </span>
                ) : m.comingSoon ? (
                  <span className="text-xs flex-shrink-0 text-white/20">+{m.xp} XP</span>
                ) : m.claimable ? (
                  <button
                    onClick={() => claimMission(m.id)}
                    disabled={isClaiming || claiming !== null}
                    aria-busy={isClaiming}
                    className="flex-shrink-0 text-xs font-bold px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white transition-colors"
                  >
                    {isClaiming ? '…' : `+${m.xp} XP`}
                  </button>
                ) : (
                  <span className="text-xs font-bold flex-shrink-0 text-yellow-400/50">
                    {m.progress}/{m.required}
                  </span>
                )}
              </div>
            )
          })}
        </div>
      )}

      {!loading && missions !== null && (
        totalXpAvailable > 0
          ? (
            <p className="text-xs text-[var(--muted)] text-center mt-3">
              Complete missions to earn{' '}
              <span className="text-yellow-400 font-bold">+{totalXpAvailable} XP</span>
            </p>
          )
          : (
            <p className="text-xs text-green-400 text-center mt-3 font-bold">
              🎉 All missions complete for today!
            </p>
          )
      )}
    </div>
  )
}
