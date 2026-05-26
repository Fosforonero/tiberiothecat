/**
 * SplitBar — horizontal A/B distribution bar.
 *
 * Two flat segments side-by-side, total width = 100%. Used on catalog cards
 * (size="sm") and featured row (size="lg"). Server-renderable.
 *
 * size="lg" gets a horizontal hue gradient + vertical gloss highlight +
 * matching neon glow so the bar reads as a satisfying visual finish line
 * even when one side wins decisively. size="sm" stays flat for catalog grids.
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
  const isLg = size === 'lg'
  const sizeClasses = isLg ? 'h-[9px] rounded-full' : 'h-1 rounded-[2px]'

  // Multi-layer background: gloss highlight on top, horizontal hue gradient below.
  const glossLayer =
    'linear-gradient(180deg, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0) 45%, rgba(0,0,0,0.14) 100%)'
  const aHue = 'linear-gradient(90deg, #ff5b7d 0%, #ff3366 55%, #d92653 100%)'
  const bHue = 'linear-gradient(90deg, #4d9fff 0%, #36b8ff 60%, #00d4ff 100%)'
  const aBg = isLg ? `${glossLayer}, ${aHue}` : '#ff3366'
  const bBg = isLg ? `${glossLayer}, ${bHue}` : '#4d9fff'
  const aGlow = isLg ? '0 0 10px rgba(255,51,102,0.55), 0 0 22px rgba(255,51,102,0.18)' : 'none'
  const bGlow = isLg ? '0 0 10px rgba(77,159,255,0.55), 0 0 22px rgba(0,212,255,0.20)' : 'none'

  return (
    <div
      role={label ? 'meter' : undefined}
      aria-label={label}
      aria-valuenow={aPct}
      aria-valuemin={0}
      aria-valuemax={100}
      className={`${sizeClasses} w-full overflow-hidden flex bg-[var(--surface-3,#1a1a40)] ${isLg ? 'ring-1 ring-inset ring-white/[0.04]' : ''}`}
    >
      {aPct > 0 && (
        <div
          className="h-full transition-[width] duration-500 ease-out motion-reduce:transition-none"
          style={{
            width: `${aPct}%`,
            background: aBg,
            boxShadow: aGlow,
          }}
        />
      )}
      {bPct > 0 && (
        <div
          className="h-full transition-[width] duration-500 ease-out motion-reduce:transition-none"
          style={{
            width: `${bPct}%`,
            background: bBg,
            boxShadow: bGlow,
          }}
        />
      )}
    </div>
  )
}
