'use client'

import { useState, useEffect } from 'react'
import DilemmaCard, { type DilemmaCardBadge } from '@/components/DilemmaCard'
import type { Scenario } from '@/lib/scenarios'

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
    if (document.cookie.includes(`sv_voted_${scenario.id}=`)) {
      setIsVoted(true)
    }
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
