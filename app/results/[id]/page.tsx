import { notFound } from 'next/navigation'
import { getScenario, getRandomScenario, scenarios } from '@/lib/scenarios'
import { getVotes } from '@/lib/redis'
import ResultsClientPage from './ResultsClientPage'
import type { Metadata } from 'next'

interface Props {
  params: { id: string }
  searchParams: { voted?: string }
}

export async function generateStaticParams() {
  return scenarios.map((s) => ({ id: s.id }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const scenario = getScenario(params.id)
  if (!scenario) return {}
  return {
    title: `Results: ${scenario.question.slice(0, 50)}… | SplitVote`,
    openGraph: {
      images: [`/api/og?id=${params.id}`],
    },
    twitter: { card: 'summary_large_image' },
  }
}

export const dynamic = 'force-dynamic'

export default async function ResultsPage({ params, searchParams }: Props) {
  const scenario = getScenario(params.id)
  if (!scenario) notFound()

  const votes = await getVotes(params.id)
  const total = votes.a + votes.b
  const pctA = total > 0 ? Math.round((votes.a / total) * 100) : 50
  const pctB = total > 0 ? Math.round((votes.b / total) * 100) : 50
  const voted = (searchParams.voted === 'a' || searchParams.voted === 'b')
    ? searchParams.voted
    : null

  const nextScenario = getRandomScenario(params.id)

  return (
    <ResultsClientPage
      scenario={scenario}
      votes={votes}
      pctA={pctA}
      pctB={pctB}
      total={total}
      voted={voted}
      nextId={nextScenario.id}
    />
  )
}
