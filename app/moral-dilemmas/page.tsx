import type { Metadata } from 'next'
import CatalogPage, {
  type CatalogPageParams,
  resolveCatalogParams,
  buildCatalogUrl,
} from '@/components/CatalogPage'
import { scenarios } from '@/lib/scenarios'
import { getFreshDynamicScenarios } from '@/lib/cached-data'
import { buildCatalogItems } from '@/lib/catalog'

const BASE_URL = 'https://splitvote.io'
const PATH = '/moral-dilemmas'
const IT_PATH = '/it/dilemmi-morali'

// Catalog needs fresh Redis read per request (URL state has too many
// combinations to ISR-cache, and the underlying cache had build-time
// poisoning issues — see earlier commits).
export const dynamic = 'force-dynamic'

type Search = Record<string, string | string[] | undefined>

function normalizeSearch(searchParams: Search): CatalogPageParams {
  const pick = (k: string) => {
    const v = searchParams[k]
    if (Array.isArray(v)) return v[0]
    return v
  }
  return {
    q:    pick('q'),
    cat:  pick('cat'),
    sort: pick('sort'),
    vs:   pick('vs'),
    div:  pick('div'),
    page: pick('page'),
  }
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Search
}): Promise<Metadata> {
  const raw = normalizeSearch(searchParams)
  const params = resolveCatalogParams(raw, 'en')

  // Total count for "X+" in description.
  let totalCount = scenarios.length
  try {
    const dynamicAll = await getFreshDynamicScenarios()
    const items = buildCatalogItems(scenarios, dynamicAll.filter(d => d.locale === 'en'), 'en')
    totalCount = items.length
  } catch { /* keep static fallback */ }

  const pageSuffix = params.page > 1 ? ` — page ${params.page}` : ''
  const categoryHint = params.category !== 'all'
    ? ` — ${params.category}`
    : ''

  const title = `All Moral Dilemmas${categoryHint}${pageSuffix} — ${totalCount}+ Real Ethical Questions`
  const description = params.category !== 'all'
    ? `Browse the SplitVote catalog filtered by ${params.category}. Real-time global votes on every dilemma.`
    : `Browse the full SplitVote catalog of ${totalCount}+ moral dilemmas across morality, survival, loyalty, justice, freedom, technology, society and relationships. Filter, sort, vote.`

  // Per-page canonical points at the same page (clean params only).
  const canonicalUrl = `${BASE_URL}${buildCatalogUrl(PATH, params, {}, 'en')}`
  const itPath = buildCatalogUrl(IT_PATH, params, {}, 'it')

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
      languages: {
        en:         `${BASE_URL}${buildCatalogUrl(PATH, params, {}, 'en')}`,
        'it-IT':    `${BASE_URL}${itPath}`,
        'x-default': `${BASE_URL}${PATH}`,
      },
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: 'SplitVote',
      locale: 'en_US',
      type: 'website',
    },
  }
}

export default async function Page({ searchParams }: { searchParams: Search }) {
  const raw = normalizeSearch(searchParams)
  const params = resolveCatalogParams(raw, 'en')

  // rel=prev link (rel=next is set by the Paginator's <Link rel="next">)
  const linkTags: Array<{ rel: string; href: string }> = []
  if (params.page > 1) {
    linkTags.push({
      rel: 'prev',
      href: `${BASE_URL}${buildCatalogUrl(PATH, params, { page: params.page - 1 }, 'en')}`,
    })
  }

  return (
    <>
      {linkTags.map(t => (
        <link key={t.rel} rel={t.rel} href={t.href} />
      ))}
      <CatalogPage
        locale="en"
        pathBase={PATH}
        playHrefBase="/play"
        resultsHrefBase="/results"
        searchParams={raw}
      />
    </>
  )
}
