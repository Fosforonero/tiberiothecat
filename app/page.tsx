import { scenarios } from '@/lib/scenarios'
import type { DynamicScenario } from '@/lib/dynamic-scenarios'
import { getFreshDynamicScenarios, getCachedVotesBatch, getCachedTrendingIds } from '@/lib/cached-data'
import { getServerVotedIds, freshFirst } from '@/lib/voted-ids'
import VotedDilemmaCard from '@/components/VotedDilemmaCard'
import AdSlot from '@/components/AdSlot'
import DailyDilemma from '@/components/DailyDilemma'
import PersonalityTeaser from '@/components/PersonalityTeaser'
import JsonLd from '@/components/JsonLd'
import Link from 'next/link'
import type { Metadata } from 'next'
import type { Scenario } from '@/lib/scenarios'

const SLOT_HOME = process.env.NEXT_PUBLIC_ADSENSE_SLOT_HOME ?? 'TODO'
const BASE_URL = 'https://splitvote.io'

// Reciprocal hreflang to /it so Google can discover the Italian alternate.
// Mirrors the alternates declared on app/it/page.tsx.
export const metadata: Metadata = {
  alternates: {
    canonical: BASE_URL,
    languages: {
      en:          BASE_URL,
      'it-IT':     `${BASE_URL}/it`,
      'x-default': BASE_URL,
    },
  },
}

// Bypasses Next.js Data Cache to avoid stale dynamic discovery state
// (same pattern as commit 76ad684 — extended here to EN home).
// getFreshDynamicScenarios calls noStore() + reads Redis directly.
export const dynamic = 'force-dynamic'

function getDailyScenario(all: Scenario[]): Scenario {
  if (all.length === 0) return scenarios[0]
  const daysSinceEpoch = Math.floor(Date.now() / 86_400_000)
  return all[daysSinceEpoch % all.length]
}

