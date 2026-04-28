'use client'

import { useEffect, useState } from 'react'
import { Compass, Share2, RefreshCw, Lock, ChevronRight, Sparkles, Download } from 'lucide-react'
import Link from 'next/link'

interface AxisData {
  id: string
  name: string
  emoji: string
  leftPole: string
  rightPole: string
  score: number
  label: string
}

interface ArchetypeData {
  id: string
  name: string
  sign: string
  signEmoji: string
  tagline: string
  description: string
  traits: string[]
  color: string
  shareText: string
}

interface PersonalityResponse {
  ready: boolean
  votesAnalyzed?: number
  votesNeeded?: number
  confidence?: 'low' | 'medium' | 'high'
  archetype?: ArchetypeData
  axes?: AxisData[]
  communityLabel?: string
  message?: string
}

interface Props {
  locale?: 'en' | 'it'
}

const SIGN_COLORS: Record<string, string> = {
  guardian:      'from-blue-600/20 to-blue-500/5 border-blue-500/30',
  rebel:         'from-red-600/20 to-red-500/5 border-red-500/30',
  oracle:        'from-cyan-600/20 to-cyan-500/5 border-cyan-500/30',
  diplomat:      'from-yellow-600/20 to-yellow-500/5 border-yellow-500/30',
  strategist:    'from-purple-600/20 to-purple-500/5 border-purple-500/30',
  empath:        'from-green-600/20 to-green-500/5 border-green-500/30',
  idealist:      'from-indigo-600/20 to-indigo-500/5 border-indigo-500/30',
  pragmatist:    'from-slate-600/20 to-slate-500/5 border-slate-500/30',
  protector:     'from-orange-600/20 to-orange-500/5 border-orange-500/30',
  'truth-teller':'from-rose-600/20 to-rose-500/5 border-rose-500/30',
  pioneer:       'from-amber-600/20 to-amber-500/5 border-amber-500/30',
  peacemaker:    'from-teal-600/20 to-teal-500/5 border-teal-500/30',
  sentinel:      'from-sky-600/20 to-sky-500/5 border-sky-500/30',
  advocate:      'from-fuchsia-600/20 to-fuchsia-500/5 border-fuchsia-500/30',
  visionary:     'from-violet-600/20 to-violet-500/5 border-violet-500/30',
  maverick:      'from-zinc-600/20 to-zinc-500/5 border-zinc-500/30',
  stoic:         'from-stone-600/20 to-stone-500/5 border-stone-500/30',
  caretaker:     'from-pink-600/20 to-pink-500/5 border-pink-500/30',
}

const EN_COPY = {
  loading:          'Calculating your moral profile…',
  unlockTitle:      'Unlock Your Moral Profile',
  unlockDesc:       'Sign in and vote on at least 3 dilemmas to discover your SplitVote personality archetype.',
  signIn:           'Sign in to discover',
  almostTitle:      'Almost there…',
  votes:            (analyzed: number) => `${analyzed} / 3 votes`,
  voteLink:         'Vote on a dilemma',
  header:           'SplitVote Personality — For fun only',
  profileTitle:     'Your Moral Profile',
  basedOn:          (n: number) => `Based on ${n} of your SplitVote choices`,
  sign:             (s: string) => `SplitVote Sign: ${s}`,
  lowConfidence:    '⚠️ Low confidence — vote on more dilemmas for a better reading',
  share:            'Share my archetype',
  download:         'Save card',
  copied:           'Copied!',
  communityVerdict: 'Community verdict: ',
  axesTitle:        '🧠 Your Moral Axes',
  refine:           'Vote more to refine your profile',
  disclaimer:       'For entertainment only — not scientifically validated.',
  resultsUpdate:    'Results update as you vote.',
}

