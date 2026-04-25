'use client'

import { useEffect, useState } from 'react'
import type { Scenario } from '@/lib/scenarios'
import Link from 'next/link'

interface Props {
  scenario: Scenario
  votes: { a: number; b: number }
  pctA: number
  pctB: number
  total: number
  voted: 'a' | 'b' | null
}

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://splitvote.io'

export default function ResultsClientPage({ scenario, pctA, pctB, total, voted }: Props) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const shareUrl = `${BASE_URL}/play/${scenario.id}`
  const shareText = `"${scenario.question}" — The world is split ${pctA}% vs ${pctB}%. What would YOU choose? 🌍`
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText + '\n' + shareUrl)}`

  const winnerOption = pctA > pctB ? 'a' : pctA < pctB ? 'b' : null

  return (
    <div className="max-w-2xl mx-auto px-4 py-16">
      <a href="/" className="text-sm text-[var(--muted)] hover:text-white transition-colors mb-8 inline-block">
        ← All dilemmas
      </a>

      {/* Question recap */}
      <div className="text-center mb-10">
        <span className="text-5xl mb-4 block">{scenario.emoji}</span>
        <h1 className="text-xl md:text-2xl font-bold text-[var(--text)] leading-snug mb-2">
          {scenario.question}
        </h1>
        <p className="text-sm text-[var(--muted)]">
          {total.toLocaleString()} votes worldwide
        </p>
      </div>

      {/* Your vote badge */}
      {voted && (
        <div className={`text-center mb-6 text-sm font-semibold rounded-xl py-3 border
          ${voted === 'a'
            ? 'text-red-300 border-red-500/30 bg-red-500/10'
            : 'text-blue-300 border-blue-500/30 bg-blue-500/10'
          }`}>
          You voted: {voted === 'a' ? scenario.optionA : scenario.optionB}
        </div>
      )}

      {/* Result bars */}
      <div className="space-y-4 mb-10">
        {/* Option A */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm font-semibold text-[var(--text)]">{scenario.optionA}</span>
            <span className={`text-lg font-black ${winnerOption === 'a' ? 'text-red-400' : 'text-[var(--muted)]'}`}>
              {pctA}%
            </span>
          </div>
          <div className="h-6 bg-[var(--border)] rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-1000 ease-out ${winnerOption === 'a' ? 'bg-red-500' : 'bg-red-500/50'}`}
              style={{ width: mounted ? `${pctA}%` : '0%' }}
            />
          </div>
        </div>

        {/* Option B */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm font-semibold text-[var(--text)]">{scenario.optionB}</span>
            <span className={`text-lg font-black ${winnerOption === 'b' ? 'text-blue-400' : 'text-[var(--muted)]'}`}>
              {pctB}%
            </span>
          </div>
          <div className="h-6 bg-[var(--border)] rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-1000 ease-out ${winnerOption === 'b' ? 'bg-blue-500' : 'bg-blue-500/50'}`}
              style={{ width: mounted ? `${pctB}%` : '0%' }}
            />
          </div>
        </div>
      </div>

      {/* Winner label */}
      {winnerOption && (
        <div className="text-center mb-8 text-[var(--muted)] text-sm">
          {pctA === pctB ? (
            <span>🤝 The world is perfectly split.</span>
          ) : (
            <span>
              🌍 <span className="text-white font-semibold">{winnerOption === 'a' ? pctA : pctB}%</span> of the world chose:{' '}
              <em className="not-italic text-white">{winnerOption === 'a' ? scenario.optionA : scenario.optionB}</em>
            </span>
          )}
        </div>
      )}

      {/* Share buttons */}
      <div className="text-center">
        <p className="text-sm text-[var(--muted)] mb-4 font-medium">Challenge your friends →</p>
        <div className="flex gap-3 justify-center flex-wrap">
          <a
            href={twitterUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-[#1DA1F2]/10 hover:bg-[#1DA1F2]/20 border border-[#1DA1F2]/30 text-[#1DA1F2] font-bold text-sm px-5 py-3 rounded-xl transition-colors"
          >
            𝕏 Share on X
          </a>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-green-500/10 hover:bg-green-500/20 border border-green-500/30 text-green-400 font-bold text-sm px-5 py-3 rounded-xl transition-colors"
          >
            💬 WhatsApp
          </a>
          <button
            onClick={() => navigator.clipboard.writeText(shareUrl)}
            className="inline-flex items-center gap-2 bg-[var(--surface)] hover:bg-[var(--border)] border border-[var(--border)] text-[var(--muted)] hover:text-white font-bold text-sm px-5 py-3 rounded-xl transition-colors"
          >
            🔗 Copy link
          </button>
        </div>
      </div>

      {/* Next dilemma */}
      <div className="mt-12 text-center">
        <Link
          href="/"
          className="inline-block border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--border)] text-[var(--text)] font-semibold text-sm px-6 py-3 rounded-xl transition-colors"
        >
          Try another dilemma →
        </Link>
      </div>

      {/* AdSense placeholder */}
      <div className="mt-12 rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface)] p-6 text-center text-[var(--muted)] text-xs">
        <span className="opacity-30">Advertisement</span>
      </div>
    </div>
  )
}
