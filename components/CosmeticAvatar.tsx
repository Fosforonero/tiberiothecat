/**
 * CosmeticAvatar — renders an emoji avatar wrapped in an optional cosmetic frame.
 *
 * Pure presentational component. Reads no DB — receives the frame def from
 * the parent (use lib/cosmetics.ts → getEquippedCosmetics() to resolve it).
 *
 * Sizing: pass one of the named sizes (sm/md/lg/xl) for consistency, or
 * provide custom Tailwind classes via `className` (e.g. for the hero).
 */

import type { FrameDef } from '@/lib/cosmetics'

type Size = 'sm' | 'md' | 'lg' | 'xl'

interface Props {
  /** Avatar emoji to render in the center. Defaults to 🌍. */
  emoji?: string | null
  /** Equipped frame def, or null if no frame. */
  frame: FrameDef | null
  size?: Size
  /** Background color for the inner disc. Defaults to var(--bg). */
  innerBg?: string
  /** Extra classes on the outer wrapper. */
  className?: string
  ariaLabel?: string
}

const SIZE_MAP: Record<Size, { outer: string; inner: string; emoji: string }> = {
  sm: { outer: 'w-8 h-8',   inner: 'w-7 h-7',   emoji: 'text-base' },
  md: { outer: 'w-12 h-12', inner: 'w-10 h-10', emoji: 'text-xl'   },
  lg: { outer: 'w-16 h-16', inner: 'w-14 h-14', emoji: 'text-3xl'  },
  xl: { outer: 'w-24 h-24', inner: 'w-[5.25rem] h-[5.25rem]', emoji: 'text-5xl' },
}

export default function CosmeticAvatar({
  emoji = '🌍',
  frame,
  size = 'md',
  innerBg = 'bg-[#0d0d1a]',
  className = '',
  ariaLabel,
}: Props) {
  const sizing = SIZE_MAP[size]

  // No frame → simple round avatar
  if (!frame) {
    return (
      <div
        className={`${sizing.outer} rounded-full ${innerBg} border border-white/10 flex items-center justify-center ${className}`}
        role={ariaLabel ? 'img' : undefined}
        aria-label={ariaLabel}
      >
        <span className={sizing.emoji} aria-hidden={ariaLabel ? 'true' : undefined}>
          {emoji ?? '🌍'}
        </span>
      </div>
    )
  }

  // Framed: outer gradient ring + inner disc
  return (
    <div
      className={`${sizing.outer} ${frame.ringClass} flex items-center justify-center ${className}`}
      style={frame.style}
      role={ariaLabel ? 'img' : undefined}
      aria-label={ariaLabel}
    >
      <div className={`${sizing.inner} rounded-full ${innerBg} flex items-center justify-center`}>
        <span className={sizing.emoji} aria-hidden={ariaLabel ? 'true' : undefined}>
          {emoji ?? '🌍'}
        </span>
      </div>
    </div>
  )
}
