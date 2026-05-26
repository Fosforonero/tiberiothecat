'use client'

import { useMemo, useCallback, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import VotedDilemmaCard from '@/components/VotedDilemmaCard'
import FreshFirstGrid from '@/components/FreshFirstGrid'
import CategoryChipFilter, { type CategoryChip } from '@/components/CategoryChipFilter'
import SortSelect from '@/components/SortSelect'
import Paginator from '@/components/Paginator'
import {
  filterCatalog,
  sortCatalog,
  type CatalogItem,
  type SortMode,
  type VoteDetail,
  SORT_MODES,
  DIVISIVE_MIN_VOTES,
} from '@/lib/catalog'
import type { Category } from '@/lib/scenarios'

export interface CatalogCopy {
  filterLabel:     string
  sortLabel:       string
  sortOptions:     Record<SortMode, string>
  pagerPrev:       string
  pagerNext:       string
  pagerAriaLabel:  string
  emptyTitle:      string
  emptyBody:       string
  emptyClearLabel: string
  divisiveHint:    string
  lifestyleBadge:  string
}

interface Props {
  items:         CatalogItem[]
  chips:         CategoryChip[]
  voteMap:       Record<string, number>
  voteDetail:    Record<string, VoteDetail>
  pathBase:      string                  // '/moral-dilemmas' | '/it/dilemmi-morali'
  playPathBase:  string                  // '/play' | '/it/play'
  resultsPathBase: string                // '/results' | '/it/results'
  locale:        'en' | 'it'
  pageSize:      number                  // 24
  copy:          CatalogCopy
}

const DEFAULT_SORT: SortMode = 'popular'
const DEFAULT_CATEGORY: Category | 'all' = 'all'
const DEFAULT_PAGE = 1

function parseCategory(raw: string | null, valid: Set<string>): Category | 'all' {
  if (!raw) return DEFAULT_CATEGORY
  if (raw === 'all') return 'all'
  return valid.has(raw) ? (raw as Category) : DEFAULT_CATEGORY
}

function parseSort(raw: string | null): SortMode {
  if (!raw) return DEFAULT_SORT
  return (SORT_MODES as readonly string[]).includes(raw) ? (raw as SortMode) : DEFAULT_SORT
}

function parsePage(raw: string | null): number {
  if (!raw) return DEFAULT_PAGE
  const n = parseInt(raw, 10)
  return Number.isFinite(n) && n >= 1 ? n : DEFAULT_PAGE
}

export default function DilemmaCatalogClient({
  items,
  chips,
  voteMap,
  voteDetail,
  pathBase,
  playPathBase,
  resultsPathBase,
  locale,
  pageSize,
  copy,
}: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const validCategoryValues = useMemo(
    () => new Set(chips.map(c => c.value).filter(v => v !== 'all') as string[]),
    [chips],
  )

  const category = parseCategory(searchParams.get('category'), validCategoryValues)
  const sort     = parseSort(searchParams.get('sort'))
  const pageRaw  = parsePage(searchParams.get('page'))

  const voteMapM     = useMemo(() => new Map<string, number>(Object.entries(voteMap)),    [voteMap])
  const voteDetailM  = useMemo(() => new Map<string, VoteDetail>(Object.entries(voteDetail)), [voteDetail])

  const filteredSorted = useMemo(() => {
    const filtered = filterCatalog(items, category)
    return sortCatalog(filtered, sort, voteMapM, voteDetailM)
  }, [items, category, sort, voteMapM, voteDetailM])

  const totalPages = Math.max(1, Math.ceil(filteredSorted.length / pageSize))
  const page = Math.min(pageRaw, totalPages)
  const visible = filteredSorted.slice((page - 1) * pageSize, page * pageSize)

  // Clamp page in URL if out-of-bounds (e.g. stale share link).
  useEffect(() => {
    if (pageRaw !== page) {
      updateUrl({ page })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageRaw, page])

  const updateUrl = useCallback(
    (patch: { category?: Category | 'all'; sort?: SortMode; page?: number }) => {
      const params = new URLSearchParams(searchParams.toString())
      const next = {
        category: patch.category ?? category,
        sort:     patch.sort     ?? sort,
        page:     patch.page     ?? page,
      }
      // Strip defaults so canonical URL stays clean.
      if (next.category === DEFAULT_CATEGORY) params.delete('category'); else params.set('category', next.category)
      if (next.sort     === DEFAULT_SORT)     params.delete('sort');     else params.set('sort',     next.sort)
      if (next.page     === DEFAULT_PAGE)     params.delete('page');     else params.set('page',     String(next.page))
      const qs = params.toString()
      router.replace(qs ? `${pathBase}?${qs}` : pathBase, { scroll: false })
    },
    [searchParams, category, sort, page, router, pathBase],
  )

  const onCategoryChange = (next: Category | 'all') => updateUrl({ category: next, page: 1 })
  const onSortChange     = (next: SortMode)         => updateUrl({ sort: next,     page: 1 })
  const onPageChange     = (next: number) => {
    updateUrl({ page: next })
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const isEmpty = visible.length === 0

  return (
    <div className="w-full">
      {/* Filter + sort bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div className="flex-1 min-w-0">
          <CategoryChipFilter
            chips={chips}
            active={category}
            onChange={onCategoryChange}
            label={copy.filterLabel}
          />
        </div>
        <div className="flex-shrink-0">
          <SortSelect
            value={sort}
            onChange={onSortChange}
            labels={copy.sortOptions}
            ariaLabel={copy.sortLabel}
          />
        </div>
      </div>

      {sort === 'divisive' && (
        <p className="text-xs text-[var(--muted)] mb-4">
          {copy.divisiveHint.replace('{min}', String(DIVISIVE_MIN_VOTES))}
        </p>
      )}

      {isEmpty ? (
        <div className="border border-[var(--border)] rounded-2xl p-8 text-center">
          <h2 className="text-xl font-bold mb-2">{copy.emptyTitle}</h2>
          <p className="text-[var(--muted)] mb-4">{copy.emptyBody}</p>
          <button
            type="button"
            onClick={() => onCategoryChange('all')}
            className="inline-flex items-center px-4 py-2 rounded-full bg-white text-black text-sm font-semibold"
          >
            {copy.emptyClearLabel}
          </button>
        </div>
      ) : (
        <>
          <FreshFirstGrid
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4"
            items={visible.map(item => ({
              id: item.id,
              node: (
                <div className="relative">
                  {item.isLifestyle && (
                    <span className="absolute top-2 right-2 z-10 text-[10px] uppercase tracking-widest font-bold px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-300 border border-yellow-500/30">
                      {copy.lifestyleBadge}
                    </span>
                  )}
                  <VotedDilemmaCard
                    scenario={{
                      id:       item.id,
                      question: item.question,
                      optionA:  item.optionA,
                      optionB:  item.optionB,
                      emoji:    item.emoji,
                      category: item.category,
                    }}
                    playHref={`${playPathBase}/${item.id}`}
                    resultsHref={`${resultsPathBase}/${item.id}`}
                    totalVotes={voteMap[item.id] ?? 0}
                    locale={locale}
                  />
                </div>
              ),
            }))}
          />
          <Paginator
            current={page}
            total={totalPages}
            onChange={onPageChange}
            prevLabel={copy.pagerPrev}
            nextLabel={copy.pagerNext}
            ariaLabel={copy.pagerAriaLabel}
          />
        </>
      )}
    </div>
  )
}
