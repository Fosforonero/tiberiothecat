import type { Metadata } from 'next'
import CatalogPage, {
  type CatalogPageParams,
  resolveCatalogParams,
  buildCatalogUrl,
} from '@/components/CatalogPage'
import { scenarios } from '@/lib/scenarios'
import { CATEGORY_LABELS_IT } from '@/lib/scenarios-it'
import { getFreshDynamicScenarios } from '@/lib/cached-data'
import { buildCatalogItems } from '@/lib/catalog'

const BASE_URL = 'https://splitvote.io'
const PATH = '/it/dilemmi-morali'
const EN_PATH = '/moral-dilemmas'

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
  const params = resolveCatalogParams(raw, 'it')

  let totalCount = scenarios.length
  try {
    const dynamicAll = await getFreshDynamicScenarios()
    const items = buildCatalogItems(scenarios, dynamicAll.filter(d => d.locale === 'it'), 'it')
    totalCount = items.length
  } catch { /* keep static fallback */ }

  const pageSuffix = params.page > 1 ? ` — pagina ${params.page}` : ''
  const categoryLabel = params.category !== 'all'
    ? (CATEGORY_LABELS_IT[params.category] ?? params.category)
    : null

  const title = `Tutti i Dilemmi Morali${categoryLabel ? ` — ${categoryLabel}` : ''}${pageSuffix} — ${totalCount}+ domande etiche reali`
  const description = categoryLabel
    ? `Sfoglia il catalogo SplitVote filtrato per ${categoryLabel}. Voti globali in tempo reale.`
    : `Sfoglia il catalogo SplitVote di ${totalCount}+ dilemmi morali tra moralità, sopravvivenza, lealtà, giustizia, libertà, tecnologia, società e relazioni. Filtra, ordina, vota.`

  const canonicalUrl = `${BASE_URL}${buildCatalogUrl(PATH, params, {}, 'it')}`
  const enUrl = buildCatalogUrl(EN_PATH, params, {}, 'en')

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
      languages: {
        'it-IT':    canonicalUrl,
        en:         `${BASE_URL}${enUrl}`,
        'x-default': `${BASE_URL}${EN_PATH}`,
      },
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: 'SplitVote',
      locale: 'it_IT',
      type: 'website',
    },
  }
}

export default async function Page({ searchParams }: { searchParams: Search }) {
  const raw = normalizeSearch(searchParams)
  const params = resolveCatalogParams(raw, 'it')

  const linkTags: Array<{ rel: string; href: string }> = []
  if (params.page > 1) {
    linkTags.push({
      rel: 'prev',
      href: `${BASE_URL}${buildCatalogUrl(PATH, params, { page: params.page - 1 }, 'it')}`,
    })
  }

  return (
    <>
      {linkTags.map(t => (
        <link key={t.rel} rel={t.rel} href={t.href} />
      ))}
      <CatalogPage
        locale="it"
        pathBase={PATH}
        playHrefBase="/it/play"
        resultsHrefBase="/it/results"
        searchParams={raw}
      />
    </>
  )
}
