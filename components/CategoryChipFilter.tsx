'use client'

import type { Category } from '@/lib/scenarios'
import { CATEGORY_HUE } from '@/lib/catalog'

export interface CategoryChip {
  value: Category | 'all'
  label: string
  count: number
}

interface Props {
  chips:    CategoryChip[]
  active:   Category | 'all'
  onChange: (next: Category | 'all') => void
  label:    string  // a11y label e.g. "Filter by category"
  allLabel: string  // localized "All" label
}

export default function CategoryChipFilter({ chips, active, onChange, label, allLabel: _allLabel }: Props) {
  return (
    <div
      role="group"
      aria-label={label}
      className="
        flex flex-nowrap gap-1.5 overflow-x-auto snap-x no-scrollbar
        -mx-4 px-4
        sm:flex-wrap sm:overflow-visible sm:snap-none sm:-mx-0 sm:px-0
      "
    >
      {chips.map(c => {
        const isActive = c.value === active
        const hue = c.value === 'all' ? 220 : CATEGORY_HUE[c.value]
        return (
          <button
            key={c.value}
            type="button"
            onClick={() => onChange(c.value)}
            aria-pressed={isActive}
            style={{ ['--chip-hue' as any]: String(hue) }}
            className={[
              'snap-start whitespace-nowrap flex-shrink-0',
              'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[11.5px] font-semibold',
              'border transition-colors motion-reduce:transition-none',
              isActive
                ? 'bg-[var(--surface-3,#1a1a40)] text-[var(--text)] border-[oklch(0.75_0.16_var(--chip-hue)/0.5)]'
                : 'bg-[var(--surface)] text-[var(--muted)] border-[var(--border)] hover:text-[var(--text)] hover:border-[var(--border-hi)]',
            ].join(' ')}
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              aria-hidden="true"
              style={{ background: `oklch(0.75 0.16 ${hue})` }}
            />
            <span>{c.label}</span>
            <span className={isActive ? 'text-white/40' : 'text-white/30'}>
              {c.count}
            </span>
          </button>
        )
      })}
    </div>
  )
}
