'use client'

import { useState } from 'react'
import { Share2 } from 'lucide-react'
import { shareQuestion } from '@/lib/share-question'
import { track } from '@/lib/gtag'

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://splitvote.io'

interface Props {
  question: string
  /** Relative URL path, e.g. /play/trolley or /it/play/trolley */
  playHref: string
  scenarioId: string
  locale: 'en' | 'it'
}

export default function DilemmaCardShareButton({ question, playHref, scenarioId, locale }: Props) {
  const [copied, setCopied] = useState(false)

  async function handleShare(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    const url = `${BASE_URL}${playHref}`
    const text =
      locale === 'it'
        ? `"${question}" — Tu cosa sceglieresti?`
        : `"${question}" — What would you choose?`
    const result = await shareQuestion({ title: question, text, url })
    if (result !== 'cancelled') {
      track('share_clicked', {
        target: result === 'copied' ? 'copy_link' : 'dilemma_card',
        scenario_id: scenarioId,
        locale,
      })
    }
    if (result === 'copied') {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const label = copied
    ? locale === 'it'
      ? 'Copiato!'
      : 'Copied!'
    : locale === 'it'
      ? 'Condividi'
      : 'Share'

  return (
    <button
      type="button"
      onClick={handleShare}
      aria-label={label}
      className="flex items-center gap-1.5 text-xs text-[var(--muted)] hover:text-white transition-colors px-2 py-1 rounded-lg hover:bg-white/10 shrink-0"
    >
      <Share2 size={12} aria-hidden="true" />
      <span>{label}</span>
    </button>
  )
}
