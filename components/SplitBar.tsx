/**
 * SplitBar — horizontal A/B distribution bar.
 *
 * Two flat segments side-by-side, total width = 100%. Used on catalog cards
 * (size="sm") and featured row (size="lg"). Server-renderable.
 */

interface Props {
  /** Percentage for option A, 0-100. */
  a: number
  /** Percentage for option B, 0-100. Defaults to 100 - a. */
  b?: number
  size?: 'sm' | 'lg'
  /** Accessible label for screen readers. */
  label?: string
}

export default function SplitBar({ a, b, size = 'sm', label }: Props) {
  const aPct = Math.max(0, Math.min(100, a))
  const bPct = b ?? (100 - aPct)
  const height = size === 'lg' ? 'h-1.5 rounded-[3px]' : 'h-[3px] rounded-[1.5px]'
  const glow = size === 'lg' ? 'shadow-[0_0_8px_rgba(255,51,102,0.4)]' : ''
  const glowB = size === 'lg' ? 'shadow-[0_0_8px_rgba(77,159,255,0.4)]' : ''

  return (
    <div
      role={label ? 'meter' : undefined}
      aria-label={label}
      aria-valuenow={aPct}
      aria-valuemin={0}
      aria-valuemax={100}
      className={`${height} w-full overflow-hidden flex bg-[var(--surface-3,#1a1a40)]`}
    >
      <div
        className={`bg-[var(--accent-a)] h-full transition-[width] duration-300 ease-out ${glow}`}
        style={{ width: `${aPct}%` }}
      />
      <div
        className={`bg-[var(--accent-b)] h-full transition-[width] duration-300 ease-out ${glowB}`}
        style={{ width: `${bPct}%` }}
      />
    </div>
  )
}
