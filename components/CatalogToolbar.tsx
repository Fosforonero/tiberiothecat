'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
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
  pathBase:   string
  locale:     'en' | 'it'
  query:      string
  category:   Category | 'all'
  sort:       SortMode
  voteState:  VoteState
  divisivity: number
  chips:      CategoryChip[]
  countLabel: string
  copy:       CatalogToolbarCopy
}

const DEFAULTS = { q: '', cat: 'all', sort: 'popular', vs: 'all', div: 0, page: 1 }
// Collapse the toolbar into a compact pill once the user has scrolled past
// the hero + featured row. 320px is roughly the bottom of the featured cards
// on desktop and a bit lower on mobile — close enough on both.
const SCROLL_COLLAPSE_PX = 320

export default function CatalogToolbar({
  pathBase, locale, query, category, sort, voteState, divisivity,
  chips, countLabel, copy,
}: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const base = pathname ?? pathBase

  const [scrolled, setScrolled] = useState(false)
  const [forceOpen, setForceOpen] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let raf = 0
    const measure = () => {
      setScrolled(window.scrollY > SCROLL_COLLAPSE_PX)
      raf = 0
    }
    const onScroll = () => {
      if (raf) return
      raf = requestAnimationFrame(measure)
    }
    measure()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [])

  // When user scrolls back up past the threshold the panel reopens inline —
  // any stale forceOpen state would re-trigger the floating overlay on the
  // next scroll-down. Reset it.
  useEffect(() => {
    if (!scrolled) setForceOpen(false)
  }, [scrolled])

  // While floating panel is open: close on Esc, outside click, OR scroll.
  useEffect(() => {
    if (!forceOpen) return
    const initialY = window.scrollY
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setForceOpen(false) }
    const onPointer = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setForceOpen(false)
      }
    }
    const onScroll = () => {
      if (Math.abs(window.scrollY - initialY) > 8) setForceOpen(false)
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('mousedown', onPointer)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('mousedown', onPointer)
      window.removeEventListener('scroll', onScroll)
    }
  }, [forceOpen])

  const buildUrl = useCallback(
    (patch: { q?: string; cat?: Category | 'all'; sort?: SortMode; vs?: VoteState; div?: number; page?: number }) => {
      const next = {
        q:    patch.q    ?? query,
        cat:  patch.cat  ?? category,
        sort: patch.sort ?? sort,
        vs:   patch.vs   ?? voteState,
        div:  patch.div  ?? divisivity,
        page: patch.page ?? 1,
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

  const sortLabel = copy.sortOptions[sort]
  const filtersLabel = locale === 'it' ? 'Filtri' : 'Filters'
  const closeLabel = locale === 'it' ? 'Chiudi filtri' : 'Close filters'

  const PanelBody = (
    <>
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
        <div className="flex items-center justify-between gap-3 lg:ml-auto lg:justify-self-end">
          <span className="font-mono text-[11px] font-semibold text-[var(--muted)] tracking-[0.08em] tabular-nums">
            {countLabel}
          </span>
          {scrolled && forceOpen && (
            <button
              type="button"
              onClick={() => setForceOpen(false)}
              className="inline-flex items-center justify-center w-7 h-7 text-[12px] font-semibold text-[var(--muted)] hover:text-[var(--text)] rounded-md border border-[var(--border)] hover:border-[var(--border-hi)]"
              aria-label={closeLabel}
            >
              ✕
            </button>
          )}
        </div>
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
    </>
  )

  // Visual states:
  //   - !scrolled              → full panel inline (top of page)
  //   - scrolled && !forceOpen → pill only inline (closed)
  //   - scrolled &&  forceOpen → pill inline + floating panel overlay below
  const showFloating = scrolled && forceOpen

  return (
    <div ref={wrapperRef} className="sticky top-[58px] z-40 mb-6">
      <div
        className={[
          'mx-auto bg-[var(--surface-3,#1a1a40)] border transition-[border-radius,padding,box-shadow,background-color] duration-300 ease-out motion-reduce:transition-none',
          scrolled
            ? 'w-fit max-w-full rounded-full px-4 py-2 cursor-pointer border-[rgba(77,159,255,0.45)] hover:border-[rgba(77,159,255,0.7)] shadow-[0_8px_28px_rgba(0,0,0,0.6),0_0_0_1px_rgba(77,159,255,0.18)_inset,0_0_24px_rgba(77,159,255,0.12)]'
            : 'w-full rounded-2xl px-4 sm:px-5 py-4 border-[var(--border-hi)] shadow-[0_8px_32px_rgba(0,0,0,0.5),0_0_0_1px_rgba(77,159,255,0.08)_inset]',
        ].join(' ')}
        role={scrolled ? 'button' : undefined}
        tabIndex={scrolled ? 0 : undefined}
        aria-expanded={!scrolled || forceOpen}
        aria-controls={showFloating ? 'catalog-filter-panel' : undefined}
        aria-label={scrolled ? filtersLabel : undefined}
        onClick={scrolled ? (e) => {
          // Don't toggle if the click came from inside the floating panel
          // bubbling through (it shouldn't, but defensive).
          if ((e.target as HTMLElement).closest('#catalog-filter-panel')) return
          setForceOpen(v => !v)
        } : undefined}
        onKeyDown={scrolled ? (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            setForceOpen(v => !v)
          }
        } : undefined}
      >
        {scrolled ? (
          <div className="flex items-center gap-3 text-[13px] font-semibold whitespace-nowrap">
            <svg aria-hidden="true" viewBox="0 0 16 16" className="w-3.5 h-3.5 text-[var(--neon-blue)] flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="7" cy="7" r="5" />
              <path d="m11 11 3 3" strokeLinecap="round" />
            </svg>
            <span className="font-mono tabular-nums text-[var(--text)]">{countLabel}</span>
            <span aria-hidden="true" className="text-[var(--border-hi)]">·</span>
            <span className="text-[var(--muted)] truncate max-w-[140px] sm:max-w-none">{sortLabel}</span>
            <span
              aria-hidden="true"
              className={`text-[var(--muted-2,#5e7299)] text-[10px] ml-0.5 transition-transform duration-200 motion-reduce:transition-none ${forceOpen ? 'rotate-180' : ''}`}
            >▾</span>
          </div>
        ) : (
          PanelBody
        )}
      </div>

      {showFloating && (
        <div
          id="catalog-filter-panel"
          className="absolute top-full left-0 right-0 mt-2 z-50 animate-[slide-down_180ms_ease-out_both] motion-reduce:animate-none"
        >
          <div className="w-full rounded-2xl px-4 sm:px-5 py-4 bg-[var(--surface-3,#1a1a40)] border border-[rgba(77,159,255,0.35)] shadow-[0_20px_56px_rgba(0,0,0,0.7),0_0_0_1px_rgba(77,159,255,0.15)_inset,0_0_40px_rgba(77,159,255,0.10)]">
            {PanelBody}
          </div>
        </div>
      )}
    </div>
  )
}
