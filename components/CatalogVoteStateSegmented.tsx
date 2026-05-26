'use client'

import type { VoteState } from '@/lib/catalog'

interface Props {
  value:    VoteState
  onChange: (next: VoteState) => void
  labels:   Record<VoteState, string>
  ariaLabel: string
}

export default function CatalogVoteStateSegmented({ value, onChange, labels, ariaLabel }: Props) {
  const opts: VoteState[] = ['all', 'unvoted', 'voted']
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className="inline-flex p-0.5 border border-[var(--border)] rounded-lg bg-[var(--surface)]"
    >
      {opts.map(o => {
        const isActive = value === o
        return (
          <button
            key={o}
            type="button"
            onClick={() => onChange(o)}
            aria-pressed={isActive}
            className={[
              'px-3 py-1.5 border-0 text-[11.5px] font-semibold rounded-md transition-colors motion-reduce:transition-none',
              isActive
                ? 'bg-[var(--surface-3,#1a1a40)] text-[var(--text)]'
                : 'text-[var(--muted)] hover:text-[var(--text)]',
            ].join(' ')}
          >
            {labels[o]}
          </button>
        )
      })}
    </div>
  )
}
