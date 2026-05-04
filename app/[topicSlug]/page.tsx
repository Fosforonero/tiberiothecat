import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import JsonLd from '@/components/JsonLd'
import DilemmaOptionPills from '@/components/DilemmaOptionPills'
import {
  getTopicBySlug,
  getPublishedTopics,
  getIndexableTopics,
  RESERVED_SLUGS,
  type SeoTopic,
} from '@/lib/seo-topics'
import { getScenario } from '@/lib/scenarios'
import { getVotes } from '@/lib/redis'

const BASE_URL = 'https://splitvote.io'

interface Props {
  params: { topicSlug: string }
}

// Only build pages for published topics.
// dynamicParams=false means all other slugs return 404 automatically.
export async function generateStaticParams() {
  const published = getPublishedTopics()

  // Collision guard — fail the build loudly if a slug conflicts with an existing route
  for (const t of published) {
    if (RESERVED_SLUGS.has(t.slug)) {
      throw new Error(
        `[seo-topics] Slug "${t.slug}" conflicts with a reserved route. ` +
          `Update RESERVED_SLUGS or rename the topic in lib/seo-topics.ts.`,
      )
    }
  }

  return published.map((t) => ({ topicSlug: t.slug }))
}

export const dynamicParams = false
export const revalidate = 3600

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const topic = getTopicBySlug(params.topicSlug)
  if (!topic) return {}

  const isIndexable =
    topic.status === 'published' &&
    !topic.noindexUntilReady &&
    topic.relatedScenarioIds.length >= 3

  // title: passes just the headline so the root layout template ("%s | SplitVote") appends the brand once.
  // socialTitle: OG/Twitter fields bypass the template — they need the suffix explicitly.
  const socialTitle = `${topic.headline} | SplitVote`
  const description = topic.intro.slice(0, 160)

  return {
    title: topic.headline,
    description,
    robots: isIndexable ? undefined : { index: false, follow: true },
    alternates: { canonical: `${BASE_URL}/${topic.slug}` },
    openGraph: {
      title: socialTitle,
      description,
      url: `${BASE_URL}/${topic.slug}`,
      siteName: 'SplitVote',
      locale: 'en_US',
    },
    twitter: { card: 'summary_large_image', title: socialTitle, description },
  }
}

function buildBreadcrumbLd(topic: SeoTopic) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'SplitVote', item: BASE_URL },
      { '@type': 'ListItem', position: 2, name: topic.topic, item: `${BASE_URL}/${topic.slug}` },
    ],
  }
}

function buildItemListLd(
  topic: SeoTopic,
  primary: ReturnType<typeof getScenario>,
  related: NonNullable<ReturnType<typeof getScenario>>[],
) {
  const items = [
    ...(primary ? [{ id: primary.id, question: primary.question }] : []),
    ...related.map((s) => ({ id: s.id, question: s.question })),
  ]
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: topic.headline,
    description: topic.tension,
    url: `${BASE_URL}/${topic.slug}`,
    numberOfItems: items.length,
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.question,
      url: `${BASE_URL}/play/${item.id}`,
    })),
  }
}

