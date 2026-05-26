import Link from 'next/link'
import JsonLd from '@/components/JsonLd'
import CatalogHero from '@/components/CatalogHero'
import CatalogFeaturedRow from '@/components/CatalogFeaturedRow'
import CatalogToolbar, { type CatalogToolbarCopy } from '@/components/CatalogToolbar'
import CatalogCard, { type CatalogCardBadge } from '@/components/CatalogCard'
import CatalogPaginator from '@/components/CatalogPaginator'
import CatalogGamificationBlock from '@/components/CatalogGamificationBlock'
import CatalogFooterCta from '@/components/CatalogFooterCta'
import { scenarios, CATEGORIES, type Category } from '@/lib/scenarios'
import { CATEGORY_LABELS_IT, translateScenarioToItalian } from '@/lib/scenarios-it'
import { getFreshDynamicScenarios, getCachedVotesBatch, getCachedVotesBatchDetail } from '@/lib/cached-data'
import {
  buildCatalogItems,
  filterCatalog,
  sortCatalog,
  searchCatalog,
  filterByVoteState,
  filterByDivisivity,
  divisivityOf,
  pickDaily,
  pickMostDivisive,
  categoryCounts,
  categoryFromSlug,
  slugFromCategory,
  type SortMode,
  type VoteState,
  type CatalogItem,
} from '@/lib/catalog'

const BASE_URL = 'https://splitvote.io'
export const PAGE_SIZE = 18

export interface CatalogPageParams {
  q?:    string
  cat?:  string
  sort?: string
  vs?:   string
  div?:  string
  page?: string
}

export interface ResolvedCatalogParams {
  q:          string
  category:   Category | 'all'
  sort:       SortMode
  voteState:  VoteState
  divisivity: number
  page:       number
}

export function resolveCatalogParams(
  searchParams: CatalogPageParams,
  locale: 'en' | 'it',
): ResolvedCatalogParams {
  const validSorts: SortMode[] = ['popular', 'fresh', 'divisive']
  const validVS:    VoteState[] = ['all', 'unvoted', 'voted']

  const q = (searchParams.q ?? '').trim().slice(0, 200)
  const category = categoryFromSlug(searchParams.cat, locale)
  const sort: SortMode = validSorts.includes(searchParams.sort as SortMode)
    ? (searchParams.sort as SortMode) : 'popular'
  const voteState: VoteState = validVS.includes(searchParams.vs as VoteState)
    ? (searchParams.vs as VoteState) : 'all'
  const divRaw = parseInt(searchParams.div ?? '0', 10)
  const divisivity = Number.isFinite(divRaw) ? Math.max(0, Math.min(100, divRaw)) : 0
  const pageRaw = parseInt(searchParams.page ?? '1', 10)
  const page = Number.isFinite(pageRaw) && pageRaw >= 1 ? pageRaw : 1

  return { q, category, sort, voteState, divisivity, page }
}

export function buildCatalogUrl(
  pathBase: string,
  params: ResolvedCatalogParams,
  patch: Partial<ResolvedCatalogParams>,
  locale: 'en' | 'it',
): string {
  const next = { ...params, ...patch }
  const sp = new URLSearchParams()
  if (next.q)                          sp.set('q',    next.q)
  if (next.category   !== 'all')       sp.set('cat',  slugFromCategory(next.category, locale))
  if (next.sort       !== 'popular')   sp.set('sort', next.sort)
  if (next.voteState  !== 'all')       sp.set('vs',   next.voteState)
  if (next.divisivity > 0)             sp.set('div',  String(next.divisivity))
  if (next.page       !== 1)           sp.set('page', String(next.page))
  const qs = sp.toString()
  return qs ? `${pathBase}?${qs}` : pathBase
}

// ── Copy ────────────────────────────────────────────────────────────

