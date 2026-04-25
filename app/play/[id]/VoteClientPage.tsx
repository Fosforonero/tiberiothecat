'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { Scenario } from '@/lib/scenarios'
import Script from 'next/script'

interface ExistingVote {
  choice: 'A' | 'B'
  canChangeUntil: string
}

interface Props {
  scenario: Scenario
  existingVote?: ExistingVote | null
}

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'))
  return match ? decodeURIComponent(match[1]) : null
}

function formatTimeRemaining(canChangeUntil: string): string {
  const diff = new Date(canChangeUntil).getTime() - Date.now()
  if (diff <= 0) return 'expired'
  const h = Math.floor(diff / 3_600_000)
  const m = Math.floor((diff % 3_600_000) / 60_000)
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://splitvote.io'

export default function VoteClientPage({ scenario, existingVote }: Props) {
  const [selected, setSelected] = useState<'a' | 'b' | null>(null)
  const [loading, setLoading] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState<string>('')
  const router = useRouter()

  // Cookie-based redirect for non-logged users
  useEffect(() => {
    if (existingVote) return // Supabase vote takes precedence
    const previousVote = getCookie(`sv_voted_${scenario.id}`)
    if (previousVote === 'a' || previousVote === 'b') {
      router.replace(`/results/${scenario.id}?voted=${previousVote}`)
    }
  }, [scenario.id, router, existingVote])

  // Update time remaining every minute
  useEffect(() => {
    if (!existingVote) return
    setTimeRemaining(formatTimeRemaining(existingVote.canChangeUntil))
    const interval = setInterval(() => {
      setTimeRemaining(formatTimeRemaining(existingVote.canChangeUntil))
    }, 60_000)
    return () => clearInterval(interval)
  }, [existingVote])

  async function vote(option: 'a' | 'b') {
    if (loading || selected) return
    setSelected(option)
    setLoading(true)
    try {
      await fetch('/api/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: scenario.id, option }),
      })
      router.push(`/results/${scenario.id}?voted=${option}`)
    } catch {
      setLoading(false)
      setSelected(null)
    }
  }

  // JSON-LD structured data for rich snippets
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Question',
    name: scenario.question,
    text: scenario.question,
    url: `${BASE_URL}/play/${scenario.id}`,
    suggestedAnswer: [
      {
        '@type': 'Answer',
        text: scenario.optionA,
        url: `${BASE_URL}/results/${scenario.id}`,
      },
      {
        '@type': 'Answer',
        text: scenario.optionB,
        url: `${BASE_URL}/results/${scenario.id}`,
      },
    ],
    dateCreated: '2026-01-01',
    inLanguage: 'en',
    author: { '@type': 'Organization', name: 'SplitVote', url: BASE_URL },
  }

  const votedOptionText = existingVote?.choice === 'A' ? scenario.optionA : scenario.optionB
  const canStillChange = existingVote ? new Date(existingVote.canChangeUntil) > new Date() : false

  return (
    <>
      <Script
        id={`jsonld-${scenario.id}`}
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="max-w-2xl mx-auto px-4 py-16">
        {/* Back */}
        <a href="/" className="text-sm text-[var(--muted)] hover:text-white transition-colors mb-8 inline-block">
          ← All dilemmas
        </a>

        {/* Question */}
        <div className="text-center mb-12">
          <span className="text-5xl mb-6 block">{scenario.emoji}</span>
          <span className="text-xs font-bold uppercase tracking-widest text-[var(--muted)] mb-4 block">
            {scenario.category}
          </span>
          <h1 className="text-2xl md:text-3xl font-bold text-[var(--text)] leading-snug">
            {scenario.question}
          </h1>
        </div>

        {/* Already voted — locked state */}
        {existingVote ? (
          <div className="space-y-4">
            {/* Voted banner */}
            <div className="rounded-2xl border border-blue-500/40 bg-blue-500/10 px-6 py-4 text-center">
              <p className="text-blue-300 font-semibold text-sm mb-1">✅ You already voted</p>
              <p className="text-white font-bold text-lg">"{votedOptionText}"</p>
              {canStillChange && timeRemaining ? (
                <p className="text-[var(--muted)] text-xs mt-2">
                  🕐 Can change for {timeRemaining}
                </p>
              ) : (
                <p className="text-[var(--muted)] text-xs mt-2">
                  🔒 Vote locked
                </p>
              )}
            </div>

            {/* Options — grayed out, chosen one highlighted */}
            <div className="vs divider flex items-center gap-4 mt-2">
              <div className="flex-1 h-px bg-[var(--border)]" />
              <span className="text-xs font-black text-[var(--muted)] tracking-widest">YOUR CHOICE</span>
              <div className="flex-1 h-px bg-[var(--border)]" />
            </div>

            <div className="grid grid-cols-1 gap-4 mt-2">
              <div className={`w-full rounded-2xl border-2 p-6 text-left font-semibold text-lg
                ${existingVote.choice === 'A'
                  ? 'border-red-500 bg-red-500/20 text-red-300'
                  : 'border-red-500/20 bg-red-500/5 text-[var(--muted)] opacity-40'
                }`}
              >
                <span className="block text-xs font-black uppercase tracking-widest text-red-400 mb-2">Option A</span>
                {scenario.optionA}
                {existingVote.choice === 'A' && <span className="ml-2 text-red-400">← your vote</span>}
              </div>

              <div className="flex items-center gap-4">
                <div className="flex-1 h-px bg-[var(--border)]" />
                <span className="text-2xl font-black text-[var(--muted)]">OR</span>
                <div className="flex-1 h-px bg-[var(--border)]" />
              </div>

              <div className={`w-full rounded-2xl border-2 p-6 text-left font-semibold text-lg
                ${existingVote.choice === 'B'
                  ? 'border-blue-500 bg-blue-500/20 text-blue-300'
                  : 'border-blue-500/20 bg-blue-500/5 text-[var(--muted)] opacity-40'
                }`}
              >
                <span className="block text-xs font-black uppercase tracking-widest text-blue-400 mb-2">Option B</span>
                {scenario.optionB}
                {existingVote.choice === 'B' && <span className="ml-2 text-blue-400">← your vote</span>}
              </div>
            </div>

            {/* CTA to results */}
            <div className="flex gap-3 mt-6">
              <a
                href={`/results/${scenario.id}?voted=${existingVote.choice.toLowerCase()}`}
                className="flex-1 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-sm text-center transition-colors"
              >
                See results →
              </a>
              <a
                href="/"
                className="flex-1 py-3 rounded-xl border border-[var(--border)] hover:bg-white/5 text-[var(--muted)] font-bold text-sm text-center transition-colors"
              >
                Next dilemma
              </a>
            </div>
          </div>
        ) : (
          <>
            {/* vs divider */}
            <div className="flex items-center gap-4 mb-2">
              <div className="flex-1 h-px bg-[var(--border)]" />
              <span className="text-xs font-black text-[var(--muted)] tracking-widest">YOUR CHOICE</span>
              <div className="flex-1 h-px bg-[var(--border)]" />
            </div>

            {/* Vote buttons */}
            <div className="grid grid-cols-1 gap-4 mt-8">
              <button
                onClick={() => vote('a')}
                disabled={!!selected || loading}
                className={`w-full rounded-2xl border-2 p-6 text-left transition-all duration-200 font-semibold text-lg
                  ${selected === 'a'
                    ? 'border-red-500 bg-red-500/20 text-red-300 scale-[0.99]'
                    : 'border-red-500/30 bg-red-500/5 text-[var(--text)] hover:border-red-500/70 hover:bg-red-500/15 hover:-translate-y-0.5 cursor-pointer'
                  }
                  ${selected && selected !== 'a' ? 'opacity-30' : ''}
                `}
              >
                <span className="block text-xs font-black uppercase tracking-widest text-red-400 mb-2">Option A</span>
                {scenario.optionA}
              </button>

              <div className="flex items-center gap-4">
                <div className="flex-1 h-px bg-[var(--border)]" />
                <span className="text-2xl font-black text-[var(--muted)]">OR</span>
                <div className="flex-1 h-px bg-[var(--border)]" />
              </div>

              <button
                onClick={() => vote('b')}
                disabled={!!selected || loading}
                className={`w-full rounded-2xl border-2 p-6 text-left transition-all duration-200 font-semibold text-lg
                  ${selected === 'b'
                    ? 'border-blue-500 bg-blue-500/20 text-blue-300 scale-[0.99]'
                    : 'border-blue-500/30 bg-blue-500/5 text-[var(--text)] hover:border-blue-500/70 hover:bg-blue-500/15 hover:-translate-y-0.5 cursor-pointer'
                  }
                  ${selected && selected !== 'b' ? 'opacity-30' : ''}
                `}
              >
                <span className="block text-xs font-black uppercase tracking-widest text-blue-400 mb-2">Option B</span>
                {scenario.optionB}
              </button>
            </div>

            {loading && (
              <p className="text-center text-[var(--muted)] text-sm mt-8 animate-pulse">
                Counting your vote…
              </p>
            )}

            <p className="text-center text-xs text-[var(--muted)] mt-10 opacity-60">
              Anonymous. No account needed. Results update in real time.
            </p>
          </>
        )}
      </div>
    </>
  )
}
