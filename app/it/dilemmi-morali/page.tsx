import type { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'
import JsonLd from '@/components/JsonLd'
import DilemmaCatalogClient, { type CatalogCopy } from '@/components/DilemmaCatalogClient'
import { scenarios, CATEGORIES, type Category } from '@/lib/scenarios'
import { CATEGORY_LABELS_IT, translateScenarioToItalian } from '@/lib/scenarios-it'
import { getFreshDynamicScenarios, getCachedVotesBatch, getCachedVotesBatchDetail } from '@/lib/cached-data'
import { buildCatalogItems, sortCatalog, categoryCounts } from '@/lib/catalog'

const BASE_URL = 'https://splitvote.io'
const PAGE_SIZE = 24

// force-dynamic — see EN catalog comment. Catalog needs fresh Redis read per
// request to avoid build-time empty-cache poisoning.
export const dynamic = 'force-dynamic'

const IT_CATEGORY_EMOJI: Record<string, string> = {
  all:           '🌐',
  morality:      '🧭',
  survival:      '⚡',
  loyalty:       '🤝',
  justice:       '⚖️',
  freedom:       '🗽',
  technology:    '🤖',
  society:       '🌍',
  relationships: '❤️',
  lifestyle:     '🎭',
}

export async function generateMetadata(): Promise<Metadata> {
  let totalCount = scenarios.length
  try {
    const dynamicAll = await getFreshDynamicScenarios()
    const staticIds = new Set(scenarios.map(s => s.id))
    totalCount = scenarios.length + dynamicAll.filter(d => d.locale === 'it' && !staticIds.has(d.id)).length
  } catch { /* keep static fallback */ }

  const title = `Tutti i Dilemmi Morali — ${totalCount}+ domande etiche reali da votare`
  const description = `Sfoglia il catalogo SplitVote completo: ${totalCount}+ dilemmi morali tra moralità, sopravvivenza, lealtà, giustizia, libertà, tecnologia, società e relazioni. Filtra per categoria, ordina per popolarità, novità o divisività.`

  return {
    title,
    description,
    alternates: {
      canonical: `${BASE_URL}/it/dilemmi-morali`,
      languages: {
        'it-IT':     `${BASE_URL}/it/dilemmi-morali`,
        'en':        `${BASE_URL}/moral-dilemmas`,
        'x-default': `${BASE_URL}/moral-dilemmas`,
      },
    },
    openGraph: {
      title,
      description,
      url: `${BASE_URL}/it/dilemmi-morali`,
      siteName: 'SplitVote',
      locale: 'it_IT',
      type: 'website',
    },
  }
}

const IT_COPY: CatalogCopy = {
  filterLabel:     'Filtra per categoria',
  sortLabel:       'Ordina',
  sortOptions:     { popular: 'Popolari', fresh: 'Recenti', divisive: 'Divisivi' },
  pagerPrev:       'Indietro',
  pagerNext:       'Avanti',
  pagerAriaLabel:  'Paginazione catalogo',
  emptyTitle:      'Nessun dilemma in questa categoria',
  emptyBody:       'Prova un\'altra categoria, o sfoglia tutti i dilemmi.',
  emptyClearLabel: 'Vedi tutti i dilemmi',
  divisiveHint:    'Mostriamo solo dilemmi con {min}+ voti — più vicini al 50/50 prima.',
  lifestyleBadge:  'Lifestyle',
}

export default async function DilemmiMoraliPage() {
  let dynamicAll: Awaited<ReturnType<typeof getFreshDynamicScenarios>> = []
  try {
    dynamicAll = await getFreshDynamicScenarios()
  } catch { /* fallback to static only */ }

  // Static → Italian translation (mirrors home pattern).
  const staticIt = scenarios.map(translateScenarioToItalian)

  const items = buildCatalogItems(staticIt, dynamicAll.filter(d => d.locale === 'it'), 'it')
  const allIds = items.map(i => i.id)

  const [voteObj, voteDetailObj] = await Promise.all([
    getCachedVotesBatch(allIds).catch(() => ({})),
    getCachedVotesBatchDetail(allIds).catch(() => ({})),
  ])

  const voteMap = new Map<string, number>(Object.entries(voteObj))

  // Chips with IT labels.
  const counts = categoryCounts(items)
  const chips = CATEGORIES.map(c => ({
    value: c.value,
    label: c.value === 'all' ? 'Tutti' : (CATEGORY_LABELS_IT[c.value] ?? c.label),
    emoji: IT_CATEGORY_EMOJI[c.value] ?? c.emoji,
    count: counts.get(c.value) ?? 0,
  })).filter(c => c.value === 'all' || c.count > 0)

  // JSON-LD: default sort, no filter, first page.
  const defaultPageItems = sortCatalog(items, 'popular', voteMap).slice(0, PAGE_SIZE)

  const itemListJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Tutti i Dilemmi Morali — Catalogo SplitVote',
    description: `Sfoglia il catalogo completo di ${items.length} dilemmi morali — vota in anonimo, scopri i risultati globali in tempo reale.`,
    url: `${BASE_URL}/it/dilemmi-morali`,
    numberOfItems: items.length,
    itemListElement: defaultPageItems.map((s, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: s.question,
      url: `${BASE_URL}/it/play/${s.id}`,
    })),
  }

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home',          item: `${BASE_URL}/it` },
      { '@type': 'ListItem', position: 2, name: 'Dilemmi morali', item: `${BASE_URL}/it/dilemmi-morali` },
    ],
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-12 sm:py-16">
      <JsonLd data={itemListJsonLd} />
      <JsonLd data={breadcrumbJsonLd} />

      <div className="text-center mb-10">
        <div className="inline-block bg-red-500/10 text-red-400 text-xs font-bold tracking-widest uppercase px-4 py-2 rounded-full mb-6 border border-red-500/20">
          {items.length} dilemmi · voti globali in tempo reale
        </div>
        <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-4 leading-none">
          Tutti i{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-purple-400 to-blue-400">
            Dilemmi Morali
          </span>
        </h1>
        <p className="text-lg text-[var(--muted)] max-w-2xl mx-auto">
          Il catalogo completo di SplitVote. Filtra per categoria. Ordina per popolarità, novità o quanto il mondo si divide a metà.
        </p>
      </div>

      <Suspense fallback={null}>
        <DilemmaCatalogClient
          items={items}
          chips={chips as Array<{ value: Category | 'all'; label: string; emoji: string; count: number }>}
          voteMap={voteObj as Record<string, number>}
          voteDetail={voteDetailObj as Record<string, { a: number; b: number }>}
          pathBase="/it/dilemmi-morali"
          playPathBase="/it/play"
          resultsPathBase="/it/results"
          locale="it"
          pageSize={PAGE_SIZE}
          copy={IT_COPY}
        />
      </Suspense>

      <div className="rounded-2xl border border-[var(--border)] bg-[#0d0d1a]/40 p-5 mt-12 space-y-2">
        <p className="text-xs text-[var(--muted)] uppercase tracking-widest font-bold mb-3">
          Esplora di più
        </p>
        <div className="flex flex-wrap gap-3">
          <Link href="/it/trending" className="text-sm text-blue-400 hover:text-blue-300 underline underline-offset-2 transition-colors">
            Dilemmi di tendenza →
          </Link>
          <Link href="/it/temi" className="text-sm text-blue-400 hover:text-blue-300 underline underline-offset-2 transition-colors">
            Esplora per tema →
          </Link>
          <Link href="/it/personality" className="text-sm text-purple-400 hover:text-purple-300 underline underline-offset-2 transition-colors">
            Il tuo profilo morale →
          </Link>
          <Link href="/moral-dilemmas" className="text-sm text-purple-400 hover:text-purple-300 underline underline-offset-2 transition-colors">
            English version →
          </Link>
        </div>
      </div>
    </div>
  )
}
