'use client'

import { useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import CatalogSearchInput from '@/components/CatalogSearchInput'
import SortSelect from '@/components/SortSelect'
import CatalogVoteStateSegmented from '@/components/CatalogVoteStateSegmented'
import CategoryChipFilter, { type CategoryChip } from '@/components/CategoryChipFilter'
import CatalogDivisivitySlider from '@/components/CatalogDivisivitySlider'
import { slugFromCategory, type SortMode, type VoteState } from '@/lib/catalog'
import type { Category } from '@/lib/scenarios'

export interface CatalogToolbarCopy {
  searchPlaceholder: string
  searchClear:       string
  sortLabel:         string
  sortOptions:       Record<SortMode, string>
  voteStateLabel:    string
  voteStateOptions:  Record<VoteState, string>
  filterLabel:       string
  allLabel:          string
  divisivityLabel:   string
  divisivityMin:     string
  divisivityMax:     string
  divisivitySuffix:  string
}

interface Props {
  pathBase:        string
  locale:          'en' | 'it'
  // Current state values (from URL params, server-resolved).
  query:           string
  category:        Category | 'all'
  sort:            SortMode
  voteState:       VoteState
  divisivity:      number
  // UI props
  chips:           CategoryChip[]
  /** Already-formatted count string (e.g. "12 dilemmas") — server-side formatted. */
  countLabel:      string
  copy:            CatalogToolbarCopy
}

const DEFAULTS = {
  q:    '',
  cat:  'all',
  sort: 'popular',
  vs:   'all',
  div:  0,
  page: 1,
}

export default function CatalogToolbar({
  pathBase, locale, query, category, sort, voteState, divisivity,
  chips, countLabel, copy,
}: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const base = pathname ?? pathBase

  // Build URL with patched params, stripping defaults for clean canonical.
  const buildUrl = useCallback(
    (patch: { q?: string; cat?: Category | 'all'; sort?: SortMode; vs?: VoteState; div?: number; page?: number }) => {
      const next = {
        q:    patch.q    ?? query,
        cat:  patch.cat  ?? category,
        sort: patch.sort ?? sort,
        vs:   patch.vs   ?? voteState,
        div:  patch.div  ?? divisivity,
        page: patch.page ?? 1,   // any filter change resets page to 1
      }
      const params = new URLSearchParams()
      if (next.q)                            params.set('q',    next.q)
      if (next.cat  !== DEFAULTS.cat)        params.set('cat',  slugFromCategory(next.cat, locale))
      if (next.sort !== DEFAULTS.sort)       params.set('sort', next.sort)
      if (next.vs   !== DEFAULTS.vs)         params.set('vs',   next.vs)
      if (next.div  !== DEFAULTS.div)        params.set('div',  String(next.div))
      if (next.page !== DEFAULTS.page)       params.set('page', String(next.page))
      const qs = params.toString()
      return qs ? `${base}?${qs}` : base
    },
    [base, locale, query, category, sort, voteState, divisivity],
  )

  const go = useCallback((patch: Parameters<typeof buildUrl>[0]) => {
    router.replace(buildUrl(patch), { scroll: false })
  }, [router, buildUrl])

  return (
    <div className="cat-toolbar sticky top-[58px] z-40 -mx-4 sm:-mx-6 px-4 sm:px-6 py-4 mb-6 bg-[rgba(7,7,24,0.85)] backdrop-blur-md border-b border-[var(--border)]">
      {/* Row 1 — search + sort + vote-state + counter */}
      <div className="grid gap-3 mb-3.5 grid-cols-1 lg:grid-cols-[minmax(180px,280px)_auto_auto_1fr] lg:items-center">
        <CatalogSearchInput
          initialValue={query}
          onCommit={(q) => go({ q })}
          placeholder={copy.searchPlaceholder}
          clearLabel={copy.searchClear}
        />
        <div className="flex flex-wrap items-center gap-3">
          <SortSelect
            value={sort}
            onChange={(s) => go({ sort: s })}
            labels={copy.sortOptions}
            ariaLabel={copy.sortLabel}
          />
          <CatalogVoteStateSegmented
            value={voteState}
            onChange={(vs) => go({ vs })}
            labels={copy.voteStateOptions}
            ariaLabel={copy.voteStateLabel}
          />
        </div>
        <span className="font-mono text-[11px] font-semibold text-[var(--muted)] tracking-[0.08em] tabular-nums lg:ml-auto lg:justify-self-end">
          {countLabel}
        </span>
      </div>

      {/* Row 2 — category chips + divisivity slider */}
      <div className="grid gap-3 lg:grid-cols-[1fr_280px] lg:gap-5 lg:items-center">
        <CategoryChipFilter
          chips={chips}
          active={category}
          onChange={(c) => go({ cat: c })}
          label={copy.filterLabel}
          allLabel={copy.allLabel}
        />
        <CatalogDivisivitySlider
          initialValue={divisivity}
          onCommit={(div) => go({ div })}
          label={copy.divisivityLabel}
          minHint={copy.divisivityMin}
          maxHint={copy.divisivityMax}
          suffix={copy.divisivitySuffix}
        />
      </div>
    </div>
  )
}
