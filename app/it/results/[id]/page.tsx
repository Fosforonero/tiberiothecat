/**
 * /it/results/[id] — Italian results page for AI-generated and static dilemmas.
 * Share URLs automatically use /it/play prefix.
 */
import { notFound } from 'next/navigation'
import { getDynamicScenario, getDynamicScenarios } from '@/lib/dynamic-scenarios'
import type { DynamicScenario } from '@/lib/dynamic-scenarios'
import { getNextScenarioId } from '@/lib/scenarios'
import { getItalianScenario } from '@/lib/scenarios-it'
import { getVotes } from '@/lib/redis'
import ResultsClientPage from '@/app/results/[id]/ResultsClientPage'
import JsonLd from '@/components/JsonLd'
import type { Metadata } from 'next'

const BASE_URL = 'https://splitvote.io'

interface Props {
  params: { id: string }
  searchParams: { voted?: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const dynamicScenario = await getDynamicScenario(params.id) as DynamicScenario | undefined
  const scenario = dynamicScenario?.locale === 'it'
    ? dynamicScenario
    : getItalianScenario(params.id)
  if (!scenario) return {}

  const title = dynamicScenario?.seoTitle
    ? `Risultati: ${dynamicScenario.seoTitle}`
    : `Risultati: ${scenario.question.slice(0, 50)}…`
  const description = dynamicScenario?.seoDescription
    ?? `Scopri come ha votato il mondo su questo dilemma morale. "${scenario.optionA}" contro "${scenario.optionB}".`
  const keywords = dynamicScenario?.keywords?.length ? dynamicScenario.keywords.join(', ') : undefined

  return {
    title,
    description,
    ...(keywords ? { keywords } : {}),
    alternates: {
      canonical: `${BASE_URL}/it/results/${params.id}`,
      languages: {
        'it-IT': `${BASE_URL}/it/results/${params.id}`,
        'en': `${BASE_URL}/results/${params.id}`,
        'x-default': `${BASE_URL}/results/${params.id}`,
      },
    },
    openGraph: {
      title,
      description,
      images: [`${BASE_URL}/api/og?id=${params.id}`],
      url: `${BASE_URL}/it/results/${params.id}`,
      locale: 'it_IT',
    },
    twitter: { card: 'summary_large_image', title, description },
  }
}

export const dynamic = 'force-dynamic'

export default async function ItResultsPage({ params, searchParams }: Props) {
  const dynamicScenario = await getDynamicScenario(params.id) as DynamicScenario | undefined
  const scenario = dynamicScenario?.locale === 'it'
    ? dynamicScenario
    : getItalianScenario(params.id)

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
  // Prefer IT-locale dynamic scenarios; fall back to any dynamic, then static
  const itPool = dynamicScenarios.filter((s) => s.locale === 'it')
  const nextId = getNextScenarioId(params.id, itPool.length ? itPool : dynamicScenarios)

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'SplitVote', item: BASE_URL },
      { '@type': 'ListItem', position: 2, name: 'Dilemmi Morali', item: `${BASE_URL}/it` },
      {
        '@type': 'ListItem',
        position: 3,
        name: `Risultati: ${scenario.question.slice(0, 60)}`,
        item: `${BASE_URL}/it/results/${params.id}`,
      },
    ],
  }

  const datasetSchema = {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    name: `Risultati: ${scenario.question}`,
    description: `Distribuzione dei voti globali sul dilemma morale: "${scenario.optionA}" contro "${scenario.optionB}".`,
    url: `${BASE_URL}/it/results/${params.id}`,
    dateModified: new Date().toISOString().split('T')[0],
    hasPart: [
      { '@type': 'DataDownload', name: scenario.optionA, description: `${votes.a} voti (${pctA}%)` },
      { '@type': 'DataDownload', name: scenario.optionB, description: `${votes.b} voti (${pctB}%)` },
    ],
  }

  return (
    <>
      <JsonLd data={breadcrumbSchema} />
      <JsonLd data={datasetSchema} />
      <ResultsClientPage
        scenario={scenario}
        votes={votes}
        pctA={pctA}
        pctB={pctB}
        total={total}
        voted={voted}
        nextId={nextId}
        sharePrefix="/it"
      />
    </>
  )
}
