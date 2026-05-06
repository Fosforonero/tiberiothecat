'use client'

import { useState, useEffect } from 'react'
import DilemmaCard, { type DilemmaCardBadge } from '@/components/DilemmaCard'
import type { Scenario } from '@/lib/scenarios'
import { getServerVotedIds } from '@/lib/client-voted-ids'

interface Props {
  scenario: Scenario
  playHref: string
  resultsHref: string
  totalVotes?: number
  badge?: DilemmaCardBadge
  locale?: 'en' | 'it'
}

export default function VotedDilemmaCard({ scenario, playHref, resultsHref, totalVotes, badge, locale }: Props) {
  const [isVoted, setIsVoted] = useState(false)

  useEffect(() => {
    // Fast path: cookie set on this device after voting
    if (document.cookie.includes(`sv_voted_${scenario.id}=`)) {
      setIsVoted(true)
      return
    }
    // Fallback: check server-side votes for logged-in users (cross-device consistency).
    // Deduped via shared Promise in lib/client-voted-ids — one HTTP request per page
    // load regardless of how many VotedDilemmaCard instances are mounted.
    getServerVotedIds().then((ids) => {
      if (ids.has(scenario.id)) setIsVoted(true)
    })
  }, [scenario.id])

  return (
    <DilemmaCard
      scenario={scenario}
      playHref={isVoted ? resultsHref : playHref}
      totalVotes={totalVotes}
      badge={isVoted ? 'voted' : badge}
      locale={locale}
    />
  )
}
