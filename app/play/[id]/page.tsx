import { notFound } from 'next/navigation'
import { getScenario, scenarios } from '@/lib/scenarios'
import { getDynamicScenario } from '@/lib/dynamic-scenarios'
import { createClient } from '@/lib/supabase/server'
import { getVotes } from '@/lib/redis'
import VoteClientPage from './VoteClientPage'
import type { Metadata } from 'next'

interface Props {
  params: { id: string }
  searchParams: { challenge?: string }
}

export async function generateStaticParams() {
  return scenarios.map((s) => ({ id: s.id }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const scenario = getScenario(params.id) ?? await getDynamicScenario(params.id)
  if (!scenario) return {}
  return {
    title: `${scenario.question.slice(0, 60)}… | SplitVote`,
    description: `Vote: "${scenario.optionA}" vs "${scenario.optionB}" — See how the world splits.`,
    openGraph: {
      title: scenario.question,
      description: `"${scenario.optionA}" vs "${scenario.optionB}"`,
      images: [`/api/og?id=${params.id}`],
    },
    twitter: {
      card: 'summary_large_image',
    },
  }
}

export const dynamic = 'force-dynamic'

export default async function PlayPage({ params, searchParams }: Props) {
  const scenario = getScenario(params.id) ?? await getDynamicScenario(params.id)
  if (!scenario) notFound()

  // Fetch live vote count for "Join X,XXX voters" social proof
  let totalVotes = 0
  try {
    const votes = await getVotes(params.id)
    totalVotes = votes.a + votes.b
  } catch {
    // Non-blocking
  }

  // Check if logged-in user already voted on this dilemma
  let existingVote: { choice: 'A' | 'B'; canChangeUntil: string } | null = null
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data } = await supabase
        .from('dilemma_votes')
        .select('choice, can_change_until')
        .eq('user_id', user.id)
        .eq('dilemma_id', params.id)
        .single()
      if (data) {
        existingVote = { choice: data.choice as 'A' | 'B', canChangeUntil: data.can_change_until }
      }
    }
  } catch {
    // Non-blocking
  }

  const isChallenge = searchParams.challenge === '1'

  return (
    <VoteClientPage
      scenario={scenario}
      existingVote={existingVote}
      totalVotes={totalVotes}
      isChallenge={isChallenge}
    />
  )
}
