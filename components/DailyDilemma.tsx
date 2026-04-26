'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { Scenario } from '@/lib/scenarios'

interface Props {
  scenario: Scenario
  totalVotes: number
}

function getMidnightCountdown(): string {
  const now = new Date()
  const midnight = new Date(now)
  midnight.setHours(24, 0, 0, 0)
  const diff = midnight.getTime() - now.getTime()
  const h = Math.floor(diff / 3_600_000)
  const m = Math.floor((diff % 3_600_000) / 60_000)
  const s = Math.floor((diff % 60_000) / 1_000)
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export default function DailyDilemma({ scenario, totalVotes }: Props) {
  const [countdown, setCountdown] = useState('')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    setCountdown(getMidnightCountdown())
    const interval = setInterval(() => {
      setCountdown(getMidnightCountdown())
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="mb-12 rounded-3xl border border-yellow-500/20 bg-gradient-to-br from-yellow-500/5 via-orange-500/5 to-red-500/5 overflow-hidden">
      {/* Header bar */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-yellow-500/10 bg-yellow-500/5">
        <div className="flex items-center gap-2">
          <span className="text-yellow-400 text-sm font-black uppercase tracking-widest">⚡ Dilemma of the Day</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-[var(--muted)]">
          <span>Resets in</span>
          <span className="font-mono font-bold text-yellow-400 tabular-nums">
            {mounted ? countdown : '--:--:--'}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-6">
        <div className="flex items-start gap-4">
          <span className="text-4xl flex-shrink-0 mt-1">{scenario.emoji}</span>
          <div className="flex-1 min-w-0">
            <p className="text-lg md:text-xl font-bold text-white leading-snug mb-3">
              {scenario.question}
            </p>
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-xs font-bold uppercase tracking-widest text-yellow-400/70 border border-yellow-500/20 rounded-full px-3 py-1">
                {scenario.category}
              </span>
              {totalVotes > 0 && (
                <span className="text-xs text-[var(--muted)]">
                  🌍 {totalVotes.toLocaleString()} votes today
                </span>
              )}
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-5 flex items-center gap-3">
          <Link
            href={`/play/${scenario.id}`}
            className="flex-1 flex items-center justify-center gap-2 bg-yellow-500 hover:bg-yellow-400 text-black font-black text-sm px-6 py-3 rounded-xl transition-colors"
          >
            Vote now →
          </Link>
          <Link
            href={`/results/${scenario.id}`}
            className="text-sm text-[var(--muted)] hover:text-white transition-colors px-4 py-3"
          >
            See results
          </Link>
        </div>
      </div>
    </div>
  )
}
