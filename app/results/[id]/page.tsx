import { notFound } from 'next/navigation'
import { getScenario, getNextScenarioId, scenarios } from '@/lib/scenarios'
import { getDynamicScenario, getDynamicScenarios } from '@/lib/dynamic-scenarios'
import type { DynamicScenario } from '@/lib/dynamic-scenarios'
import { getVotes } from '@/lib/redis'
import ResultsClientPage from './ResultsClientPage'
import type { Metadata } from 'next'

const BASE_URL = 'https://splitvote.io'

interface Props {
  params: { id: string }
  searchParams: { voted?: string }
}

export async function generateStaticParams() {
  return scenarios.map((s) => ({ id: s.id }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const staticScenario = getScenario(params.id)
  const scenario = staticScenario ?? await getDynamicScenario(params.id)
  if (!scenario) return {}

  const ds = staticScenario ? null : scenario as DynamicScenario
  const title = ds?.seoTitle
    ? `Results: ${ds.seoTitle}`
    : `Results: ${scenario.question.slice(0, 50)}… | SplitVote`
  const description = ds?.seoDescription
    ?? `See how the world voted on this moral dilemma. "${scenario.optionA}" vs "${scenario.optionB}".`
  const keywords = ds?.keywords?.length ? ds.keywords.join(', ') : undefined

  return {
    title,
    description,
    ...(keywords ? { keywords } : {}),
    alternates: {
      canonical: `${BASE_URL}/results/${params.id}`,
    },
    openGraph: {
      title,
      description,
      images: [`/api/og?id=${params.id}`],
      url: `${BASE_URL}/results/${params.id}`,
    },
    twitter: { card: 'summary_large_image', title, description },
  }
}

export const dynamic = 'force-dynamic'

export default async function ResultsPage({ params, searchParams }: Props) {
  // Supporta sia gli scenari statici che quelli AI generati dal cron
  const scenario = getScenario(params.id) ?? await getDynamicScenario(params.id)
  if (!scenario) notFound()

  const votes = await getVotes(params.id)
  const total = votes.a + votes.b
  const pctA = total > 0 ? Math.round((votes.a / total) * 100) : 50
  const pctB = total > 0 ? Math.round((votes.b / total) * 100) : 50
  const voted = (searchParams.voted === 'a' || searchParams.voted === 'b')
    ? searchParams.voted
    : null

  let dynamicScenarios: DynamicScenario[] = []
  try { dynamicScenarios = await getDynamicScenarios() } catch { /* non-blocking */ }
  const nextId = getNextScenarioId(params.id, dynamicScenarios)

  return (
    <ResultsClientPage
      scenario={scenario}
      votes={votes}
      pctA={pctA}
      pctB={pctB}
      total={total}
      voted={voted}
      nextId={nextId}
    />
  )
}
