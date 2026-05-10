'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  COMPANIONS,
  RARITY_STYLES,
  isSpeciesUnlocked,
  type CompanionSpecies,
} from '@/lib/companion'
import { getPixieImagePath } from '@/lib/pixie'

interface Props {
  currentSpecies: CompanionSpecies
  votesCount: number
  streakDays: number
  locale?: string
}

const IT_UNLOCK: Record<CompanionSpecies, string> = {
  spark: 'Sempre disponibile',
  blip:  'Sempre disponibile',
  momo:  '10 voti',
  shade: '7 giorni di streak',
  orbit: '100 voti',
}

const EN_UNLOCK: Record<CompanionSpecies, string> = {
  spark: 'Always available',
  blip:  'Always available',
  momo:  '10 votes',
  shade: '7-day streak',
  orbit: '100 votes',
}

export default function PixieSelector({
  currentSpecies,
  votesCount,
  streakDays,
  locale = 'en',
}: Props) {
  const IT = locale === 'it'
  const router = useRouter()

  const [selected, setSelected] = useState<CompanionSpecies>(currentSpecies)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // Track image load errors per species
  const [imgErrors, setImgErrors] = useState<Partial<Record<CompanionSpecies, boolean>>>({})

  async function handleSelect(species: CompanionSpecies) {
    if (species === selected || saving) return
    if (!isSpeciesUnlocked(species, votesCount, streakDays)) return

    setSaving(true)
    setError(null)

    try {
      const res = await fetch('/api/profile/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companionSpecies: species }),
      })

      if (res.ok) {
        setSelected(species)
        router.refresh()
      } else {
        const data = await res.json().catch(() => ({}))
        setError(data.error ?? (IT ? 'Errore nel salvataggio' : 'Save failed'))
      }
    } catch {
      setError(IT ? 'Errore di rete' : 'Network error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[#0d0d1a]/60 p-5 mb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-black uppercase tracking-widest text-[var(--muted)]">
          {IT ? 'Scegli il tuo Pixie' : 'Choose your Pixie'}
        </h2>
        {saving && (
          <span className="text-xs text-[var(--muted)] animate-pulse">
            {IT ? 'Salvataggio…' : 'Saving…'}
          </span>
        )}
      </div>

      {/* Error */}
      {error && (
        <div
          role="alert"
          aria-live="assertive"
          className="text-red-400 text-xs bg-red-900/20 rounded p-2 border border-red-500/20 mb-3"
        >
          {error}
        </div>
      )}

      {/* Species grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
        {COMPANIONS.map(c => {
          const unlocked = isSpeciesUnlocked(c.id, votesCount, streakDays)
          const isActive = selected === c.id
          const hasImgError = imgErrors[c.id]
          const unlockText = IT ? IT_UNLOCK[c.id] : EN_UNLOCK[c.id]
          const rarityBadge = RARITY_STYLES[c.rarity] ?? RARITY_STYLES.common

          return (
            <button
              key={c.id}
              type="button"
              disabled={!unlocked || saving}
              onClick={() => handleSelect(c.id)}
              aria-label={`${unlocked ? (IT ? 'Scegli' : 'Select') : (IT ? 'Bloccato' : 'Locked')}: ${c.name}`}
              aria-pressed={isActive}
              className={[
                'flex flex-col items-center gap-2 p-3 rounded-xl border transition-all text-center',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/60',
                // active / selected
                isActive
                  ? 'border-blue-500/60 bg-blue-500/10 shadow-[0_0_16px_rgba(77,159,255,0.2)]'
                  : unlocked
                    // unlocked, not selected
                    ? 'border-[var(--border)] bg-[#0a0a1a]/40 hover:border-blue-500/30 hover:bg-blue-500/5 cursor-pointer'
                    // locked
                    : 'border-white/5 bg-white/2 opacity-40 cursor-not-allowed',
              ].join(' ')}
            >
              {/* Pixie image / emoji */}
              <div className="relative w-12 h-12 flex items-center justify-center">
                {!hasImgError ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={getPixieImagePath(c.id, 1)}
                    alt=""
                    className={`w-full h-full object-contain ${!unlocked ? 'grayscale' : ''}`}
                    onError={() => setImgErrors(prev => ({ ...prev, [c.id]: true }))}
                  />
                ) : (
                  <span className="text-3xl">{c.stageEmoji[0]}</span>
                )}
                {/* Lock overlay */}
                {!unlocked && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-base">🔒</span>
                  </div>
                )}
                {/* Selected tick */}
                {isActive && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center">
                    <span className="text-[9px] text-white font-black leading-none">✓</span>
                  </div>
                )}
              </div>

              {/* Name */}
              <p className={`text-[11px] font-bold leading-tight ${isActive ? 'text-white' : 'text-white/70'}`}>
                {c.name.replace('Pixie ', '')}
              </p>

              {/* Rarity badge */}
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md border ${rarityBadge}`}>
                {c.rarity}
              </span>

              {/* Unlock condition or checkmark */}
              {!unlocked && (
                <p className="text-[9px] text-white/30 leading-tight">{unlockText}</p>
              )}
            </button>
          )
        })}
      </div>

      <p className="text-xs text-[var(--muted)] mt-3 text-center">
        {IT
          ? 'Il tuo Pixie cresce con te — cambia specie quando vuoi.'
          : 'Your Pixie grows with you — switch species anytime.'}
      </p>
    </div>
  )
}
