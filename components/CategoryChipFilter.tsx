'use client'

import type { Category } from '@/lib/scenarios'

export interface CategoryChip {
  value: Category | 'all'
  label: string
  emoji: string
  count: number
}

interface Props {
  chips:    CategoryChip[]
  active:   Category | 'all'
  onChange: (next: Category | 'all') => void
  label:    string  // a11y label e.g. "Filter by category"
}

export default function CategoryChipFilter({ chips, active, onChange, label }: Props) {
  return (
    <div
      role="group"
      aria-label={label}
      className="
        flex flex-nowrap gap-2 overflow-x-auto snap-x snap-mandatory no-scrollbar
        -mx-4 px-4
        sm:flex-wrap sm:overflow-visible sm:justify-center sm:snap-none sm:-mx-0 sm:px-0
      "
    >
      {chips.map(c => {
        const isActive = c.value === active
        return (
          <button
            key={c.value}
            type="button"
            onClick={() => onChange(c.value)}
            aria-pressed={isActive}
            className={[
              'snap-start whitespace-nowrap flex-shrink-0',
              'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium',
              'border transition-colors motion-reduce:transition-none',
              isActive
                ? 'bg-white text-black border-white'
                : 'bg-[var(--surface)]/60 text-[var(--muted)] border-[var(--border)] hover:text-white hover:border-white/40',
            ].join(' ')}
          >
            <span aria-hidden="true">{c.emoji}</span>
            <span>{c.label}</span>
            <span
              className={[
                'text-xs',
                isActive ? 'text-black/60' : 'text-white/40',
              ].join(' ')}
            >
              {c.count}
            </span>
          </button>
        )
      })}
    </div>
  )
}
