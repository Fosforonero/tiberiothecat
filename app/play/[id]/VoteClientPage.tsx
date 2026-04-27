'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { Scenario } from '@/lib/scenarios'
import Script from 'next/script'
import { track } from '@/lib/gtag'

interface ExistingVote {
  choice: 'A' | 'B'
  canChangeUntil: string
}

interface Props {
  scenario: Scenario
  existingVote?: ExistingVote | null
  totalVotes?: number
  isChallenge?: boolean
  localePrefix?: '' | '/it'
  nextId?: string
  referralCode?: string
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

function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  )
}

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://splitvote.io'

const EN_COPY = {
  back:           '← All dilemmas',
  challengeTitle: '🔥 Someone challenged you!',
  challengeText:  "A friend wants to know which side you're on. Choose wisely.",
  joinVoted:      (n: number) => `🌍 Join ${n.toLocaleString('en-US')} people who already voted`,
  alreadyVoted:   '✅ You already voted',
  canChange:      (t: string) => `🕐 Can change for ${t}`,
  voteLocked:     '🔒 Vote locked',
  yourChoice:     'YOUR CHOICE',
  or:             'OR',
  yourVote:       '← your vote',
  seeResults:     'See results →',
  nextDilemma:    'Next dilemma →',
  counting:       'Counting your vote…',
  voteError:      'Something went wrong. Please try again.',
  disclaimer:     'Anonymous. No account needed. Results update in real time.',
}

const IT_COPY = {
  back:           '← Tutti i dilemmi',
  challengeTitle: '🔥 Ti hanno sfidato!',
  challengeText:  'Un amico vuole sapere da che parte stai. Scegli con cura.',
  joinVoted:      (n: number) => `🌍 Unisciti a ${n.toLocaleString('it-IT')} persone che hanno già votato`,
  alreadyVoted:   '✅ Hai già votato',
  canChange:      (t: string) => `🕐 Puoi cambiare per altri ${t}`,
  voteLocked:     '🔒 Voto bloccato',
  yourChoice:     'LA TUA SCELTA',
  or:             'OPPURE',
  yourVote:       '← il tuo voto',
  seeResults:     'Vedi risultati →',
  nextDilemma:    'Prossimo dilemma →',
  counting:       'Conteggio del tuo voto…',
  voteError:      'Qualcosa è andato storto. Riprova.',
  disclaimer:     'Anonimo. Nessun account richiesto. I risultati si aggiornano in tempo reale.',
}

