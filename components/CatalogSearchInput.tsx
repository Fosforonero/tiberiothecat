'use client'

import { useState, useEffect, useRef } from 'react'

interface Props {
  /** Initial value from URL params. */
  initialValue: string
  /** Called 250ms after the last keystroke. Updates URL. */
  onCommit:     (next: string) => void
  placeholder:  string
  clearLabel:   string
}

const DEBOUNCE_MS = 250

export default function CatalogSearchInput({ initialValue, onCommit, placeholder, clearLabel }: Props) {
  // Local state for instant feedback; commit is debounced.
  const [value, setValue] = useState(initialValue)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastCommittedRef = useRef(initialValue)

  // If URL params change externally (e.g. page nav back), reflect the change.
  useEffect(() => {
    setValue(initialValue)
    lastCommittedRef.current = initialValue
  }, [initialValue])

  useEffect(() => {
    if (value === lastCommittedRef.current) return
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => {
      lastCommittedRef.current = value
      onCommit(value)
    }, DEBOUNCE_MS)
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [value, onCommit])

  const clear = () => {
    setValue('')
    lastCommittedRef.current = ''
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    onCommit('')
  }

  return (
    <label className="relative flex items-center gap-2 px-3 py-2 border border-[var(--border)] rounded-[10px] bg-[var(--surface)] text-[var(--muted-2,#5e7299)] focus-within:border-[var(--border-hi)] focus-within:bg-[var(--surface2)]">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <circle cx="11" cy="11" r="7" />
        <path d="m21 21-4.3-4.3" />
      </svg>
      <input
        type="search"
        value={value}
        onChange={e => setValue(e.target.value)}
        placeholder={placeholder}
        className="flex-1 min-w-0 bg-transparent border-0 outline-none text-[var(--text)] text-[13px] placeholder:text-[var(--muted-2,#5e7299)]"
      />
      {value && (
        <button
          type="button"
          onClick={clear}
          aria-label={clearLabel}
          className="text-[var(--muted)] text-lg leading-none w-4 h-4 inline-flex items-center justify-center hover:text-[var(--text)]"
        >
          ×
        </button>
      )}
    </label>
  )
}
