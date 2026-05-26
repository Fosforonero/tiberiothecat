'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { getServerVotedIds } from '@/lib/client-voted-ids'

const LS_KEY = 'splitvote_voted_ids'

/**
 * Reads voted state for one scenario id from 3 sources (in order):
 *   1. cookie `sv_voted_${id}=` (per-device fast path — set on vote)
 *   2. localStorage `splitvote_voted_ids` array (PM-requested in HANDOFF)
 *   3. /api/me/voted-ids (cross-device for logged-in users)
 *
 * Renders nothing during SSR. After hydration, if voted, shows a small
 * "YOU VOTED" tag + the option letter (when available from localStorage).
 */
interface Props {
  scenarioId:   string
  resultsHref:  string
  locale:       'en' | 'it'
  youVotedCopy: string
}

interface LSEntry {
  id:     string
  option: 'a' | 'b'
}

function readLocalStorage(): LSEntry[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(LS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (e): e is LSEntry => e && typeof e === 'object' && typeof e.id === 'string' && (e.option === 'a' || e.option === 'b'),
    )
  } catch {
    return []
  }
}

function hasCookieVote(id: string): boolean {
  if (typeof document === 'undefined') return false
  return document.cookie.includes(`sv_voted_${id}=`)
}

export default function CatalogCardVoted({ scenarioId, resultsHref, youVotedCopy }: Props) {
  const [option, setOption] = useState<'a' | 'b' | null>(null)
  const [isVoted, setIsVoted] = useState(false)

  useEffect(() => {
    // Local sources — synchronous, paint immediately.
    const ls = readLocalStorage().find(e => e.id === scenarioId)
    if (ls) {
      setIsVoted(true)
      setOption(ls.option)
      return
    }
    if (hasCookieVote(scenarioId)) {
      setIsVoted(true)
      // No option info from cookie alone; the badge still shows "YOU VOTED".
      return
    }
    // Async cross-device fallback for logged-in users.
    getServerVotedIds().then(ids => {
      if (ids.has(scenarioId)) setIsVoted(true)
    })
  }, [scenarioId])

  if (!isVoted) return null

  return (
    <Link
      href={resultsHref}
      className="ml-auto inline-flex items-center gap-1 text-[9.5px] tracking-[0.12em] text-[var(--neon-blue)] hover:underline"
      aria-label={youVotedCopy}
    >
      <span aria-hidden="true">✓</span>
      <span>{youVotedCopy}</span>
      {option && <span aria-hidden="true">{option.toUpperCase()}</span>}
    </Link>
  )
}
