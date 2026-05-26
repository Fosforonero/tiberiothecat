'use client'

import type { SortMode } from '@/lib/catalog'

interface Props {
  value:    SortMode
  onChange: (next: SortMode) => void
  labels:   Record<SortMode, string>
  ariaLabel: string
}

export default function SortSelect({ value, onChange, labels, ariaLabel }: Props) {
  return (
    <label className="inline-flex items-center gap-2 text-sm text-[var(--muted)]">
      <span className="hidden sm:inline">{ariaLabel}:</span>
      <select
        aria-label={ariaLabel}
        value={value}
        onChange={e => onChange(e.target.value as SortMode)}
        className="
          bg-[var(--surface)]/60 text-white
          border border-[var(--border)] hover:border-white/40
          rounded-xl px-3 py-2 text-sm font-medium
          focus:outline-none focus:ring-2 focus:ring-white/30
          transition-colors motion-reduce:transition-none
        "
      >
        <option value="popular">{labels.popular}</option>
        <option value="fresh">{labels.fresh}</option>
        <option value="divisive">{labels.divisive}</option>
      </select>
    </label>
  )
}
