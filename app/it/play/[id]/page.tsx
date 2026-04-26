/**
 * /it/play/[id] — Italian play page for AI-generated dilemmas with locale='it'.
 * Static scenarios (EN-only) redirect to /play/[id].
 * Voting is global (same Redis key regardless of locale).
 */
import { notFound, redirect } from 'next/navigation'
import { getDynamicScenario } from '@/lib/dynamic-scenarios'
import type { DynamicScenario } from '@/lib/dynamic-scenarios'
import { createClient } from '@/lib/supabase/server'
import { getVotes } from '@/lib/redis'
import VoteClientPage from '@/app/play/[id]/VoteClientPage'
import JsonLd from '@/components/JsonLd'
import type { Metadata } from 'next'

const BASE_URL = 'https://splitvote.io'

interface Props {
  params: { id: string }
  searchParams: { challenge?: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const scenario = await getDynamicScenario(params.id) as DynamicScenario | undefined
  if (!scenario || scenario.locale !== 'it') return {}

  const title = scenario.seoTitle ?? `${scenario.question.slice(0, 55)}… | SplitVote`
  const description = scenario.seoDescription
    ?? `Vota: "${scenario.optionA}" contro "${scenario.optionB}" — Scopri come si divide il mondo.`
  const keywords = scenario.keywords?.length ? scenario.keywords.join(', ') : undefined

  return {
    title,
    description,
    ...(keywords ? { keywords } : {}),
    alternates: {
      canonical: `${BASE_URL}/it/play/${params.id}`,
    },
    openGraph: {
      title: scenario.seoTitle ?? scenario.question,
      description,
      images: [`${BASE_URL}/api/og?id=${params.id}`],
      url: `${BASE_URL}/it/play/${params.id}`,
      siteName: 'SplitVote',
      type: 'website',
      locale: 'it_IT',
    },
    twitter: {
      card: 'summary_large_image',
      title: scenario.seoTitle ?? scenario.question,
      description,
    },
  }
}

export const dynamic = 'force-dynamic'

export default async function ItPlayPage({ params, searchParams }: Props) {
  const scenario = await getDynamicScenario(params.id) as DynamicScenario | undefined

  // Not found → 404
  if (!scenario) notFound()

  // Not an Italian scenario → redirect to EN play page
  if (scenario.locale !== 'it') redirect(`/play/${params.id}`)

  // Fetch live votes
  let totalVotes = 0
  try {
    const votes = await getVotes(params.id)
    totalVotes = votes.a + votes.b
  } catch { /* non-blocking */ }

  // Check if logged-in user already voted
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
  } catch { /* non-blocking */ }

  const isChallenge = searchParams.challenge === '1'

  // JSON-LD breadcrumb in Italian
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'SplitVote', item: BASE_URL },
      { '@type': 'ListItem', position: 2, name: 'Dilemmi Morali', item: `${BASE_URL}/it` },
      {
        '@type': 'ListItem',
        position: 3,
        name: scenario.question.slice(0, 60),
        item: `${BASE_URL}/it/play/${params.id}`,
      },
    ],
  }

  // JSON-LD Poll schema (Italian content)
  const pollSchema = {
    '@context': 'https://schema.org',
    '@type': 'Quiz',
    name: scenario.question,
    description: scenario.seoDescription ?? `Un dilemma morale su SplitVote: "${scenario.optionA}" contro "${scenario.optionB}".`,
    url: `${BASE_URL}/it/play/${params.id}`,
    inLanguage: 'it-IT',
    provider: { '@type': 'Organization', name: 'SplitVote', url: BASE_URL },
    hasPart: [
      {
        '@type': 'Question',
        name: scenario.question,
        suggestedAnswer: [
          { '@type': 'Answer', text: scenario.optionA },
          { '@type': 'Answer', text: scenario.optionB },
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
      />
    </>
  )
}