export default async function TopicLandingPage({ params }: Props) {
  const topic = getTopicBySlug(params.topicSlug)
  if (!topic) notFound()

  const primaryScenario = getScenario(topic.primaryScenarioId)
  if (!primaryScenario) notFound()

  const relatedScenarios = topic.relatedScenarioIds
    .map((id) => getScenario(id))
    .filter((s): s is NonNullable<typeof s> => s !== undefined)
    .slice(0, 5)

  // Thin-content guard: need primary + at least 3 related
  if (relatedScenarios.length < 3) notFound()

  // Vote counts for the primary dilemma — graceful fallback if Redis is unavailable
  let votes: { a: number; b: number } | null = null
  try {
    votes = await getVotes(topic.primaryScenarioId)
  } catch {
    // Redis unavailable — render page without vote percentages
  }

  const totalVotes = votes ? votes.a + votes.b : 0
  const pctA = totalVotes > 0 ? Math.round((votes!.a / totalVotes) * 100) : null
  const pctB = pctA !== null ? 100 - pctA : null

  // Related topics — only show those that are published and actually exist
  const relatedTopics = topic.relatedTopicSlugs
    .map((slug) => getTopicBySlug(slug))
    .filter((t): t is NonNullable<typeof t> => t !== undefined && t.status === 'published')

  const nextDilemma = relatedScenarios[0]

  return (
    <>
      <JsonLd data={buildBreadcrumbLd(topic)} />
      <JsonLd data={buildItemListLd(topic, primaryScenario, relatedScenarios)} />

      <div className="max-w-3xl mx-auto px-4 py-12 sm:py-16">

        {/* Breadcrumb */}
        <nav className="text-xs text-[var(--muted)] mb-8" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-white transition-colors">All dilemmas</Link>
          <span className="mx-2">›</span>
          <span className="text-white">{topic.topic}</span>
        </nav>

        {/* Hero header */}
        <header className="mb-10">
          <div className="inline-block bg-purple-500/10 text-purple-400 text-xs font-bold tracking-widest uppercase px-4 py-2 rounded-full mb-5 border border-purple-500/20">
            {topic.tension}
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight mb-5 leading-tight">
            {topic.headline}
          </h1>
          <p className="text-base text-[var(--muted)] leading-relaxed">
            {topic.intro}
          </p>
        </header>

        {/* Primary dilemma — above the fold */}
        <section aria-labelledby="primary-dilemma-heading" className="mb-12">
          <h2
            id="primary-dilemma-heading"
            className="text-xs font-bold uppercase tracking-widest text-[var(--muted)] mb-4"
          >
            Vote on this dilemma
          </h2>

          <div className="card-neon rounded-2xl p-6 sm:p-8">
            <div className="flex items-start gap-3 mb-5">
              <span className="text-3xl flex-shrink-0 mt-0.5" aria-hidden="true">
                {primaryScenario.emoji}
              </span>
              <p className="text-lg sm:text-xl font-semibold text-[var(--text)] leading-snug">
                {primaryScenario.question}
              </p>
            </div>

            <DilemmaOptionPills
              optionA={primaryScenario.optionA}
              optionB={primaryScenario.optionB}
            />

            {/* Live vote split — shown only when Redis data is available */}
            {pctA !== null && pctB !== null && (
              <div className="mt-5 space-y-2.5">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-[var(--muted)] truncate pr-2">
                      {primaryScenario.optionA.split('.')[0]}
                    </span>
                    <span className="text-xs font-black text-red-400 flex-shrink-0">{pctA}%</span>
                  </div>
                  <div className="h-2 bg-[var(--border)] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-red-500/60"
                      style={{ width: `${pctA}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-[var(--muted)] truncate pr-2">
                      {primaryScenario.optionB.split('.')[0]}
                    </span>
                    <span className="text-xs font-black text-blue-400 flex-shrink-0">{pctB}%</span>
                  </div>
                  <div className="h-2 bg-[var(--border)] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-blue-500/60"
                      style={{ width: `${pctB}%` }}
                    />
                  </div>
                </div>
                <p className="text-xs text-[var(--muted)] pt-0.5">
                  {totalVotes.toLocaleString()} votes cast
                </p>
              </div>
            )}

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href={`/play/${topic.primaryScenarioId}`}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-red-500 to-purple-600 hover:from-red-400 hover:to-purple-500 text-white font-bold text-sm transition-all shadow-lg"
              >
                Vote now →
              </Link>
              <Link
                href={`/results/${topic.primaryScenarioId}`}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-[var(--border)] text-[var(--muted)] hover:text-white hover:border-[var(--border-hi)] text-sm font-semibold transition-colors"
              >
                See full results →
              </Link>
            </div>
          </div>
        </section>

        {/* Related dilemmas */}
        <section aria-labelledby="related-dilemmas-heading" className="mb-12">
          <h2
            id="related-dilemmas-heading"
            className="text-xs font-bold uppercase tracking-widest text-[var(--muted)] mb-4"
          >
            Related dilemmas
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {relatedScenarios.map((s) => (
              <Link
                key={s.id}
                href={`/play/${s.id}`}
                className="group flex items-start gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] hover:border-blue-500/40 hover:bg-[#16162a] transition-all p-4"
              >
                <span className="text-2xl flex-shrink-0 mt-0.5" aria-hidden="true">
                  {s.emoji}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-[var(--text)] leading-snug line-clamp-3 group-hover:text-white transition-colors mb-3">
                    {s.question}
                  </p>
                  <DilemmaOptionPills optionA={s.optionA} optionB={s.optionB} />
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Related topics */}
        {relatedTopics.length > 0 && (
          <section aria-labelledby="related-topics-heading" className="mb-12">
            <h2
              id="related-topics-heading"
              className="text-xs font-bold uppercase tracking-widest text-[var(--muted)] mb-4"
            >
              Related topics
            </h2>
            <div className="flex flex-wrap gap-3">
              {relatedTopics.map((t) => (
                <Link
                  key={t.slug}
                  href={`/${t.slug}`}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold border border-[var(--border)] text-[var(--muted)] hover:border-purple-500/40 hover:text-white transition-all"
                >
                  {t.topic} →
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Vote-next loop */}
        <div className="rounded-2xl border border-blue-500/25 bg-blue-500/5 p-6 text-center">
          <p className="text-white font-black text-lg mb-2">Keep voting</p>
          <p className="text-[var(--muted)] text-sm mb-5">
            Explore more dilemmas and see how the world is split.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href={`/play/${nextDilemma.id}`}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm transition-colors"
            >
              Vote next →
            </Link>
            <Link
              href="/trending"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-[var(--border)] text-[var(--muted)] hover:text-white hover:border-[var(--border-hi)] text-sm font-semibold transition-colors"
            >
              See trending →
            </Link>
          </div>
        </div>

        <p className="text-center text-xs text-[var(--muted)] mt-8 opacity-60">
          No account required. Your vote is anonymous.
        </p>
      </div>
    </>
  )
}
