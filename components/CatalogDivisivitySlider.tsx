'use client'

import { useState, useEffect, useRef } from 'react'

interface Props {
  initialValue: number
  onCommit:     (next: number) => void
  label:        string
  minHint:      string
  maxHint:      string
  suffix:       string
}

const DEBOUNCE_MS = 200

export default function CatalogDivisivitySlider({
  initialValue, onCommit, label, minHint, maxHint, suffix,
}: Props) {
  const [value, setValue] = useState(initialValue)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastCommittedRef = useRef(initialValue)

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

  const pct = `${value}%`

  return (
    <div className="flex flex-col gap-1.5 min-w-[200px]">
      <label className="flex justify-between items-baseline font-mono text-[10.5px] font-semibold tracking-[0.16em] uppercase text-[var(--muted)]">
        <span>{label}</span>
        <output className="text-[11px] text-[var(--neon-yellow)] font-semibold tabular-nums">≥ {value}{suffix}</output>
      </label>
      <input
        type="range"
        min={0}
        max={100}
        step={5}
        value={value}
        onChange={e => setValue(Number(e.target.value))}
        aria-label={label}
        style={{
          ['--val' as any]: pct,
          background: `linear-gradient(90deg, var(--neon-yellow) 0%, var(--neon-yellow) ${pct}, var(--surface-3, #1a1a40) ${pct}, var(--surface-3, #1a1a40) 100%)`,
        }}
        className="appearance-none w-full h-1 rounded-sm outline-none cursor-pointer
          [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5
          [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[var(--neon-yellow)]
          [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-[var(--bg)]
          [&::-webkit-slider-thumb]:shadow-[0_0_12px_rgba(255,215,0,0.5)] [&::-webkit-slider-thumb]:cursor-pointer
          [&::-moz-range-thumb]:w-3.5 [&::-moz-range-thumb]:h-3.5 [&::-moz-range-thumb]:rounded-full
          [&::-moz-range-thumb]:bg-[var(--neon-yellow)] [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-[var(--bg)]"
      />
      <div className="flex justify-between font-mono text-[9.5px] text-[var(--muted-2,#5e7299)] tracking-[0.08em]">
        <span>{maxHint}</span>
        <span>{minHint}</span>
      </div>
    </div>
  )
}