interface CatalogPageCopy {
  toolbar:           CatalogToolbarCopy
  emptyTitle:        string
  emptyBody:         string
  emptyReset:        string
  pagerPrev:         string
  pagerNext:         string
  pagerAriaLabel:    string
}

const EN_COPY: CatalogPageCopy = {
  toolbar: {
    searchPlaceholder: 'Search a dilemma…',
    searchClear:       'Clear search',
    sortLabel:         'SORT BY',
    sortOptions:       { popular: 'Most popular', fresh: 'Newest', divisive: 'Most divisive' },
    voteStateLabel:    'Status',
    voteStateOptions:  { all: 'All', unvoted: 'Never voted', voted: 'Already voted' },
    filterLabel:       'Filter by category',
    allLabel:          'All',
    divisivityLabel:   'DIVISIVITY',
    divisivityMin:     'consensus',
    divisivityMax:     '50/50 split',
    divisivitySuffix:  '%',
    resultsCount:      (n: number) => `${n} ${n === 1 ? 'dilemma' : 'dilemmas'}`,
  },
  emptyTitle:     'No dilemmas match',
  emptyBody:      'Try widening filters or reset everything.',
  emptyReset:     'Reset filters',
  pagerPrev:      'Previous',
  pagerNext:      'Next',
  pagerAriaLabel: 'Catalog pagination',
}

const IT_COPY: CatalogPageCopy = {
  toolbar: {
    searchPlaceholder: 'Cerca un dilemma…',
    searchClear:       'Cancella ricerca',
    sortLabel:         'ORDINA',
    sortOptions:       { popular: 'Più popolari', fresh: 'Più recenti', divisive: 'Più divisivi' },
    voteStateLabel:    'Stato',
    voteStateOptions:  { all: 'Tutti', unvoted: 'Mai votati', voted: 'Già votati' },
    filterLabel:       'Filtra per categoria',
    allLabel:          'Tutti',
    divisivityLabel:   'DIVISIVITÀ',
    divisivityMin:     'consenso',
    divisivityMax:     'spaccato 50/50',
    divisivitySuffix:  '%',
    resultsCount:      (n: number) => `${n} ${n === 1 ? 'dilemma' : 'dilemmi'}`,
  },
  emptyTitle:     'Nessun dilemma corrisponde',
  emptyBody:      'Prova ad allargare i filtri o resetta tutto.',
  emptyReset:     'Resetta filtri',
  pagerPrev:      'Indietro',
  pagerNext:      'Avanti',
  pagerAriaLabel: 'Paginazione catalogo',
}

// ── Component ───────────────────────────────────────────────────────

interface Props {
  locale:       'en' | 'it'
  pathBase:     string
  playHrefBase: string
  resultsHrefBase: string
  searchParams: CatalogPageParams
}