const IT_COPY = {
  loading:          'Calcolando il tuo profilo morale…',
  unlockTitle:      'Sblocca il Tuo Profilo Morale',
  unlockDesc:       'Accedi e vota almeno 3 dilemmi per scoprire il tuo archetipo di personalità SplitVote.',
  signIn:           'Accedi per scoprire',
  almostTitle:      'Quasi là…',
  votes:            (analyzed: number) => `${analyzed} / 3 voti`,
  voteLink:         'Vota un dilemma',
  header:           'SplitVote Personalità — Solo per divertimento',
  profileTitle:     'Il Tuo Profilo Morale',
  basedOn:          (n: number) => `Basato su ${n} delle tue scelte su SplitVote`,
  sign:             (s: string) => `Segno SplitVote: ${s}`,
  lowConfidence:    '⚠️ Bassa attendibilità — vota altri dilemmi per un risultato più preciso',
  share:            'Condividi il mio archetipo',
  download:         'Salva card',
  copied:           'Copiato!',
  communityVerdict: 'Verdetto della community: ',
  axesTitle:        '🧠 I Tuoi Assi Morali',
  refine:           'Vota altri dilemmi per affinare il tuo profilo',
  disclaimer:       'Solo a scopo di intrattenimento — non validato scientificamente.',
  resultsUpdate:    'I risultati si aggiornano man mano che voti.',
}

