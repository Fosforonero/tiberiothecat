'use client'

import { useEffect, useState } from 'react'

const CACHE_KEY = 'sv_claim_check'
const TTL_MS = 5 * 60 * 1000

interface CacheEntry {
  hasClaimable: boolean
  ts: number
}

function readCache(): boolean | null {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const entry: CacheEntry = JSON.parse(raw)
    if (Date.now() - entry.ts > TTL_MS) {
      sessionStorage.removeItem(CACHE_KEY)
      return null
    }
    return entry.hasClaimable
  } catch {
    return null
  }
}

function writeCache(hasClaimable: boolean): void {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ hasClaimable, ts: Date.now() }))
  } catch {}
}

export function invalidateClaimCache(): void {
  try {
    sessionStorage.removeItem(CACHE_KEY)
  } catch {}
}

export default function ClaimDot() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    let cancelled = false
    let retryTimer: ReturnType<typeof setTimeout> | null = null

    const check = () => {
      const cached = readCache()
      if (cached !== null) {
        if (!cancelled) setShow(cached)
        return
      }
      fetch('/api/missions')
        .then(r => (r.ok ? r.json() : null))
        .then((data: { missions?: Array<{ claimable: boolean }> } | null) => {
          if (cancelled || !data) return
          const hasClaimable =
            Array.isArray(data.missions) && data.missions.some(m => m.claimable)
          writeCache(hasClaimable)
          setShow(hasClaimable)
        })
        .catch(() => {})
    }

    check()

    // Re-check after a claim succeeds (dispatched by DailyMissions)
    const onClaimed = () => {
      invalidateClaimCache()
      retryTimer = setTimeout(check, 500)
    }
    window.addEventListener('sv:missions-claimed', onClaimed)

    return () => {
      cancelled = true
      if (retryTimer) clearTimeout(retryTimer)
      window.removeEventListener('sv:missions-claimed', onClaimed)
    }
  }, [])

  if (!show) return null

  return (
    <span
      aria-label="Missions ready to claim"
      className="inline-block w-2 h-2 rounded-full bg-orange-400 ring-1 ring-orange-400/50 flex-shrink-0"
    />
  )
}