export default async function CatalogPage({
  locale, pathBase, playHrefBase, resultsHrefBase, searchParams,
}: Props) {
  const params = resolveCatalogParams(searchParams, locale)
  const copy = locale === 'it' ? IT_COPY : EN_COPY

  // Fetch dynamic scenarios fresh on every render.
  let dynamicAll: Awaited<ReturnType<typeof getFreshDynamicScenarios>> = []
  try {
    dynamicAll = await getFreshDynamicScenarios()
  } catch { /* fallback to static only */ }

  // Static (translated for IT) + dynamic for this locale.
  const staticItems = locale === 'it'
    ? scenarios.map(translateScenarioToItalian)
    : scenarios
  const dynamicForLocale = dynamicAll.filter(d => d.locale === locale)
  const allItems = buildCatalogItems(staticItems, dynamicForLocale, locale)
  const allIds = allItems.map(i => i.id)

  // Vote data — batched.
  const [voteObj, voteDetailObj] = await Promise.all([
    getCachedVotesBatch(allIds).catch(() => ({})),
    getCachedVotesBatchDetail(allIds).catch(() => ({})),
  ])
  const voteMap       = new Map<string, number>(Object.entries(voteObj))
  const voteDetailMap = new Map(Object.entries(voteDetailObj))

  const totalVotes = [...voteMap.values()].reduce((s, v) => s + v, 0)

  // Featured row (computed BEFORE filtering so the user always sees them).
  const dailyItem = pickDaily(allItems)
  const divisiveItem = pickMostDivisive(allItems, voteDetailMap, dailyItem?.id)

  const dailyFeatured = dailyItem ? {
    item:  dailyItem,
    votes: voteMap.get(dailyItem.id) ?? 0,
    aPct:  computePctA(voteDetailMap.get(dailyItem.id)),
  } : undefined
  const divisiveFeatured = divisiveItem ? {
    item:  divisiveItem,
    votes: voteMap.get(divisiveItem.id) ?? 0,
    aPct:  computePctA(voteDetailMap.get(divisiveItem.id)),
  } : undefined

  // For the rest of the catalog, exclude featured ids so they don't double-appear.
  const featuredIds = new Set<string>()
  if (dailyItem)    featuredIds.add(dailyItem.id)
  if (divisiveItem) featuredIds.add(divisiveItem.id)
  const catalogPool = allItems.filter(i => !featuredIds.has(i.id))

  // Voted ids — server-side voted IDs would require a per-request fetch from
  // Supabase; for sprint-1 the catalog server-renders with empty voted set and
  // the client overlays the "YOU VOTED" badge via localStorage. The filter
  // 'voteState=voted'/'unvoted' uses an empty set server-side too; this is a
  // known sprint-1 limitation (HANDOFF: "Voted state persistente da
  // localStorage + sync al login") — server filter will work for logged-in
  // users once cross-device sync is wired.
  const votedIds = new Set<string>()

  // Apply filters in order: search → category → vote-state → divisivity → sort.
  let filtered = searchCatalog(catalogPool, params.q)
  filtered = filterCatalog(filtered, params.category)
  filtered = filterByVoteState(filtered, params.voteState, votedIds)
  filtered = filterByDivisivity(filtered, params.divisivity, voteDetailMap)
  const sorted = sortCatalog(filtered, params.sort, voteMap, voteDetailMap)

  // Paginate.
  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE))
  const page = Math.min(params.page, totalPages)
  const visible = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  // Chips with counts.
  const counts = categoryCounts(catalogPool)
  const allCount = counts.get('all') ?? 0
  const chips = [
    { value: 'all' as const, label: copy.toolbar.allLabel, count: allCount },
    ...CATEGORIES.filter(c => c.value !== 'all').map(c => ({
      value: c.value as Category,
      label: locale === 'it' ? (CATEGORY_LABELS_IT[c.value] ?? c.label) : c.label,
      count: counts.get(c.value as Category) ?? 0,
    })).filter(c => c.count > 0),
  ]

  // JSON-LD.
  const itemListJsonLd = {
    '@context':       'https://schema.org',
    '@type':          'ItemList',
    name:             locale === 'it' ? 'Tutti i dilemmi morali — Catalogo SplitVote' : 'All moral dilemmas — SplitVote catalog',
    description:      locale === 'it'
      ? `Catalogo completo di ${allItems.length} dilemmi morali con voti globali in tempo reale.`
      : `Full catalog of ${allItems.length} moral dilemmas with live global votes.`,
    url:              `${BASE_URL}${pathBase}`,
    numberOfItems:    allItems.length,
    itemListElement:  visible.map((item, idx) => ({
      '@type':   'ListItem',
      position:  (page - 1) * PAGE_SIZE + idx + 1,
      name:      item.question,
      url:       `${BASE_URL}${playHrefBase}/${item.id}`,
    })),
  }

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${BASE_URL}${locale === 'it' ? '/it' : ''}/` },
      {
        '@type': 'ListItem',
        position: 2,
        name: locale === 'it' ? 'Dilemmi morali' : 'Moral dilemmas',
        item: `${BASE_URL}${pathBase}`,
      },
    ],
  }

  const isEmpty = visible.length === 0

  // Reset URL strips all params.
  const resetHref = pathBase

  return (
    <>
      <JsonLd data={itemListJsonLd} />
      <JsonLd data={breadcrumbJsonLd} />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-24">
        <CatalogHero
          locale={locale}
          total={allItems.length}
          totalVotes={totalVotes}
        />

        <CatalogFeaturedRow
          daily={dailyFeatured}
          divisive={divisiveFeatured}
          locale={locale}
          playHrefBase={playHrefBase}
          resultsHrefBase={resultsHrefBase}
        />

        <CatalogToolbar
          pathBase={pathBase}
          locale={locale}
          query={params.q}
          category={params.category}
          sort={params.sort}
          voteState={params.voteState}
          divisivity={params.divisivity}
          chips={chips}
          totalCount={sorted.length}
          copy={copy.toolbar}
        />

        {isEmpty ? (
          <div className="border border-dashed border-[var(--border)] rounded-2xl py-16 px-6 text-center text-[var(--muted)] mb-8">
            <div aria-hidden="true" className="font-mono text-4xl text-[var(--muted-2,#5e7299)] mb-3">∅</div>
            <h2 className="text-[var(--text)] text-lg m-0 mb-1.5">{copy.emptyTitle}</h2>
            <p className="m-0 mb-4 text-sm">{copy.emptyBody}</p>
            <Link
              href={resetHref}
              className="inline-block px-4 py-2 border border-[var(--border-hi)] bg-[var(--surface)] text-[var(--text)] text-[12px] font-semibold rounded-lg"
            >
              {copy.emptyReset}
            </Link>
          </div>
        ) : (
          <h2 className="sr-only">
            {locale === 'it' ? `Pagina ${page} di ${totalPages}` : `Page ${page} of ${totalPages}`}
          </h2>
        )}

        {!isEmpty && (
          <div className="grid gap-3.5 sm:gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 mb-6">
            {visible.map(item => (
              <CatalogCard
                key={item.id}
                id={item.id}
                question={item.question}
                optionA={item.optionA}
                optionB={item.optionB}
                emoji={item.emoji}
                category={item.category}
                locale={locale}
                playHref={`${playHrefBase}/${item.id}`}
                resultsHref={`${resultsHrefBase}/${item.id}`}
                totalVotes={voteMap.get(item.id) ?? 0}
                aPct={computePctAOrUndefined(voteDetailMap.get(item.id))}
                isLifestyle={item.isLifestyle}
              />
            ))}
          </div>
        )}

        <CatalogPaginator
          current={page}
          total={totalPages}
          hrefFor={(p) => buildCatalogUrl(pathBase, params, { page: p }, locale)}
          prevLabel={copy.pagerPrev}
          nextLabel={copy.pagerNext}
          ariaLabel={copy.pagerAriaLabel}
        />

        <CatalogGamificationBlock
          locale={locale}
          total={allItems.length}
          keepGoingHref={pathBase}
          compareHref={locale === 'it' ? '/it/personality' : '/personality'}
        />

        <CatalogFooterCta
          locale={locale}
          suggestHref={locale === 'it' ? '/it/submit-poll' : '/submit-poll'}
          profileHref={locale === 'it' ? '/it/personality' : '/personality'}
        />
      </div>
    </>
  )
}

function computePctA(detail: { a: number; b: number } | undefined): number {
  if (!detail) return 50
  const total = detail.a + detail.b
  if (total === 0) return 50
  return Math.round((detail.a / total) * 100)
}

function computePctAOrUndefined(detail: { a: number; b: number } | undefined): number | undefined {
  if (!detail) return undefined
  const total = detail.a + detail.b
  if (total === 0) return undefined
  return Math.round((detail.a / total) * 100)
}
