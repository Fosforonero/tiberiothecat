import Link from 'next/link'

interface Props {
  current:    number
  total:      number
  /** Function that maps a page number to its href (preserves other URL params). */
  hrefFor:    (page: number) => string
  prevLabel:  string
  nextLabel:  string
  ariaLabel:  string
}

/**
 * Windowing rule: always show first + last; show current ±1; insert "…" where
 * gaps occur. Example (total=9): [1] 2 … 5 6 7 … 9, or 1 2 3 [4] 5 … 9.
 */
function buildWindow(current: number, total: number): Array<number | 'ellipsis'> {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const pages: Array<number | 'ellipsis'> = [1]
  const start = Math.max(2, current - 1)
  const end   = Math.min(total - 1, current + 1)
  if (start > 2) pages.push('ellipsis')
  for (let p = start; p <= end; p++) pages.push(p)
  if (end < total - 1) pages.push('ellipsis')
  pages.push(total)
  return pages
}

const linkBase = 'inline-flex items-center justify-center min-w-[2.25rem] h-9 px-3 rounded-lg text-[12px] font-semibold border transition-colors motion-reduce:transition-none'
const linkInactive = 'bg-[var(--surface)] text-[var(--muted)] border-[var(--border)] hover:text-[var(--text)] hover:border-[var(--border-hi)]'
const linkActive = 'bg-[var(--neon-yellow)] text-[#1a1300] border-[var(--neon-yellow)] shadow-[0_0_16px_rgba(255,215,0,0.3)]'
const linkDisabled = 'opacity-30 pointer-events-none border-[var(--border)] text-[var(--muted)] bg-[var(--surface)]'

const numBase = 'inline-flex items-center justify-center min-w-8 h-8 px-2 rounded-md font-mono text-[12px] font-semibold border tabular-nums transition-colors motion-reduce:transition-none'

export default function CatalogPaginator({
  current, total, hrefFor, prevLabel, nextLabel, ariaLabel,
}: Props) {
  if (total <= 1) return null
  const window = buildWindow(current, total)
  const prevDisabled = current <= 1
  const nextDisabled = current >= total

  return (
    <nav aria-label={ariaLabel} className="flex flex-wrap items-center justify-center gap-3 my-7 mb-12">
      {prevDisabled ? (
        <span className={`${linkBase} ${linkDisabled}`} aria-disabled="true">← {prevLabel}</span>
      ) : (
        <Link
          href={hrefFor(current - 1)}
          rel="prev"
          className={`${linkBase} ${linkInactive}`}
        >
          ← {prevLabel}
        </Link>
      )}

      <div className="flex gap-1">
        {window.map((p, i) =>
          p === 'ellipsis' ? (
            <span key={`e-${i}`} aria-hidden="true" className="px-1 text-[var(--muted)]">…</span>
          ) : p === current ? (
            <span
              key={p}
              aria-current="page"
              className={`${numBase} ${linkActive}`}
            >
              {p}
            </span>
          ) : (
            <Link
              key={p}
              href={hrefFor(p)}
              className={`${numBase} ${linkInactive}`}
            >
              {p}
            </Link>
          ),
        )}
      </div>

      {nextDisabled ? (
        <span className={`${linkBase} ${linkDisabled}`} aria-disabled="true">{nextLabel} →</span>
      ) : (
        <Link
          href={hrefFor(current + 1)}
          rel="next"
          className={`${linkBase} ${linkInactive}`}
        >
          {nextLabel} →
        </Link>
      )}
    </nav>
  )
}
