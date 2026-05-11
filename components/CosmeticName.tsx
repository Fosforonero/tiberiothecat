/**
 * CosmeticName — renders a display name with optional glow + color.
 *
 * Pure presentational. Use getEquippedCosmetics() from lib/cosmetics.ts
 * in the parent to resolve the glow + nameColor defs.
 *
 * Important: name colors use gradient + bg-clip-text. We MUST output a
 * <span> with the gradient classes; an inline glow `text-shadow` still
 * applies because the glow renders behind the clipped text.
 */

import type { GlowDef, NameColorDef } from '@/lib/cosmetics'

interface Props {
  name: string
  glow?: GlowDef | null
  nameColor?: NameColorDef | null
  /** Extra Tailwind classes on the outer span (size/weight/etc.). */
  className?: string
}

export default function CosmeticName({ name, glow, nameColor, className = '' }: Props) {
  // Compose: base class from caller + color class from cosmetic + glow style
  const colorClass = nameColor?.className ?? ''
  return (
    <span
      className={`${className} ${colorClass}`.trim()}
      style={glow?.style}
    >
      {name}
    </span>
  )
}
