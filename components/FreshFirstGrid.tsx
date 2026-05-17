'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { getServerVotedIds } from '@/lib/client-voted-ids'

/**
 * FreshFirstGrid — re-orders its children client-side so dilemmas the
 * viewer hasn't voted yet appear first. Used on ISR-cached list pages
 * (trending, category) where the server can't render personalised order
 * without defeating caching.
 *
 * How it works: applies CSS `order` on each grid item. Order is a
 * CSS-only reflow — no React re-render of children — so the visual
 * shuffle is one paint and content stays in place. During SSR every
 * child has order=0 (input order); on hydration `order` is updated
 * once cookies and the cross-device `/api/me/voted-ids` resolve.
 *
 * For `force-dynamic` pages prefer the server-side `freshFirst()`
 * helper in lib/voted-ids.ts — no client flash, no extra request.
 */

interface Item {
  id: string
  node: ReactNode
}

interface Props {
  items: Item[]
  /** Tailwind classes for the grid container (must be flex or grid). */
  className?: string
}

function readCookieVotedIds(): Set<string> {
  const ids = new Set<string>()
  if (typeof document === 'undefined') return ids
  for (const c of document.cookie.split('; ')) {
    const eq = c.indexOf('=')
    const name = eq === -1 ? c : c.slice(0, eq)
    if (name.startsWith('sv_voted_')) ids.add(name.slice('sv_voted_'.length))
  }
  return ids
}

export default function FreshFirstGrid({ items, className = '' }: Props) {
  const [votedIds, setVotedIds] = useState<Set<string>>(() => new Set())

  useEffect(() => {
    // Fast path — cookies are synchronous, paint immediately
    const cookieIds = readCookieVotedIds()
    if (cookieIds.size > 0) setVotedIds(cookieIds)

    // Cross-device merge for logged-in users (deduped via shared promise)
    let cancelled = false
    getServerVotedIds().then((serverIds) => {
      if (cancelled) return
      if (serverIds.size === 0 && cookieIds.size === 0) return
      setVotedIds(new Set([...cookieIds, ...serverIds]))
    })
    return () => { cancelled = true }
  }, [])

  return (
    <div className={className}>
      {items.map(({ id, node }) => (
        <div key={id} style={{ order: votedIds.has(id) ? 1 : 0 }}>
          {node}
        </div>
      ))}
    </div>
  )
}
