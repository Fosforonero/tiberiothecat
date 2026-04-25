import { notFound } from 'next/navigation'
import { getScenario, scenarios } from '@/lib/scenarios'
import VoteClientPage from './VoteClientPage'
import type { Metadata } from 'next'

interface Props {
  params: { id: string }
}

export async function generateStaticParams() {
  return scenarios.map((s) => ({ id: s.id }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const scenario = getScenario(params.id)
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

export default function PlayPage({ params }: Props) {
  const scenario = getScenario(params.id)
  if (!scenario) notFound()
  return <VoteClientPage scenario={scenario} />
}