export default async function HomePage() {
  let dynamicScenarios: DynamicScenario[] = []
  try {
    dynamicScenarios = (await getFreshDynamicScenarios()).filter(s => s.locale === 'en')
  } catch {
    // Redis unavailable
  }

  const staticIds = new Set(scenarios.map((s) => s.id))
  const uniqueDynamic = dynamicScenarios.filter((d) => !staticIds.has(d.id))
  const allScenarios: Scenario[] = [...uniqueDynamic, ...scenarios]

  const dailyScenario = getDailyScenario(allScenarios)

  // Include daily scenario in the vote batch to avoid a separate fetch.
  // Run vote batch, trending lookup, and viewer's voted IDs in parallel —
  // all independent once allScenarios is known.
  const batchIds = [...new Set([dailyScenario.id, ...allScenarios.slice(0, 30).map((s) => s.id)])]
  let voteMap = new Map<string, number>()
  let trendingIds: string[] = []
  let votedIds = new Set<string>()
  const [voteMapResult, trendingResult, votedIdsResult] = await Promise.allSettled([
    getCachedVotesBatch(batchIds).then(obj => new Map(Object.entries(obj))),
    getCachedTrendingIds(allScenarios.map(s => s.id), 6),
    getServerVotedIds(),
  ])
  if (voteMapResult.status === 'fulfilled') voteMap = voteMapResult.value
  if (trendingResult.status === 'fulfilled') trendingIds = trendingResult.value
  if (votedIdsResult.status === 'fulfilled') votedIds = votedIdsResult.value
  const dailyVotes = voteMap.get(dailyScenario.id) ?? 0
  const scenarioById = new Map(allScenarios.map(s => [s.id, s]))

  // Accumulate seen IDs in section priority order so the same scenario ID
  // cannot appear in more than one visible section. Browse All is intentionally
  // exempt — it remains the complete list for SEO and category filtering.
  const seen = new Set<string>([dailyScenario.id])

  // Each visible section gets the freshFirst reorder so position-0 in
  // every grid is guaranteed unvoted whenever the section contains any.
  // dailyScenario is intentionally NOT reordered — it's a single per-day
  // pick, not a list.
  const trendingNowRaw = trendingIds
    .map(id => scenarioById.get(id))
    .filter((s): s is Scenario => s !== undefined && !seen.has(s.id))
  const trendingNow = freshFirst(trendingNowRaw, votedIds)
  trendingNow.forEach(s => seen.add(s.id))

  const mostVotedRaw = [...allScenarios.slice(0, 30)]
    .filter((s) => (voteMap.get(s.id) ?? 0) > 0 && !seen.has(s.id))
    .sort((a, b) => (voteMap.get(b.id) ?? 0) - (voteMap.get(a.id) ?? 0))
    .slice(0, 6)
  const mostVoted = freshFirst(mostVotedRaw, votedIds)
  mostVoted.forEach(s => seen.add(s.id))

  const newlyGeneratedRaw = [...uniqueDynamic]
    .filter(s => !seen.has(s.id))
    .sort((a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime())
    .slice(0, 6)
  const newlyGenerated = freshFirst(newlyGeneratedRaw, votedIds)

  // "Pick your next" — 3 personalised picks + 1 fixed catalog CTA (DILEMMAS-CATALOG-01).
  // Blends 1 trending + 1 most-voted + 1 newly-generated (with graceful
  // fallbacks if any source list is shorter than expected). The 4th grid
  // slot is rendered separately as a CTA card linking to /moral-dilemmas.
  type PickItem = { scenario: Scenario; badge: 'trending' | 'new' | undefined }
  const picks: PickItem[] = []
  if (trendingNow[0])     picks.push({ scenario: trendingNow[0],     badge: 'trending' })
  if (mostVoted[0])       picks.push({ scenario: mostVoted[0],       badge: undefined  })
  if (newlyGenerated[0])  picks.push({ scenario: newlyGenerated[0],  badge: 'new'      })
  // Pad up to 3 if a primary slot was empty
  if (picks.length < 3 && mostVoted[1])      picks.push({ scenario: mostVoted[1],      badge: undefined  })
  if (picks.length < 3 && trendingNow[1])    picks.push({ scenario: trendingNow[1],    badge: 'trending' })
  if (picks.length < 3 && newlyGenerated[1]) picks.push({ scenario: newlyGenerated[1], badge: 'new'      })
  const pickYourNext = picks.slice(0, 3)

  // JSON-LD schemas
  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'SplitVote',
    url: BASE_URL,
    description: 'Real-time global votes on impossible moral dilemmas.',
    potentialAction: {
      '@type': 'SearchAction',
      target: { '@type': 'EntryPoint', urlTemplate: `${BASE_URL}/?q={search_term_string}` },
      'query-input': 'required name=search_term_string',
    },
  }

  const itemListSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Moral Dilemmas — Real-time Global Votes',
    description: 'Impossible ethical questions voted on by people worldwide.',
    url: BASE_URL,
    numberOfItems: allScenarios.length,
    itemListElement: allScenarios.slice(0, 20).map((s, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: s.question,
      url: `${BASE_URL}/play/${s.id}`,
    })),
  }

  // FAQPage JSON-LD intentionally not rendered here. Google requires
  // structured data to mirror visible page content; the EN home has no
  // visible FAQ accordion (the full FAQ lives at /faq, which carries its
  // own FAQPage JSON-LD). Mirror of the IT-home cleanup done on 24 May
  // (528bcb3) — see SPRINT: HOME-DISCOVERY-BALANCE-AND-EN-FAQ-SCHEMA-FIX-01.

  return (
    <>
      <JsonLd data={websiteSchema} />
      <JsonLd data={itemListSchema} />

      <div className="max-w-4xl mx-auto px-4 py-12 sm:py-16">

        {/* ── Hero ── */}
        <div className="text-center mb-4 sm:mb-10">
          <div className="inline-flex items-center gap-2 bg-blue-500/10 text-blue-400 text-xs font-bold tracking-widest uppercase px-4 py-2 rounded-full mb-6 border border-blue-500/20 neon-glow-blue">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 pulse-glow" />
            Real-time global votes
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-[88px] font-black tracking-tight mb-5 sm:mb-6 leading-none">
            What would the
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-purple-400 to-blue-400">
              world choose?
            </span>
          </h1>
          <p className="text-base sm:text-xl text-[var(--muted)] max-w-lg mx-auto leading-relaxed">
            Vote anonymously. See how the world splits. Build your moral profile.
          </p>
          <div className="mt-6 flex items-center justify-center">
            <Link
              href="/trending"
              className="text-sm text-[var(--muted)] hover:text-white transition-colors"
            >
              See what&apos;s trending →
            </Link>
          </div>
        </div>

        {/* ── Game loop ── */}
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 mb-4 text-xs text-[var(--muted)]">
          <span className="flex items-center gap-1.5">
            <span className="text-blue-400 font-black neon-text-blue">1.</span> Vote on a dilemma
          </span>
          <span className="text-white/15 hidden sm:inline">→</span>
          <span className="flex items-center gap-1.5">
            <span className="text-purple-400 font-black neon-text-purple">2.</span> See how the world splits
          </span>
          <span className="text-white/15 hidden sm:inline">→</span>
          <span className="flex items-center gap-1.5">
            <span className="text-yellow-400 font-black neon-text-yellow">3.</span> Build your moral profile
          </span>
        </div>

        {/* ── Trust strip ── */}
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 mb-8 text-xs text-[var(--muted)]">
          <span className="flex items-center gap-1.5"><span className="text-green-400">✓</span> No account required</span>
          <span className="flex items-center gap-1.5"><span className="text-green-400">✓</span> Anonymous voting</span>
          <span className="flex items-center gap-1.5"><span className="text-green-400">✓</span> Find out who agrees with you</span>
        </div>

        {/* ── Dilemma of the Day ── */}
        <p className="text-xs font-bold uppercase tracking-widest text-[var(--muted)] text-center mb-3">
          Today&apos;s dilemma — see where you stand
        </p>
        <DailyDilemma scenario={dailyScenario} totalVotes={dailyVotes} />

        {/* ── Personality teaser (logged-in users, 7-day dismiss) ── */}
        <PersonalityTeaser locale="en" />

        {/* ── Pick your next — 3 personalised picks + 1 catalog CTA card.
              The CTA (4th slot) is fixed and links to /moral-dilemmas where
              users can filter and sort the full catalog. ── */}
        {pickYourNext.length > 0 && (
          <section className="mb-10">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl sm:text-2xl font-black tracking-tight flex items-center gap-2">
                <span className="text-blue-400" aria-hidden="true">▶</span> Pick your next
              </h2>
              <Link href="/trending" className="text-sm text-[var(--muted)] hover:text-white transition-colors">
                See all →
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {pickYourNext.map(({ scenario: s, badge }) => (
                <VotedDilemmaCard
                  key={s.id}
                  scenario={s}
                  playHref={`/play/${s.id}`}
                  resultsHref={`/results/${s.id}`}
                  totalVotes={voteMap.get(s.id)}
                  badge={badge}
                  locale="en"
                />
              ))}
              <Link
                href="/moral-dilemmas"
                className="group relative flex flex-col justify-between rounded-2xl border border-blue-500/30 bg-gradient-to-br from-blue-500/10 to-purple-500/5 p-5 hover:border-blue-500/60 hover:from-blue-500/15 hover:to-purple-500/10 transition-all motion-reduce:transition-none"
                aria-label={`Explore the full catalog of ${allScenarios.length} dilemmas`}
              >
                <div>
                  <div className="text-3xl mb-3" aria-hidden="true">🔍</div>
                  <p className="text-lg font-black text-white leading-tight mb-2">
                    Explore all {allScenarios.length} dilemmas
                  </p>
                  <p className="text-sm text-[var(--muted)] leading-snug">
                    Browse the full catalog. Filter by category, sort by popularity or divisiveness.
                  </p>
                </div>
                <div className="mt-4 text-xs text-blue-300 font-bold tracking-widest uppercase flex items-center gap-1">
                  Open catalog
                  <span aria-hidden="true" className="transition-transform group-hover:translate-x-1 motion-reduce:transition-none">→</span>
                </div>
              </Link>
            </div>
          </section>
        )}

        {/* ── Browse by theme — quiet pill chip row to surface category
              discovery without bringing back the deleted DilemmaGrid.
              Mobile-first: text-only chips with flex-wrap, min-h 36 px,
              last chip ("All topics →") visually distinct as the broader
              browse path. ── */}
        <div className="mb-8">
          <p className="text-xs font-bold uppercase tracking-widest text-[var(--muted)] text-center mb-3">
            Browse by theme
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Link
              href="/category/morality"
              className="inline-flex items-center px-3.5 py-2 min-h-[36px] rounded-full border border-[var(--border)] hover:border-blue-500/40 text-xs text-[var(--muted)] hover:text-white bg-[var(--surface)]/40 hover:bg-[var(--surface)] transition-all"
            >
              Moral dilemmas
            </Link>
            <Link
              href="/category/survival"
              className="inline-flex items-center px-3.5 py-2 min-h-[36px] rounded-full border border-[var(--border)] hover:border-blue-500/40 text-xs text-[var(--muted)] hover:text-white bg-[var(--surface)]/40 hover:bg-[var(--surface)] transition-all"
            >
              Survival
            </Link>
            <Link
              href="/category/relationships"
              className="inline-flex items-center px-3.5 py-2 min-h-[36px] rounded-full border border-[var(--border)] hover:border-blue-500/40 text-xs text-[var(--muted)] hover:text-white bg-[var(--surface)]/40 hover:bg-[var(--surface)] transition-all"
            >
              Relationships
            </Link>
            <Link
              href="/category/technology"
              className="inline-flex items-center px-3.5 py-2 min-h-[36px] rounded-full border border-[var(--border)] hover:border-blue-500/40 text-xs text-[var(--muted)] hover:text-white bg-[var(--surface)]/40 hover:bg-[var(--surface)] transition-all"
            >
              Technology
            </Link>
            <Link
              href="/moral-dilemmas"
              className="inline-flex items-center gap-1 px-3.5 py-2 min-h-[36px] rounded-full border border-blue-500/30 hover:border-blue-500/60 text-xs text-blue-300/80 hover:text-blue-300 bg-blue-500/5 hover:bg-blue-500/10 transition-all"
            >
              All dilemmas
              <span aria-hidden="true">→</span>
            </Link>
            <Link
              href="/topics"
              className="inline-flex items-center gap-1 px-3.5 py-2 min-h-[36px] rounded-full border border-[var(--border)] hover:border-blue-500/40 text-xs text-[var(--muted)] hover:text-white bg-[var(--surface)]/40 hover:bg-[var(--surface)] transition-all"
            >
              All topics
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>

        {/* ── Compact continuation links — secondary nav. "All topics" was
              removed from this strip since the chip row above already
              surfaces the broader browse path. ── */}
        <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 mb-10 text-sm text-[var(--muted)]">
          <Link href="/trending" className="hover:text-white transition-colors">
            <span aria-hidden="true">🔥</span> Trending
          </Link>
          <span className="text-white/15">·</span>
          <Link href="/leaderboard" className="hover:text-white transition-colors">
            <span aria-hidden="true">🏆</span> Leaderboard
          </Link>
        </div>

        {/* AdSense */}
        <div className="mt-4">
          <AdSlot slot={SLOT_HOME} className="rounded-2xl" />
        </div>

        {/* The header LanguageSwitcher is the visible IT/EN affordance now;
            hreflang link tags in <head> still feed Googlebot for SEO. */}
      </div>
    </>
  )
}
