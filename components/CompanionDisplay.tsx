'use client'

import {
  COMPANION_MAP,
  STAGE_LABELS,
  STAGE_THRESHOLDS,
  getCompanionStage,
  votesToNextStage,
  RARITY_STYLES,
  type CompanionSpecies,
} from '@/lib/companion'

interface Props {
  species: CompanionSpecies
  votesCount: number
  xp?: number
  compact?: boolean
  locale?: string
}

const IT_STAGE_LABELS: Record<number, string> = {
  1: 'Cucciolo',
  2: 'Apprendista',
  3: 'Esploratore',
  4: 'Campione',
  5: 'Leggendario',
}

export default function CompanionDisplay({ species, votesCount, xp = 0, compact = false, locale = 'en' }: Props) {
  const IT = locale === 'it'
  const companion = COMPANION_MAP[species] ?? COMPANION_MAP['spark']
  const stage = getCompanionStage(votesCount)
  const stageLabel = IT ? (IT_STAGE_LABELS[stage] ?? STAGE_LABELS[stage]) : STAGE_LABELS[stage]
  const emoji = companion.stageEmoji[stage - 1]
  const toNext = votesToNextStage(votesCount)
  const isMaxStage = stage === 5

  // Progress bar within current stage
  const currentThreshold = STAGE_THRESHOLDS[stage - 1]
  const nextThreshold = isMaxStage ? votesCount : STAGE_THRESHOLDS[stage]
  const range = nextThreshold - currentThreshold
  const progress = isMaxStage ? 100 : Math.min(100, Math.round(((votesCount - currentThreshold) / range) * 100))

  const rarityStyle = RARITY_STYLES[companion.rarity] ?? RARITY_STYLES.common

  if (compact) {
    return (
      <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${rarityStyle}`}>
        <span className="text-2xl">{emoji}</span>
        <div>
          <p className="text-xs font-bold leading-none">{companion.name}</p>
          <p className="text-xs opacity-70 mt-0.5">
            {IT ? 'Stadio' : 'Stage'} {stage} · {stageLabel}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[#0d0d1a]/60 p-5 mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-black uppercase tracking-widest text-[var(--muted)]">
          {IT ? 'Il tuo Compagno' : 'Your Companion'}
        </h2>
        <span className={`text-xs font-bold px-2 py-0.5 rounded-lg border ${rarityStyle}`}>
          {companion.rarity}
        </span>
      </div>

      <div className="flex items-center gap-5">
        {/* Companion visual */}
        <div className="relative flex-shrink-0">
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center text-5xl"
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)',
              boxShadow: stage >= 4 ? '0 0 24px rgba(99,102,241,0.25)' : undefined,
            }}
          >
            {emoji}
          </div>
          {/* Stage badge */}
          <div className="absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-xs font-black text-white border-2 border-[#0d0d1a]">
            {stage}
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-lg font-black text-white leading-none mb-0.5">{companion.name}</p>
          <p className={`text-xs font-bold mb-1 ${companion.color}`}>
            {IT ? 'Stadio' : 'Stage'} {stage} · {stageLabel}
          </p>
          <p className="text-xs text-[var(--muted)] mb-3 opacity-70">
            {IT ? 'Cresce con ogni voto e missione.' : 'Grows with every vote and mission.'}
          </p>

          {/* Progress to next stage */}
          {!isMaxStage ? (
            <>
              <div className="flex justify-between text-xs text-[var(--muted)] mb-1">
                <span>{votesCount} {IT ? 'voti' : 'votes'}</span>
                <span>{toNext} {IT ? `per Stadio ${stage + 1}` : `to Stage ${stage + 1}`}</span>
              </div>
              <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-700"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </>
          ) : (
            <div className="text-xs font-bold text-yellow-400">
              {IT ? '✨ Forma leggendaria sbloccata!' : '✨ Legendary form unlocked!'}
            </div>
          )}
        </div>
      </div>

      {xp > 0 && (
        <p className="mt-4 text-xs text-[var(--muted)] text-right">
          {IT ? 'XP Totale:' : 'Total XP:'}{' '}
          <span className="text-white font-bold">{xp.toLocaleString()}</span>
        </p>
      )}

      {!isMaxStage && (
        <p className="mt-3 text-xs text-[var(--muted)] italic">
          {IT
            ? 'Completa le missioni di oggi per far crescere il tuo compagno più velocemente.'
            : "Complete today's missions to grow your companion faster."}
        </p>
      )}
    </div>
  )
}
