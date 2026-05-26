import type { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'
import JsonLd from '@/components/JsonLd'
import DilemmaCatalogClient, { type CatalogCopy } from '@/components/DilemmaCatalogClient'
import { scenarios, CATEGORIES, type Category } from '@/lib/scenarios'
import { getFreshDynamicScenarios, getCachedVotesBatch, getCachedVotesBatchDetail } from '@/lib/cached-data'
import { buildCatalogItems, filterCatalog, sortCatalog, categoryCounts } from '@/lib/catalog'

const BASE_URL = 'https://splitvote.io'
const PAGE_SIZE = 24

// force-dynamic mirrors the home + /trending pattern. ISR was tempting (catalog
// content changes at most when admin approves or cron runs), but the underlying
// `getCachedDynamicScenariosByLocale` has its own 1-hour TTL; a build-time fetch
// hiccup poisoned the cache with [] and the page served static-only for 1h.
// Per-request Redis read at /moral-dilemmas is acceptable — not a hot path.
export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  // Mirror the count we'll render. If Redis is unavailable the count falls back
  // to static-only (41) — still accurate, just lower.
  let totalCount = scenarios.length
  try {
    const dynamicAll = await getFreshDynamicScenarios()
    const staticIds = new Set(scenarios.map(s => s.id))
    totalCount = scenarios.length + dynamicAll.filter(d => d.locale === 'en' && !staticIds.has(d.id)).length
  } catch { /* keep static fallback */ }

  const title = `All Moral Dilemmas — ${totalCount}+ Real Ethical Questions to Vote On`
  const description = `Browse the full SplitVote catalog of ${totalCount}+ moral dilemmas across morality, survival, loyalty, justice, freedom, technology, society and relationships. Filter by category, sort by popularity, freshness or divisiveness.`

  return {
    title,
    description,
    alternates: {
      canonical: `${BASE_URL}/moral-dilemmas`,
      languages: {
        'en':         `${BASE_URL}/moral-dilemmas`,
        'it-IT':      `${BASE_URL}/it/dilemmi-morali`,
        'x-default':  `${BASE_URL}/moral-dilemmas`,
      },
    },
    openGraph: {
      title,
      description,
      url: `${BASE_URL}/moral-dilemmas`,
      siteName: 'SplitVote',
      locale: 'en_US',
      type: 'website',
    },
  }
}

const EN_COPY: CatalogCopy = {
  filterLabel:     'Filter by category',
  sortLabel:       'Sort',
  sortOptions:     { popular: 'Popular', fresh: 'Fresh', divisive: 'Divisive' },
  pagerPrev:       'Prev',
  pagerNext:       'Next',
  pagerAriaLabel:  'Catalog pagination',
  emptyTitle:      'No dilemmas in this category yet',
  emptyBody:       'Try another category, or browse all dilemmas.',
  emptyClearLabel: 'See all dilemmas',
  divisiveHint:    'Showing only dilemmas with {min}+ votes — closest to a 50/50 split first.',
  lifestyleBadge:  'Lifestyle',
}

export default async function MoralDilemmasPage() {
  // Fetch dynamic scenarios fresh on every render — matches home + /trending
  // pattern (force-dynamic above). Graceful fallback if Redis is unreachable.
  let dynamicAll: Awaited<ReturnType<typeof getFreshDynamicScenarios>> = []
  try {
    dynamicAll = await getFreshDynamicScenarios()
  } catch { /* fallback to static only */ }

  const items = buildCatalogItems(scenarios, dynamicAll.filter(d => d.locale === 'en'), 'en')
  const allIds = items.map(i => i.id)

  // Vote totals + per-option detail in parallel.
  const [voteObj, voteDetailObj] = await Promise.all([
    getCachedVotesBatch(allIds).catch(() => ({})),
    getCachedVotesBatchDetail(allIds).catch(() => ({})),
  ])

  const voteMap = new Map<string, number>(Object.entries(voteObj))
  const voteDetailMap = new Map(Object.entries(voteDetailObj))

  // Chips with counts (server-side, frozen).
  const counts = categoryCounts(items)
  const chips = CATEGORIES.map(c => ({
    value: c.value,
    label: c.label,
    emoji: c.emoji,
    count: counts.get(c.value) ?? 0,
  })).filter(c => c.value === 'all' || c.count > 0)

  // ItemList JSON-LD: default sort (popular) + no filter + first page only.
  const defaultPageItems = sortCatalog(items, 'popular', voteMap)
    .slice(0, PAGE_SIZE)

  const itemListJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'All Moral Dilemmas — SplitVote Catalog',
    description: `Browse the full catalog of ${items.length} moral dilemmas — vote anonymously, see live global results.`,
    url: `${BASE_URL}/moral-dilemmas`,
    numberOfItems: items.length,
    itemListElement: defaultPageItems.map((s, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: s.question,
      url: `${BASE_URL}/play/${s.id}`,
    })),
  }

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home',           item: BASE_URL },
      { '@type': 'ListItem', position: 2, name: 'Moral Dilemmas', item: `${BASE_URL}/moral-dilemmas` },
    ],
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-12 sm:py-16">
      <JsonLd data={itemListJsonLd} />
      <JsonLd data={breadcrumbJsonLd} />

      {/* Hero */}
      <div className="text-center mb-10">
        <div className="inline-block bg-red-500/10 text-red-400 text-xs font-bold tracking-widest uppercase px-4 py-2 rounded-full mb-6 border border-red-500/20">
          {items.length} dilemmas · live global votes
        </div>
        <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-4 leading-none">
          Every{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-purple-400 to-blue-400">
            Moral Dilemma
          </span>
        </h1>
        <p className="text-lg text-[var(--muted)] max-w-2xl mx-auto">
          The complete SplitVote catalog. Filter by category. Sort by popularity, freshness, or how evenly the world splits.
        </p>
      </div>

      {/* Catalog */}
      <Suspense fallback={null}>
        <DilemmaCatalogClient
          items={items}
          chips={chips as Array<{ value: Category | 'all'; label: string; emoji: string; count: number }>}
          voteMap={voteObj as Record<string, number>}
          voteDetail={voteDetailObj as Record<string, { a: number; b: number }>}
          pathBase="/moral-dilemmas"
          playPathBase="/play"
          resultsPathBase="/results"
          locale="en"
          pageSize={PAGE_SIZE}
          copy={EN_COPY}
        />
      </Suspense>

      {/* Cross-links */}
      <div className="rounded-2xl border border-[var(--border)] bg-[#0d0d1a]/40 p-5 mt-12 space-y-2">
        <p className="text-xs text-[var(--muted)] uppercase tracking-widest font-bold mb-3">
          Explore more
        </p>
        <div className="flex flex-wrap gap-3">
          <Link href="/trending" className="text-sm text-blue-400 hover:text-blue-300 underline underline-offset-2 transition-colors">
            Trending Dilemmas →
          </Link>
          <Link href="/topics" className="text-sm text-blue-400 hover:text-blue-300 underline underline-offset-2 transition-colors">
            Browse Topics →
          </Link>
          <Link href="/personality" className="text-sm text-purple-400 hover:text-purple-300 underline underline-offset-2 transition-colors">
            Your Moral Profile →
          </Link>
          <Link href="/it/dilemmi-morali" className="text-sm text-purple-400 hover:text-purple-300 underline underline-offset-2 transition-colors">
            Versione italiana →
          </Link>
        </div>
      </div>
    </div>
  )
}
