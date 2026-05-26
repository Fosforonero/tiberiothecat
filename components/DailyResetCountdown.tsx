'use client'

import { useState, useEffect } from 'react'

/**
 * Live HH:MM:SS countdown to next UTC midnight. Used in the catalog
 * featured-row "Daily" card. SSR-friendly — renders placeholder until
 * first client tick.
 */
interface Props {
  prefix?: string
}

function formatRemaining(now: Date): string {
  const end = new Date(now)
  end.setUTCHours(24, 0, 0, 0)
  const diff = end.getTime() - now.getTime()
  const h = String(Math.floor(diff / 3600000)).padStart(2, '0')
  const m = String(Math.floor((diff % 3600000) / 60000)).padStart(2, '0')
  const s = String(Math.floor((diff % 60000) / 1000)).padStart(2, '0')
  return `${h}:${m}:${s}`
}

export default function DailyResetCountdown({ prefix }: Props) {
  const [time, setTime] = useState<string | null>(null)

  useEffect(() => {
    const tick = () => setTime(formatRemaining(new Date()))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <span className="text-[var(--muted)] font-medium">
      {prefix && <span>{prefix} </span>}
      <b className="text-[var(--neon-yellow)] font-semibold tabular-nums">{time ?? '--:--:--'}</b>
    </span>
  )
}
