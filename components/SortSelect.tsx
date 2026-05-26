'use client'

import type { SortMode } from '@/lib/catalog'

interface Props {
  value:     SortMode
  onChange:  (next: SortMode) => void
  labels:    Record<SortMode, string>
  ariaLabel: string
}

export default function SortSelect({ value, onChange, labels, ariaLabel }: Props) {
  return (
    <label className="inline-flex items-center gap-2 text-[12.5px] text-[var(--muted)]">
      <span className="hidden sm:inline font-mono text-[10px] font-semibold tracking-[0.18em] uppercase">{ariaLabel}</span>
      <select
        aria-label={ariaLabel}
        value={value}
        onChange={e => onChange(e.target.value as SortMode)}
        className="
          appearance-none cursor-pointer
          bg-[var(--surface)] text-[var(--text)]
          border border-[var(--border)] hover:border-[var(--border-hi)]
          rounded-lg pl-3 pr-7 py-2 text-[12.5px] font-medium
          focus:outline-none focus:ring-2 focus:ring-[var(--neon-blue)]
          transition-colors motion-reduce:transition-none
          bg-no-repeat
        "
        style={{
          backgroundImage:
            'linear-gradient(45deg, transparent 50%, var(--muted) 50%), linear-gradient(135deg, var(--muted) 50%, transparent 50%)',
          backgroundPosition: 'calc(100% - 14px) 14px, calc(100% - 9px) 14px',
          backgroundSize: '5px 5px',
        }}
      >
        <option value="popular">{labels.popular}</option>
        <option value="fresh">{labels.fresh}</option>
        <option value="divisive">{labels.divisive}</option>
      </select>
    </label>
  )
}