export default function VoteClientPage({
  scenario,
  existingVote,
  totalVotes = 0,
  isChallenge = false,
  localePrefix = '',
  nextId,
  referralCode,
}: Props) {
  const [selected, setSelected] = useState<'a' | 'b' | null>(null)
  const [loading, setLoading] = useState(false)
  const [voteError, setVoteError] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState<string>('')
  const router = useRouter()

  const copy = localePrefix === '/it' ? IT_COPY : EN_COPY
  const locale = localePrefix === '/it' ? 'it' : 'en'
  const nextHref = nextId ? `${localePrefix}/play/${nextId}` : localePrefix || '/'

  // Cookie-based redirect for non-logged users
  useEffect(() => {
    if (existingVote) return
    const previousVote = getCookie(`sv_voted_${scenario.id}`)
    if (previousVote === 'a' || previousVote === 'b') {
      router.replace(`${localePrefix}/results/${scenario.id}?voted=${previousVote}`)
    }
  }, [scenario.id, router, existingVote, localePrefix])

  // Update time remaining every minute
  useEffect(() => {
    if (!existingVote) return
    setTimeRemaining(formatTimeRemaining(existingVote.canChangeUntil))
    const interval = setInterval(() => {
      setTimeRemaining(formatTimeRemaining(existingVote.canChangeUntil))
    }, 60_000)
    return () => clearInterval(interval)
  }, [existingVote])

  // Record referral visit for the challenge_friend mission (once per session per link)
  useEffect(() => {
    if (!referralCode) return
    const key = `sv_ref_${referralCode}_${scenario.id}`
    if (sessionStorage.getItem(key)) return
    sessionStorage.setItem(key, '1')
    fetch('/api/referral/visit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ref: referralCode, scenarioId: scenario.id }),
    }).catch(() => { /* non-blocking */ })
  }, [referralCode, scenario.id])

  async function vote(option: 'a' | 'b') {
    if (loading || selected) return
    setSelected(option)
    setLoading(true)
    setVoteError(false)
    try {
      const res = await fetch('/api/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: scenario.id, option }),
      })
      if (!res.ok) {
        setLoading(false)
        setSelected(null)
        setVoteError(true)
        return
      }
      track('vote_submitted', {
        scenario_id: scenario.id,
        category: scenario.category,
        choice: option,
        locale,
      })
      router.push(`${localePrefix}/results/${scenario.id}?voted=${option}`)
    } catch {
      setLoading(false)
      setSelected(null)
      setVoteError(true)
    }
  }

  // JSON-LD structured data for rich snippets
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Question',
    name: scenario.question,
    text: scenario.question,
    url: `${BASE_URL}${localePrefix}/play/${scenario.id}`,
    suggestedAnswer: [
      {
        '@type': 'Answer',
        text: scenario.optionA,
        url: `${BASE_URL}${localePrefix}/results/${scenario.id}`,
      },
      {
        '@type': 'Answer',
        text: scenario.optionB,
        url: `${BASE_URL}${localePrefix}/results/${scenario.id}`,
      },
    ],
    dateCreated: '2026-01-01',
    inLanguage: localePrefix === '/it' ? 'it' : 'en',
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
        <Link href={localePrefix || '/'} className="text-sm text-[var(--muted)] hover:text-white transition-colors mb-8 inline-block">
          {copy.back}
        </Link>

        {/* ── Challenge banner ── */}
        {isChallenge && !existingVote && (
          <div className="mb-6 rounded-2xl border border-orange-500/30 bg-orange-500/10 px-5 py-4 text-center">
            <p className="text-orange-400 font-black text-lg mb-0.5">{copy.challengeTitle}</p>
            <p className="text-[var(--muted)] text-sm">{copy.challengeText}</p>
          </div>
        )}

        {/* Question */}
        <div className="text-center mb-12">
          <span className="text-5xl mb-6 block">{scenario.emoji}</span>
          <span className="text-xs font-bold uppercase tracking-widest text-[var(--muted)] mb-4 block">
            {scenario.category}
          </span>
          <h1 className="text-2xl md:text-3xl font-bold text-[var(--text)] leading-snug">
            {scenario.question}
          </h1>

          {/* Live vote counter */}
          {totalVotes > 0 && (
            <p className="text-sm text-[var(--muted)] mt-4">
              {copy.joinVoted(totalVotes)}
            </p>
          )}
        </div>

        {/* Already voted — locked state */}
        {existingVote ? (
          <div className="space-y-4">
            {/* Voted banner */}
            <div className="rounded-2xl border border-blue-500/40 bg-blue-500/10 px-6 py-4 text-center">
              <p className="text-blue-300 font-semibold text-sm mb-1">{copy.alreadyVoted}</p>
              <p className="text-white font-bold text-lg">&ldquo;{votedOptionText}&rdquo;</p>
              {canStillChange && timeRemaining ? (
                <p className="text-[var(--muted)] text-xs mt-2">
                  {copy.canChange(timeRemaining)}
                </p>
              ) : (
                <p className="text-[var(--muted)] text-xs mt-2">
                  {copy.voteLocked}
                </p>
              )}
            </div>

            {/* Options — grayed out, chosen one highlighted */}
            <div className="vs divider flex items-center gap-4 mt-2">
              <div className="flex-1 h-px bg-[var(--border)]" />
              <span className="text-xs font-black text-[var(--muted)] tracking-widest">{copy.yourChoice}</span>
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
                {existingVote.choice === 'A' && <span className="ml-2 text-red-400">{copy.yourVote}</span>}
              </div>

              <div className="flex items-center gap-4">
                <div className="flex-1 h-px bg-[var(--border)]" />
                <span className="text-2xl font-black text-[var(--muted)]">{copy.or}</span>
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
                {existingVote.choice === 'B' && <span className="ml-2 text-blue-400">{copy.yourVote}</span>}
              </div>
            </div>

            {/* CTA to results / next */}
            <div className="flex gap-3 mt-6">
              <Link
                href={`${localePrefix}/results/${scenario.id}?voted=${existingVote.choice.toLowerCase()}`}
                className="flex-1 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-sm text-center transition-colors"
              >
                {copy.seeResults}
              </Link>
              <Link
                href={nextHref}
                onClick={() => track('next_dilemma_clicked', { scenario_id: scenario.id, locale, source: 'play_already_voted' })}
                className="flex-1 py-3 rounded-xl border border-[var(--border)] hover:bg-white/5 text-[var(--muted)] font-bold text-sm text-center transition-colors"
              >
                {copy.nextDilemma}
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* vs divider */}
            <div className="flex items-center gap-4 mb-2">
              <div className="flex-1 h-px bg-[var(--border)]" />
              <span className="text-xs font-black text-[var(--muted)] tracking-widest">{copy.yourChoice}</span>
              <div className="flex-1 h-px bg-[var(--border)]" />
            </div>

            {/* Vote buttons */}
            <div className="grid grid-cols-1 gap-4 mt-8">
              <button
                onClick={() => vote('a')}
                disabled={!!selected || loading}
                className={`w-full rounded-2xl border-2 p-6 text-left font-semibold text-lg
                  ${selected === 'a'
                    ? 'border-red-500 bg-red-500/20 text-red-300 scale-[0.99] animate-vote-tap'
                    : 'border-red-500/30 bg-red-500/5 text-[var(--text)] hover:border-red-500/70 hover:bg-red-500/15 hover:-translate-y-0.5 cursor-pointer'
                  }
                  ${selected && selected !== 'a' ? 'opacity-30' : ''}
                  transition-all duration-200
                `}
              >
                <span className="block text-xs font-black uppercase tracking-widest text-red-400 mb-2">Option A</span>
                {scenario.optionA}
              </button>

              <div className="flex items-center gap-4">
                <div className="flex-1 h-px bg-[var(--border)]" />
                <span className="text-2xl font-black text-[var(--muted)]">{copy.or}</span>
                <div className="flex-1 h-px bg-[var(--border)]" />
              </div>

              <button
                onClick={() => vote('b')}
                disabled={!!selected || loading}
                className={`w-full rounded-2xl border-2 p-6 text-left font-semibold text-lg
                  ${selected === 'b'
                    ? 'border-blue-500 bg-blue-500/20 text-blue-300 scale-[0.99] animate-vote-tap'
                    : 'border-blue-500/30 bg-blue-500/5 text-[var(--text)] hover:border-blue-500/70 hover:bg-blue-500/15 hover:-translate-y-0.5 cursor-pointer'
                  }
                  ${selected && selected !== 'b' ? 'opacity-30' : ''}
                  transition-all duration-200
                `}
              >
                <span className="block text-xs font-black uppercase tracking-widest text-blue-400 mb-2">Option B</span>
                {scenario.optionB}
              </button>
            </div>

            {loading && (
              <div className="flex items-center justify-center gap-2 text-[var(--muted)] text-sm mt-8">
                <Spinner />
                <span>{copy.counting}</span>
              </div>
            )}

            {voteError && (
              <p className="text-center text-red-400 text-sm mt-8">
                {copy.voteError}
              </p>
            )}

            <p className="text-center text-xs text-[var(--muted)] mt-10 opacity-60">
              {copy.disclaimer}
            </p>
          </>
        )}
      </div>
    </>
  )
}