export default function PersonalityClient({ locale = 'en' }: Props) {
  const [data, setData] = useState<PersonalityResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  const copy = locale === 'it' ? IT_COPY : EN_COPY
  const homeHref = locale === 'it' ? '/it' : '/'
  const loginHref = locale === 'it' ? '/login?locale=it' : '/login'

  useEffect(() => {
    fetch(locale === 'it' ? '/api/personality?locale=it' : '/api/personality')
      .then(r => r.json())
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [locale])

  const handleShare = async () => {
    const text = data?.archetype?.shareText ?? (locale === 'it' ? 'Scopri la tua personalità SplitVote su splitvote.io!' : 'Check out my SplitVote personality at splitvote.io!')
    const url = locale === 'it' ? 'https://splitvote.io/it/personality' : 'https://splitvote.io/personality'
    if (navigator.share) {
      await navigator.share({ text, url })
    } else {
      await navigator.clipboard.writeText(`${text} ${url}`)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="w-12 h-12 rounded-full border-2 border-purple-500/50 border-t-purple-400 animate-spin mx-auto mb-4" />
        <p className="text-[var(--muted)]">{copy.loading}</p>
      </div>
    )
  }

  // Not logged in
  if (!data || ('error' in (data as object) && (data as { error?: string }).error === 'Unauthorized')) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 rounded-2xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center mx-auto mb-6">
          <Lock size={28} className="text-purple-400" />
        </div>
        <h1 className="text-2xl font-black text-white mb-3">{copy.unlockTitle}</h1>
        <p className="text-[var(--muted)] mb-8">{copy.unlockDesc}</p>
        <Link href={loginHref}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-purple-500 text-white font-bold hover:bg-purple-400 transition-colors">
          {copy.signIn} <ChevronRight size={16} />
        </Link>
      </div>
    )
  }

  // Not enough votes
  if (!data.ready) {
    const analyzed = data.votesAnalyzed ?? 0
    const progress = Math.min(100, Math.round((analyzed / 3) * 100))
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 rounded-2xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center mx-auto mb-6">
          <Compass size={28} className="text-purple-400" />
        </div>
        <h1 className="text-2xl font-black text-white mb-3">{copy.almostTitle}</h1>
        <p className="text-[var(--muted)] mb-6">{data.message}</p>

        {/* Progress bar */}
        <div className="h-2 bg-white/5 rounded-full mb-2 max-w-xs mx-auto">
          <div className="h-full rounded-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-500"
            style={{ width: `${progress}%` }} />
        </div>
        <p className="text-xs text-[var(--muted)] mb-8">{copy.votes(analyzed)}</p>

        <Link href={homeHref}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-purple-500 text-white font-bold hover:bg-purple-400 transition-colors">
          {copy.voteLink} <ChevronRight size={16} />
        </Link>
      </div>
    )
  }

  const { archetype, axes, communityLabel, votesAnalyzed, confidence } = data
  if (!archetype || !axes) return null

  const gradientClass = SIGN_COLORS[archetype.id] ?? 'from-purple-600/20 to-purple-500/5 border-purple-500/30'

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 sm:py-14">

      {/* ── Header ── */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[var(--muted)] bg-white/5 px-3 py-1.5 rounded-full border border-white/10 mb-4">
          <Sparkles size={11} className="text-yellow-400" />
          {copy.header}
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-white mb-2">{copy.profileTitle}</h1>
        <p className="text-[var(--muted)] text-sm">{copy.basedOn(votesAnalyzed ?? 0)}</p>
      </div>

      {/* ── Archetype card ── */}
      <div className={`rounded-3xl border bg-gradient-to-br ${gradientClass} p-8 mb-8 text-center relative overflow-hidden`}>
        {/* Background glow */}
        <div className="absolute inset-0 opacity-20 pointer-events-none" style={{
          background: `radial-gradient(circle at 50% 50%, currentColor 0%, transparent 70%)`
        }} />

        <div className="text-6xl mb-4">{archetype.signEmoji}</div>

        <div className="text-xs font-bold uppercase tracking-widest text-[var(--muted)] mb-2">
          {copy.sign(archetype.sign)}
        </div>

        <h2 className={`text-3xl sm:text-4xl font-black mb-2 ${archetype.color}`}>
          {archetype.name}
        </h2>

        <p className="text-white/60 text-sm font-semibold italic mb-4">&ldquo;{archetype.tagline}&rdquo;</p>

        <p className="text-[var(--muted)] text-sm leading-relaxed mb-6 max-w-md mx-auto">
          {archetype.description}
        </p>

        {/* Traits */}
        <div className="flex flex-wrap justify-center gap-2 mb-6">
          {archetype.traits.map(trait => (
            <span key={trait}
              className={`text-xs font-bold px-3 py-1 rounded-full border border-white/10 bg-white/5 ${archetype.color}`}>
              {trait}
            </span>
          ))}
        </div>

        {/* Confidence badge */}
        {confidence === 'low' && (
          <p className="text-xs text-yellow-400/70 mb-4">{copy.lowConfidence}</p>
        )}

        {/* Share + Download buttons */}
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <button onClick={handleShare}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white text-sm font-bold hover:bg-white/15 transition-colors">
            <Share2 size={14} />
            {copied ? copy.copied : copy.share}
          </button>
          <a
            href={`/api/personality-card?archetype=${archetype.id}&locale=${locale}`}
            download={`splitvote-personality-${archetype.id}.png`}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white text-sm font-bold hover:bg-white/15 transition-colors"
          >
            <Download size={14} />
            {copy.download}
          </a>
        </div>
      </div>

      {/* ── Community label ── */}
      {communityLabel && (
        <div className="rounded-xl border border-white/10 bg-white/5 p-4 mb-8 text-center">
          <p className="text-sm text-[var(--muted)]">
            <span className="text-white font-bold">{copy.communityVerdict}</span>{communityLabel}
          </p>
        </div>
      )}

      {/* ── Moral axes breakdown ── */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 mb-8">
        <h3 className="text-sm font-black uppercase tracking-widest text-[var(--muted)] mb-6">
          {copy.axesTitle}
        </h3>
        <div className="space-y-5">
          {axes.map(axis => {
            // Normalize score from [-5,+5] to [0,100] for display
            const barPct = Math.round(((axis.score + 5) / 10) * 100)
            const isLeft = axis.score < -1.5
            const isRight = axis.score > 1.5

            return (
              <div key={axis.id}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-[var(--muted)]">{axis.emoji} {axis.name}</span>
                  <span className={`text-xs font-bold ${
                    isLeft ? 'text-red-400' :
                    isRight ? 'text-blue-400' :
                    'text-[var(--muted)]'
                  }`}>{axis.label}</span>
                </div>
                <div className="relative h-2 bg-white/5 rounded-full">
                  {/* Center marker */}
                  <div className="absolute left-1/2 top-0 w-px h-full bg-white/20" />
                  {/* Score indicator */}
                  <div
                    className="absolute top-0 h-full rounded-full transition-all duration-700"
                    style={{
                      left: barPct < 50 ? `${barPct}%` : '50%',
                      right: barPct > 50 ? `${100 - barPct}%` : '50%',
                      background: isLeft
                        ? 'linear-gradient(to right, #ef4444, #f87171)'
                        : isRight
                        ? 'linear-gradient(to right, #60a5fa, #3b82f6)'
                        : '#6b7280',
                    }}
                  />
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-[10px] text-[var(--muted)]">{axis.leftPole}</span>
                  <span className="text-[10px] text-[var(--muted)]">{axis.rightPole}</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── CTA ── */}
      <div className="text-center space-y-3">
        <Link href={homeHref}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-purple-500/20 border border-purple-500/30 text-purple-400 font-bold hover:bg-purple-500/30 transition-colors">
          {copy.refine} <RefreshCw size={14} />
        </Link>
        <p className="text-xs text-[var(--muted)]">
          {copy.disclaimer}{' '}
          <span className="text-white/40">{copy.resultsUpdate}</span>
        </p>
      </div>

    </div>
  )
}
