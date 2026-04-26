'use client'

import { useEffect, useState } from 'react'
import { Compass, Share2, RefreshCw, Lock, ChevronRight, Sparkles } from 'lucide-react'
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

const SIGN_COLORS: Record<string, string> = {
  guardian:   'from-blue-600/20 to-blue-500/5 border-blue-500/30',
  rebel:      'from-red-600/20 to-red-500/5 border-red-500/30',
  oracle:     'from-cyan-600/20 to-cyan-500/5 border-cyan-500/30',
  diplomat:   'from-yellow-600/20 to-yellow-500/5 border-yellow-500/30',
  strategist: 'from-purple-600/20 to-purple-500/5 border-purple-500/30',
  empath:     'from-green-600/20 to-green-500/5 border-green-500/30',
}

export default function PersonalityClient() {
  const [data, setData] = useState<PersonalityResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    fetch('/api/personality')
      .then(r => r.json())
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [])

  const handleShare = async () => {
    const text = data?.archetype?.shareText ?? 'Check out my SplitVote personality at splitvote.io!'
    const url = 'https://splitvote.io/personality'
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
        <p className="text-[var(--muted)]">Calculating your moral profile…</p>
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
        <h1 className="text-2xl font-black text-white mb-3">Unlock Your Moral Profile</h1>
        <p className="text-[var(--muted)] mb-8">Sign in and vote on at least 3 dilemmas to discover your SplitVote personality archetype.</p>
        <Link href="/login"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-purple-500 text-white font-bold hover:bg-purple-400 transition-colors">
          Sign in to discover <ChevronRight size={16} />
        </Link>
      </div>
    )
  }

  // Not enough votes
  if (!data.ready) {
    const needed = data.votesNeeded ?? 3
    const analyzed = data.votesAnalyzed ?? 0
    const progress = Math.min(100, Math.round((analyzed / 3) * 100))
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 rounded-2xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center mx-auto mb-6">
          <Compass size={28} className="text-purple-400" />
        </div>
        <h1 className="text-2xl font-black text-white mb-3">Almost there…</h1>
        <p className="text-[var(--muted)] mb-6">{data.message}</p>

        {/* Progress bar */}
        <div className="h-2 bg-white/5 rounded-full mb-2 max-w-xs mx-auto">
          <div className="h-full rounded-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-500"
            style={{ width: `${progress}%` }} />
        </div>
        <p className="text-xs text-[var(--muted)] mb-8">{analyzed} / 3 votes</p>

        <Link href="/"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-purple-500 text-white font-bold hover:bg-purple-400 transition-colors">
          Vote on a dilemma <ChevronRight size={16} />
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
          SplitVote Personality — For fun only
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-white mb-2">Your Moral Profile</h1>
        <p className="text-[var(--muted)] text-sm">Based on {votesAnalyzed} of your SplitVote choices</p>
      </div>

      {/* ── Archetype card ── */}
      <div className={`rounded-3xl border bg-gradient-to-br ${gradientClass} p-8 mb-8 text-center relative overflow-hidden`}>
        {/* Background glow */}
        <div className="absolute inset-0 opacity-20 pointer-events-none" style={{
          background: `radial-gradient(circle at 50% 50%, currentColor 0%, transparent 70%)`
        }} />

        <div className="text-6xl mb-4">{archetype.signEmoji}</div>

        <div className="text-xs font-bold uppercase tracking-widest text-[var(--muted)] mb-2">
          SplitVote Sign: {archetype.sign}
        </div>

        <h2 className={`text-3xl sm:text-4xl font-black mb-2 ${archetype.color}`}>
          {archetype.name}
        </h2>

        <p className="text-white/60 text-sm font-semibold italic mb-4">"{archetype.tagline}"</p>

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
          <p className="text-xs text-yellow-400/70 mb-4">⚠️ Low confidence — vote on more dilemmas for a better reading</p>
        )}

        {/* Share button */}
        <button onClick={handleShare}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white text-sm font-bold hover:bg-white/15 transition-colors">
          <Share2 size={14} />
          {copied ? 'Copied!' : 'Share my archetype'}
        </button>
      </div>

      {/* ── Community label ── */}
      {communityLabel && (
        <div className="rounded-xl border border-white/10 bg-white/5 p-4 mb-8 text-center">
          <p className="text-sm text-[var(--muted)]">
            <span className="text-white font-bold">Community verdict: </span>{communityLabel}
          </p>
        </div>
      )}

      {/* ── Moral axes breakdown ── */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 mb-8">
        <h3 className="text-sm font-black uppercase tracking-widest text-[var(--muted)] mb-6">
          🧠 Your Moral Axes
        </h3>
        <div className="space-y-5">
          {axes.map(axis => {
            // Normalize score from [-5,+5] to [0,100] for display
            const barPct = Math.round(((axis.score + 5) / 10) * 100)
            const isLeft = axis.score < -1.5
            const isRight = axis.score > 1.5
            const isBalanced = !isLeft && !isRight

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
        <Link href="/"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-purple-500/20 border border-purple-500/30 text-purple-400 font-bold hover:bg-purple-500/30 transition-colors">
          Vote more to refine your profile <RefreshCw size={14} />
        </Link>
        <p className="text-xs text-[var(--muted)]">
          For entertainment only — not scientifically validated.{' '}
          <span className="text-white/40">Results update as you vote.</span>
        </p>
      </div>

    </div>
  )
}
