'use client'

/**
 * CosmeticPicker — dashboard widget for equipping/unequipping owned cosmetics.
 *
 * Server gathers `ownedProductIds`, current `equipped_frame`, `equipped_glow`,
 * `name_color` and passes them in. The widget:
 *   - Shows only owned frames/glows (locked = "Buy in store")
 *   - Lets user pick one frame, one glow (or none)
 *   - Shows the 8 name colors only if name_color_bundle is owned
 *   - Calls /api/profile/equip-cosmetic and refreshes the dashboard
 *
 * If the user owns nothing in any category, that category is hidden.
 * If the user owns nothing at all, the widget renders a soft empty state
 * pointing to the store.
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  FRAMES, GLOWS, NAME_COLORS,
  type FrameId, type GlowId, type NameColorSlug,
} from '@/lib/cosmetics'
import CosmeticAvatar from './CosmeticAvatar'
import CosmeticName from './CosmeticName'
import type { ProductId } from '@/lib/purchases'

interface Props {
  ownedProductIds: ProductId[]
  equippedFrame: string | null
  equippedGlow:  string | null
  nameColor:     string | null
  avatarEmoji:   string | null
  displayName:   string
  locale: 'en' | 'it'
}

const COPY = {
  en: {
    title: '🎨 Cosmetics',
    sub: 'Equip what you own. Frame, glow, name color.',
    framesTitle: 'Frames',
    glowsTitle: 'Glows',
    colorsTitle: 'Name color',
    preview: 'Preview',
    none: 'None',
    empty: {
      title: 'No cosmetics yet',
      body: 'Visit the store to unlock frames, glows, and name colors.',
      cta: 'Browse the store →',
    },
    error: 'Couldn\'t update. Try again?',
    saving: 'Saving…',
    storeHref: '/store?tab=cosmetics',
  },
  it: {
    title: '🎨 Cosmetici',
    sub: 'Equipaggia ciò che possiedi. Cornice, glow, colore del nome.',
    framesTitle: 'Cornici',
    glowsTitle: 'Glow',
    colorsTitle: 'Colore nome',
    preview: 'Anteprima',
    none: 'Nessuno',
    empty: {
      title: 'Ancora nessun cosmetico',
      body: 'Visita lo store per sbloccare cornici, glow e colori del nome.',
      cta: 'Vai allo store →',
    },
    error: 'Aggiornamento fallito. Riprovi?',
    saving: 'Salvataggio…',
    storeHref: '/it/store?tab=cosmetics',
  },
} as const

export default function CosmeticPicker({
  ownedProductIds, equippedFrame, equippedGlow, nameColor,
  avatarEmoji, displayName, locale,
}: Props) {
  const copy = COPY[locale]
  const router = useRouter()
  const owned = new Set(ownedProductIds)

  const ownedFrames = (Object.keys(FRAMES) as FrameId[]).filter(id => owned.has(id))
  const ownedGlows  = (Object.keys(GLOWS)  as GlowId[]).filter(id => owned.has(id))
  const hasNameBundle = owned.has('name_color_bundle')

  const hasAny = ownedFrames.length > 0 || ownedGlows.length > 0 || hasNameBundle

  const [frameSel, setFrameSel] = useState<FrameId | null>(equippedFrame as FrameId | null)
  const [glowSel,  setGlowSel]  = useState<GlowId  | null>(equippedGlow  as GlowId  | null)
  const [colorSel, setColorSel] = useState<NameColorSlug | null>(nameColor as NameColorSlug | null)
  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState<string | null>(null)

  async function persist(payload: Record<string, unknown>) {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/profile/equip-cosmetic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const data: { error?: string } = await res.json().catch(() => ({}))
        setError(data.error ?? copy.error)
      } else {
        router.refresh()
      }
    } catch {
      setError(copy.error)
    } finally {
      setSaving(false)
    }
  }

  function pickFrame(id: FrameId | null) {
    setFrameSel(id)
    void persist({ kind: 'frame', productId: id })
  }
  function pickGlow(id: GlowId | null) {
    setGlowSel(id)
    void persist({ kind: 'glow', productId: id })
  }
  function pickColor(slug: NameColorSlug | null) {
    setColorSel(slug)
    void persist({ kind: 'name_color', slug })
  }

  // Empty state
  if (!hasAny) {
    return (
      <section className="mb-8 rounded-2xl border border-[var(--border)] bg-[#0d0d1a]/60 p-6 text-center">
        <h2 className="text-lg font-black mb-2">{copy.title}</h2>
        <div className="text-3xl mb-3 opacity-70">🎨</div>
        <p className="font-bold text-white text-sm mb-1">{copy.empty.title}</p>
        <p className="text-xs text-[var(--muted)] mb-4">{copy.empty.body}</p>
        <Link
          href={copy.storeHref}
          className="inline-block rounded-full bg-fuchsia-500/15 hover:bg-fuchsia-500/25 text-fuchsia-300 text-xs font-bold px-4 py-2 transition-colors"
        >
          {copy.empty.cta}
        </Link>
      </section>
    )
  }

  // Live preview state — used so the user sees the result before round-trip
  const previewFrame = frameSel ? FRAMES[frameSel] : null
  const previewGlow  = glowSel  ? GLOWS[glowSel]  : null
  const previewColor = colorSel ? NAME_COLORS[colorSel] : null

  return (
    <section className="mb-8 rounded-2xl border border-[var(--border)] bg-[#0d0d1a]/60 p-5">
      <header className="mb-4">
        <h2 className="text-lg font-black">{copy.title}</h2>
        <p className="text-xs text-[var(--muted)]">{copy.sub}</p>
      </header>

      {/* Live preview */}
      <div className="mb-5 flex items-center gap-4 rounded-xl bg-[#0a0a1a]/60 p-4 border border-white/5">
        <CosmeticAvatar emoji={avatarEmoji} frame={previewFrame} size="lg" />
        <div className="flex-1 min-w-0">
          <p className="text-[10px] uppercase tracking-widest text-[var(--muted)] font-bold mb-1">{copy.preview}</p>
          <CosmeticName
            name={displayName}
            glow={previewGlow}
            nameColor={previewColor}
            className="text-lg font-black"
          />
        </div>
      </div>

      {/* Frames */}
      {ownedFrames.length > 0 && (
        <div className="mb-5">
          <h3 className="text-xs uppercase tracking-widest text-[var(--muted)] font-bold mb-2">{copy.framesTitle}</h3>
          <div className="flex flex-wrap gap-2">
            <PickerChip
              active={frameSel === null}
              onClick={() => pickFrame(null)}
              disabled={saving}
              label={copy.none}
            />
            {ownedFrames.map(id => (
              <PickerChip
                key={id}
                active={frameSel === id}
                onClick={() => pickFrame(id)}
                disabled={saving}
                label={id.replace('frame_', '').replace(/\b\w/g, c => c.toUpperCase())}
                preview={<CosmeticAvatar emoji="🌍" frame={FRAMES[id]} size="sm" />}
              />
            ))}
          </div>
        </div>
      )}

      {/* Glows */}
      {ownedGlows.length > 0 && (
        <div className="mb-5">
          <h3 className="text-xs uppercase tracking-widest text-[var(--muted)] font-bold mb-2">{copy.glowsTitle}</h3>
          <div className="flex flex-wrap gap-2">
            <PickerChip
              active={glowSel === null}
              onClick={() => pickGlow(null)}
              disabled={saving}
              label={copy.none}
            />
            {ownedGlows.map(id => (
              <PickerChip
                key={id}
                active={glowSel === id}
                onClick={() => pickGlow(id)}
                disabled={saving}
                label={id.replace('glow_', '').replace(/\b\w/g, c => c.toUpperCase())}
                preview={
                  <span className="text-sm font-bold text-white" style={GLOWS[id].style}>Aa</span>
                }
              />
            ))}
          </div>
        </div>
      )}

      {/* Name colors */}
      {hasNameBundle && (
        <div className="mb-2">
          <h3 className="text-xs uppercase tracking-widest text-[var(--muted)] font-bold mb-2">{copy.colorsTitle}</h3>
          <div className="flex flex-wrap gap-2">
            <PickerChip
              active={colorSel === null}
              onClick={() => pickColor(null)}
              disabled={saving}
              label={copy.none}
            />
            {(Object.keys(NAME_COLORS) as NameColorSlug[]).map(slug => (
              <PickerChip
                key={slug}
                active={colorSel === slug}
                onClick={() => pickColor(slug)}
                disabled={saving}
                label={NAME_COLORS[slug].label}
                preview={
                  <span className={`text-xs font-bold ${NAME_COLORS[slug].className}`}>Aa</span>
                }
              />
            ))}
          </div>
        </div>
      )}

      {/* Status */}
      {saving && (
        <p className="mt-3 text-xs text-[var(--muted)]">{copy.saving}</p>
      )}
      {error && (
        <p className="mt-3 text-xs text-red-400">{error}</p>
      )}
    </section>
  )
}

// ── Picker chip (radio-like) ─────────────────────────────────────────
interface ChipProps {
  active: boolean
  onClick: () => void
  disabled?: boolean
  label: string
  preview?: React.ReactNode
}
function PickerChip({ active, onClick, disabled, label, preview }: ChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active}
      className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold transition-all disabled:opacity-50 disabled:cursor-wait ${
        active
          ? 'border-blue-400/60 bg-blue-500/15 text-white shadow-[0_0_12px_rgba(77,159,255,0.25)]'
          : 'border-white/10 bg-white/5 text-white/70 hover:border-white/25 hover:text-white'
      }`}
    >
      {preview && <span className="flex-shrink-0">{preview}</span>}
      <span>{label}</span>
    </button>
  )
}
