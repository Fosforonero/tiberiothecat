'use client'

import { useEffect, useState } from 'react'
import type { Scenario } from '@/lib/scenarios'
import Link from 'next/link'
import AdSlot from '@/components/AdSlot'

interface Props {
  scenario: Scenario
  votes: { a: number; b: number }
  pctA: number
  pctB: number
  total: number
  voted: 'a' | 'b' | null
  nextId: string
  /** Optional locale prefix for share URLs, e.g. "/it" for Italian results */
  sharePrefix?: string
}

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://splitvote.io'
const SLOT_RESULTS = process.env.NEXT_PUBLIC_ADSENSE_SLOT_RESULTS ?? 'TODO'

export default function ResultsClientPage({ scenario, pctA, pctB, total, voted, nextId, sharePrefix = '' }: Props) {
  const [mounted, setMounted] = useState(false)
  const [copied, setCopied] = useState(false)
  const [feedbackGiven, setFeedbackGiven] = useState<'fire' | 'down' | null>(null)
  const [feedbackLoading, setFeedbackLoading] = useState(false)
  const [captionCopied, setCaptionCopied] = useState(false)
  const [discordCopied, setDiscordCopied] = useState(false)
  const [challengeCopied, setChallengeCopied] = useState(false)
  const [storySharing, setStorySharing] = useState(false)
  const [storyShared, setStoryShared] = useState(false)
  const [igCaptionCopied, setIgCaptionCopied] = useState(false)

  useEffect(() => {
    setMounted(true)
    // Restore feedback from cookie
    const cookie = document.cookie.split('; ').find(c => c.startsWith(`sv_fb_${scenario.id}=`))
    if (cookie) {
      const val = cookie.split('=')[1] as 'fire' | 'down'
      if (val === 'fire' || val === 'down') setFeedbackGiven(val)
    }
  }, [scenario.id])

  const shareUrl = `${BASE_URL}${sharePrefix}/play/${scenario.id}`
  const challengeUrl = `${BASE_URL}${sharePrefix}/play/${scenario.id}?challenge=1`
  const ogImageUrl = `${BASE_URL}/api/og?id=${scenario.id}`
  const storyCardUrl = `${BASE_URL}/api/story-card?id=${scenario.id}${voted ? `&voted=${voted}` : ''}`

  const tiktokCaption = `${pctA}% of the world would do this… would you? 😱\n\n"${scenario.question}"\n\n🔗 Vote at splitvote.io\n\n#wouldyourather #moraldilemma #viral #splitvote #psychology #debate`
  const instagramCaption = `"${scenario.question}"\n\n${pctA}% chose ${scenario.optionA}. ${pctB}% chose ${scenario.optionB}.${voted ? `\n\nI voted: ${voted === 'a' ? scenario.optionA : scenario.optionB}` : ''}\n\nWhat would YOU choose? 👇 Link in bio → splitvote.io\n\n#moraldilemma #wouldyourather #psychology #viral #splitvote`
  const twitterText = `"${scenario.question}" — The world is split ${pctA}% vs ${pctB}%. What would YOU choose? 🌍`
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(twitterText)}&url=${encodeURIComponent(shareUrl)}`
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${twitterText}\n${shareUrl}`)}`
  const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(twitterText)}`
  const discordText = `${scenario.emoji} **"${scenario.question}"**\nThe world is split **${pctA}%** vs **${pctB}%** — what would YOU choose?\n🔗 ${shareUrl}`

  const winnerOption = pctA > pctB ? 'a' : pctA < pctB ? 'b' : null
  const majorityPct = pctA > pctB ? pctA : pctB
  const majorityLabel = pctA > pctB ? scenario.optionA : scenario.optionB

  // Minority / majority reveal
  const pctVoted = voted === 'a' ? pctA : voted === 'b' ? pctB : null
  const isMinority = pctVoted !== null && pctVoted < 50
  const isTie = pctA === pctB

  const copyLink = () => {
    navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const copyCaption = () => {
    navigator.clipboard.writeText(tiktokCaption)
    setCaptionCopied(true)
    setTimeout(() => setCaptionCopied(false), 2000)
  }

  const copyDiscord = () => {
    navigator.clipboard.writeText(discordText)
    setDiscordCopied(true)
    setTimeout(() => setDiscordCopied(false), 2000)
  }

  const copyChallenge = () => {
    navigator.clipboard.writeText(challengeUrl)
    setChallengeCopied(true)
    setTimeout(() => setChallengeCopied(false), 2000)
  }

  const sendFeedback = async (type: 'fire' | 'down') => {
    if (feedbackGiven || feedbackLoading) return
    setFeedbackLoading(true)
    try {
      await fetch(`/api/dilemmas/${scenario.id}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
      })
      setFeedbackGiven(type)
    } finally {
      setFeedbackLoading(false)
    }
  }

  const copyIgCaption = () => {
    navigator.clipboard.writeText(instagramCaption)
    setIgCaptionCopied(true)
    setTimeout(() => setIgCaptionCopied(false), 2000)
  }

  // Share vertical story card via Web Share API (with SVG file if supported)
  const shareStory = async () => {
    if (!mounted) return
    setStorySharing(true)
    try {
      const res = await fetch(storyCardUrl)
      const blob = await res.blob()
      const file = new File([blob], `splitvote-story-${scenario.id}.svg`, { type: 'image/svg+xml' })

      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `SplitVote — ${scenario.question.slice(0, 60)}`,
          text: `${pctA}% vs ${pctB}% — What would you choose? 👇`,
        })
        setStoryShared(true)
      } else if (navigator.share) {
        // Fallback: share URL only
        await navigator.share({ title: 'SplitVote', url: shareUrl, text: `${pctA}% vs ${pctB}%` })
        setStoryShared(true)
      } else {
        // Final fallback: download
        const link = document.createElement('a')
        link.href = URL.createObjectURL(blob)
        link.download = `splitvote-story-${scenario.id}.svg`
        link.click()
      }
    } catch (e) {
      // User cancelled or share failed — download as fallback
      const link = document.createElement('a')
      link.href = storyCardUrl
      link.download = `splitvote-story-${scenario.id}.svg`
      link.click()
    } finally {
      setStorySharing(false)
    }
  }

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

      {/* ── Minority / Majority reveal ── */}
      {voted && pctVoted !== null && total >= 10 && (
        <div className={`text-center mb-6 rounded-2xl py-5 px-6 border ${
          isTie
            ? 'border-purple-500/30 bg-purple-500/10'
            : isMinority
            ? 'border-orange-500/30 bg-orange-500/10'
            : 'border-green-500/30 bg-green-500/10'
        }`}>
          {isTie ? (
            <>
              <p className="text-2xl font-black text-purple-400 mb-1">🤝 The world is perfectly split!</p>
              <p className="text-sm text-[var(--muted)]">50/50 — this dilemma divides humanity equally.</p>
            </>
          ) : isMinority ? (
            <>
              <p className="text-2xl font-black text-orange-400 mb-1">
                🔥 You're in the rebel {pctVoted}% minority!
              </p>
              <p className="text-sm text-[var(--muted)]">
                Most people disagreed with you. Are you an outsider — or just ahead of the curve?
              </p>
            </>
          ) : (
            <>
              <p className="text-2xl font-black text-green-400 mb-1">
                🌍 {pctVoted}% of the world agrees with you!
              </p>
              <p className="text-sm text-[var(--muted)]">
                You're with the majority on this one. Great minds think alike.
              </p>
            </>
          )}
        </div>
      )}

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
      <div className="text-center mb-10 text-[var(--muted)] text-sm">
        {pctA === pctB ? (
          <span>🤝 The world is perfectly split.</span>
        ) : (
          <span>
            🌍 <span className="text-white font-semibold">{majorityPct}%</span> of the world chose:{' '}
            <em className="not-italic text-white">{majorityLabel}</em>
          </span>
        )}
      </div>

      {/* ── Dilemma quality feedback ── */}
      <div className="mb-6 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 text-center">
        <p className="text-sm font-semibold text-[var(--text)] mb-3">
          Was this dilemma interesting?
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => sendFeedback('fire')}
            disabled={!!feedbackGiven || feedbackLoading}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all border
              ${feedbackGiven === 'fire'
                ? 'bg-orange-500/20 border-orange-500/50 text-orange-300'
                : feedbackGiven
                ? 'opacity-30 border-[var(--border)] text-[var(--muted)] cursor-not-allowed'
                : 'border-orange-500/30 bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 hover:border-orange-500/50'
              }`}
          >
            🔥 {feedbackGiven === 'fire' ? 'Voted!' : 'Interesting'}
          </button>
          <button
            onClick={() => sendFeedback('down')}
            disabled={!!feedbackGiven || feedbackLoading}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all border
              ${feedbackGiven === 'down'
                ? 'bg-[var(--border)] border-white/20 text-[var(--muted)]'
                : feedbackGiven
                ? 'opacity-30 border-[var(--border)] text-[var(--muted)] cursor-not-allowed'
                : 'border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] hover:bg-[var(--border)] hover:text-white'
              }`}
          >
            👎 {feedbackGiven === 'down' ? 'Noted' : 'Not for me'}
          </button>
        </div>
        {feedbackGiven && (
          <p className="mt-3 text-xs text-[var(--muted)]">Thanks for the feedback!</p>
        )}
      </div>

      {/* ── Challenge a friend CTA ── */}
      <div className="mb-6 rounded-2xl border border-yellow-500/20 bg-yellow-500/5 p-5 text-center">
        <p className="text-yellow-400 font-black text-base mb-1">⚡ Challenge a friend!</p>
        <p className="text-[var(--muted)] text-sm mb-4">
          Send them the link — they'll see your result only after they vote.
        </p>
        <button
          onClick={copyChallenge}
          className="w-full flex items-center justify-center gap-2 bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/40 text-yellow-300 font-bold text-sm px-5 py-3 rounded-xl transition-colors"
        >
          {challengeCopied ? '✅ Challenge link copied!' : '🔗 Copy challenge link'}
        </button>
      </div>

      {/* ── VIRAL SHARE SECTION ── */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden mb-8">
        {/* Share card preview */}
        <div className="relative bg-[#0a0a0f] group cursor-pointer" onClick={() => window.open(ogImageUrl, '_blank')}>
          <img
            src={ogImageUrl}
            alt="Share card"
            className="w-full h-auto"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
            <span className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/10 backdrop-blur-sm text-white font-bold text-sm px-4 py-2 rounded-xl border border-white/20">
              Open full size ↗
            </span>
          </div>
        </div>

        {/* Share action buttons */}
        <div className="p-5">
          <p className="text-xs text-[var(--muted)] font-semibold uppercase tracking-widest mb-4">
            🔥 Share your result
          </p>

          <div className="grid grid-cols-2 gap-3 mb-4">
            {/* Instagram / Save image */}
            <a
              href={ogImageUrl}
              target="_blank"
              rel="noopener noreferrer"
              download={`splitvote-${scenario.id}.svg`}
              className="flex flex-col items-center gap-1.5 bg-gradient-to-br from-purple-600/20 to-pink-600/20 hover:from-purple-600/30 hover:to-pink-600/30 border border-purple-500/30 text-purple-300 font-bold text-sm px-4 py-3.5 rounded-xl transition-all text-center"
            >
              <span className="text-xl">📸</span>
              <span>Save for Instagram</span>
            </a>

            {/* TikTok caption */}
            <button
              onClick={copyCaption}
              className="flex flex-col items-center gap-1.5 bg-[#010101]/30 hover:bg-[#010101]/50 border border-white/10 text-white font-bold text-sm px-4 py-3.5 rounded-xl transition-all text-center"
            >
              <span className="text-xl">🎵</span>
              <span>{captionCopied ? '✅ Copied!' : 'Copy TikTok caption'}</span>
            </button>
          </div>

          <div className="flex gap-2 mb-2">
            {/* X / Twitter */}
            <a
              href={twitterUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 bg-[#1DA1F2]/10 hover:bg-[#1DA1F2]/20 border border-[#1DA1F2]/30 text-[#1DA1F2] font-bold text-sm px-4 py-2.5 rounded-xl transition-colors"
            >
              𝕏 Share on X
            </a>

            {/* WhatsApp */}
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 bg-green-500/10 hover:bg-green-500/20 border border-green-500/30 text-green-400 font-bold text-sm px-4 py-2.5 rounded-xl transition-colors"
            >
              💬 WhatsApp
            </a>

            {/* Copy link */}
            <button
              onClick={copyLink}
              className="flex items-center justify-center bg-[var(--surface)] hover:bg-[var(--border)] border border-[var(--border)] text-[var(--muted)] hover:text-white font-bold text-sm px-4 py-2.5 rounded-xl transition-colors"
            >
              {copied ? '✅' : '🔗'}
            </button>
          </div>

          <div className="flex gap-2">
            {/* Discord — copies formatted text */}
            <button
              onClick={copyDiscord}
              className="flex-1 flex items-center justify-center gap-2 bg-[#5865F2]/10 hover:bg-[#5865F2]/20 border border-[#5865F2]/30 text-[#7289da] font-bold text-sm px-4 py-2.5 rounded-xl transition-colors"
            >
              <svg width="16" height="12" viewBox="0 0 71 55" fill="currentColor">
                <path d="M60.1 4.9A58.5 58.5 0 0 0 45.5.4a.22.22 0 0 0-.23.11 40.8 40.8 0 0 0-1.8 3.7 54 54 0 0 0-16.2 0 37.4 37.4 0 0 0-1.83-3.7.23.23 0 0 0-.23-.11A58.3 58.3 0 0 0 10.9 4.9a.21.21 0 0 0-.1.08C1.58 18.73-.96 32.16.3 45.4a.24.24 0 0 0 .09.17 58.8 58.8 0 0 0 17.7 8.95.23.23 0 0 0 .25-.08 42 42 0 0 0 3.61-5.88.22.22 0 0 0-.12-.31 38.7 38.7 0 0 1-5.53-2.64.23.23 0 0 1-.02-.37c.37-.28.74-.57 1.1-.86a.22.22 0 0 1 .23-.03c11.6 5.3 24.16 5.3 35.63 0a.22.22 0 0 1 .23.03c.36.29.73.58 1.1.86a.23.23 0 0 1-.02.38 36.4 36.4 0 0 1-5.54 2.63.23.23 0 0 0-.12.32 47.1 47.1 0 0 0 3.6 5.87.22.22 0 0 0 .25.09 58.6 58.6 0 0 0 17.72-8.95.23.23 0 0 0 .09-.16c1.49-15.43-2.5-28.75-10.56-40.6a.18.18 0 0 0-.09-.1zM23.73 37.3c-3.49 0-6.37-3.21-6.37-7.15 0-3.93 2.82-7.15 6.37-7.15 3.57 0 6.42 3.25 6.37 7.15 0 3.94-2.82 7.15-6.37 7.15zm23.54 0c-3.49 0-6.37-3.21-6.37-7.15 0-3.93 2.82-7.15 6.37-7.15 3.57 0 6.42 3.25 6.37 7.15 0 3.94-2.8 7.15-6.37 7.15z"/>
              </svg>
              {discordCopied ? '✅ Copied!' : 'Copy for Discord'}
            </button>

            {/* Telegram */}
            <a
              href={telegramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 bg-[#0088cc]/10 hover:bg-[#0088cc]/20 border border-[#0088cc]/30 text-[#0088cc] font-bold text-sm px-4 py-2.5 rounded-xl transition-colors"
            >
              ✈️ Telegram
            </a>
          </div>
        </div>
      </div>

      {/* ── Share as Story (IG/TikTok vertical card) ── */}
      <div className="rounded-2xl border border-[var(--border)] bg-[#0a0a1a]/60 overflow-hidden mb-8">
        <div className="p-5 pb-3">
          <p className="text-xs text-[var(--muted)] font-semibold uppercase tracking-widest mb-3">
            📱 Share as Story
          </p>
          <p className="text-xs text-[var(--muted)] mb-4">
            Ready for Instagram Stories & TikTok. Share or download the 9:16 card, then upload manually.
          </p>
        </div>

        {/* Story card preview */}
        <div className="relative mx-5 mb-4" style={{ maxWidth: 200 }}>
          <img
            src={storyCardUrl}
            alt="Story card preview"
            className="w-full rounded-xl border border-white/10"
            style={{ aspectRatio: '9/16', objectFit: 'cover' }}
            loading="lazy"
          />
        </div>

        <div className="p-5 pt-0 grid grid-cols-2 gap-2">
          {/* Web Share / Download */}
          <button
            onClick={shareStory}
            disabled={storySharing}
            className="flex flex-col items-center gap-1.5 bg-gradient-to-br from-pink-600/20 to-purple-600/20 hover:from-pink-600/30 hover:to-purple-600/30 border border-pink-500/30 text-pink-300 font-bold text-xs px-3 py-3 rounded-xl transition-all"
          >
            <span className="text-lg">{storyShared ? '✅' : storySharing ? '⏳' : '📤'}</span>
            <span>{storyShared ? 'Shared!' : storySharing ? 'Loading…' : 'Share Story'}</span>
          </button>

          {/* Direct download */}
          <a
            href={storyCardUrl}
            download={`splitvote-story-${scenario.id}.svg`}
            className="flex flex-col items-center gap-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-[var(--muted)] hover:text-white font-bold text-xs px-3 py-3 rounded-xl transition-all"
          >
            <span className="text-lg">⬇️</span>
            <span>Download Card</span>
          </a>

          {/* TikTok caption */}
          <button
            onClick={copyCaption}
            className="flex flex-col items-center gap-1.5 bg-[#010101]/30 hover:bg-[#010101]/50 border border-white/10 text-white font-bold text-xs px-3 py-3 rounded-xl transition-all"
          >
            <span className="text-lg">🎵</span>
            <span>{captionCopied ? '✅ Copied!' : 'TikTok Caption'}</span>
          </button>

          {/* Instagram caption */}
          <button
            onClick={copyIgCaption}
            className="flex flex-col items-center gap-1.5 bg-gradient-to-br from-purple-600/10 to-pink-600/10 hover:from-purple-600/20 hover:to-pink-600/20 border border-purple-500/20 text-purple-300 font-bold text-xs px-3 py-3 rounded-xl transition-all"
          >
            <span className="text-lg">📸</span>
            <span>{igCaptionCopied ? '✅ Copied!' : 'IG Caption'}</span>
          </button>
        </div>

        <p className="text-[10px] text-[var(--muted)] text-center pb-4 px-5">
          Upload to Instagram Stories or TikTok manually — auto-post not available via web.
        </p>
      </div>

      {/* ── AdSense — shown after results, before CTA ── */}
      <AdSlot slot={SLOT_RESULTS} className="rounded-2xl mb-8" />

      {/* ── Next dilemma CTA ── */}
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link
          href={`/play/${nextId}`}
          className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm px-6 py-3.5 transition-colors text-center"
        >
          Next dilemma →
        </Link>
        <Link
          href="/"
          className="flex-1 flex items-center justify-center border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--border)] text-[var(--text)] font-semibold text-sm px-6 py-3.5 rounded-xl transition-colors text-center"
        >
          All dilemmas
        </Link>
      </div>
    </div>
  )
}
