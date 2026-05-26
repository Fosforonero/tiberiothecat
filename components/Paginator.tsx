'use client'

interface Props {
  current:    number
  total:      number
  onChange:   (page: number) => void
  prevLabel:  string
  nextLabel:  string
  ariaLabel:  string
}

/**
 * Windowing rule: always show first + last; show current ±1; insert "…" where
 * gaps occur. Examples (total=9): [1] 2 … 5 6 7 … 9, or 1 2 3 [4] 5 … 9.
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

export default function Paginator({ current, total, onChange, prevLabel, nextLabel, ariaLabel }: Props) {
  if (total <= 1) return null
  const window = buildWindow(current, total)
  const prevDisabled = current <= 1
  const nextDisabled = current >= total

  const btn = (label: string, page: number, disabled: boolean, isCurrent = false) => (
    <button
      key={`${label}-${page}`}
      type="button"
      onClick={() => onChange(page)}
      disabled={disabled}
      aria-current={isCurrent ? 'page' : undefined}
      className={[
        'inline-flex items-center justify-center min-w-[2.25rem] h-9 px-3 rounded-lg text-sm font-medium',
        'border transition-colors motion-reduce:transition-none',
        disabled
          ? 'opacity-30 cursor-not-allowed border-[var(--border)] text-[var(--muted)]'
          : isCurrent
            ? 'bg-white text-black border-white'
            : 'bg-[var(--surface)]/60 text-[var(--muted)] border-[var(--border)] hover:text-white hover:border-white/40',
      ].join(' ')}
    >
      {label}
    </button>
  )

  return (
    <nav aria-label={ariaLabel} className="flex flex-wrap items-center justify-center gap-2 mt-8">
      {btn(prevLabel, Math.max(1, current - 1), prevDisabled)}
      {window.map((p, i) =>
        p === 'ellipsis'
          ? <span key={`e-${i}`} aria-hidden="true" className="px-1 text-[var(--muted)]">…</span>
          : btn(String(p), p, false, p === current)
      )}
      {btn(nextLabel, Math.min(total, current + 1), nextDisabled)}
    </nav>
  )
}
