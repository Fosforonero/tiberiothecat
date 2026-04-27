import { notFound } from 'next/navigation'
import { getScenario, getNextScenarioId, scenarios } from '@/lib/scenarios'
import { getDynamicScenario, getDynamicScenarios } from '@/lib/dynamic-scenarios'
import type { DynamicScenario } from '@/lib/dynamic-scenarios'
import { createClient } from '@/lib/supabase/server'
import { getVotes } from '@/lib/redis'
import VoteClientPage from './VoteClientPage'
import JsonLd from '@/components/JsonLd'
import RelatedDilemmas from '@/components/RelatedDilemmas'
import type { Metadata } from 'next'
import type { Scenario } from '@/lib/scenarios'

const BASE_URL = 'https://splitvote.io'

interface Props {
  params: { id: string }
  searchParams: { challenge?: string; ref?: string }
}

export async function generateStaticParams() {
  return scenarios.map((s) => ({ id: s.id }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const staticScenario = getScenario(params.id)
  const scenario = staticScenario ?? await getDynamicScenario(params.id)
  if (!scenario) return {}

  // Use AI-generated SEO fields when available (dynamic scenarios only)
  const ds = staticScenario ? null : scenario as DynamicScenario
  const title = ds?.seoTitle ?? `${scenario.question.slice(0, 55)}…`
  const description = ds?.seoDescription
    ?? `Global vote: "${scenario.optionA}" vs "${scenario.optionB}" — See how the world splits on this moral dilemma.`
  const keywords = ds?.keywords?.length ? ds.keywords.join(', ') : undefined

  return {
    title,
    description,
    ...(keywords ? { keywords } : {}),
    alternates: {
      canonical: `${BASE_URL}/play/${params.id}`,
      languages: {
        'en': `${BASE_URL}/play/${params.id}`,
        'it-IT': `${BASE_URL}/it/play/${params.id}`,
        'x-default': `${BASE_URL}/play/${params.id}`,
      },
    },
    openGraph: {
      title: ds?.seoTitle ?? scenario.question,
      description,
      images: [`/api/og?id=${params.id}`],
      url: `${BASE_URL}/play/${params.id}`,
      siteName: 'SplitVote',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: ds?.seoTitle ?? scenario.question,
      description,
    },
  }
}

export const dynamic = 'force-dynamic'

export default async function PlayPage({ params, searchParams }: Props) {
  const scenario = getScenario(params.id) ?? await getDynamicScenario(params.id)
  if (!scenario) notFound()

  // Fetch live vote count for "Join X,XXX voters" social proof
  let totalVotes = 0
  let votesA = 0
  let votesB = 0
  try {
    const votes = await getVotes(params.id)
    votesA = votes.a
    votesB = votes.b
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
  const referralCode = typeof searchParams.ref === 'string' ? searchParams.ref : undefined

  // Collect all scenarios for internal linking (related dilemmas) + next dilemma
  let dynamicScenarios: Awaited<ReturnType<typeof getDynamicScenarios>> = []
  let allScenarios: Scenario[] = [...scenarios]
  try {
    dynamicScenarios = await getDynamicScenarios()
    const staticIds = new Set(scenarios.map((s) => s.id))
    allScenarios = [...scenarios, ...dynamicScenarios.filter((d) => !staticIds.has(d.id))]
  } catch {
    // Non-blocking
  }
  const nextId = getNextScenarioId(params.id, dynamicScenarios)

  // JSON-LD: BreadcrumbList
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'SplitVote', item: BASE_URL },
      {
        '@type': 'ListItem',
        position: 2,
        name: scenario.category.charAt(0).toUpperCase() + scenario.category.slice(1),
        item: `${BASE_URL}/category/${scenario.category}`,
      },
      { '@type': 'ListItem', position: 3, name: scenario.question.slice(0, 60), item: `${BASE_URL}/play/${params.id}` },
    ],
  }

  // JSON-LD: Poll/Quiz schema for the dilemma
  const pollSchema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Quiz',
    name: scenario.question,
    description: `A moral dilemma on SplitVote: "${scenario.optionA}" vs "${scenario.optionB}". ${totalVotes.toLocaleString()} people have voted.`,
    url: `${BASE_URL}/play/${params.id}`,
    provider: {
      '@type': 'Organization',
      name: 'SplitVote',
      url: BASE_URL,
    },
    hasPart: [
      {
        '@type': 'Question',
        name: scenario.question,
        suggestedAnswer: [
          {
            '@type': 'Answer',
            text: scenario.optionA,
            ...(totalVotes > 0 ? { upvoteCount: votesA } : {}),
          },
          {
            '@type': 'Answer',
            text: scenario.optionB,
            ...(totalVotes > 0 ? { upvoteCount: votesB } : {}),
          },
        ],
      },
    ],
  }

  return (
    <>
      <JsonLd data={breadcrumbSchema} />
      <JsonLd data={pollSchema} />
      <VoteClientPage
        scenario={scenario}
        existingVote={existingVote}
        totalVotes={totalVotes}
        isChallenge={isChallenge}
        referralCode={referralCode}
        nextId={nextId}
      />
      <RelatedDilemmas current={scenario} all={allScenarios} />
    </>
  )
}
