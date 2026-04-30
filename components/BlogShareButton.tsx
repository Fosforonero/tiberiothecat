'use client'

import { useState } from 'react'
import { Share2 } from 'lucide-react'
import { shareQuestion } from '@/lib/share-question'
import { track } from '@/lib/gtag'

interface Props {
  title: string
  text: string
  url: string
  locale: 'en' | 'it'
  slug: string
  target: 'blog_card' | 'blog_article'
}

export default function BlogShareButton({ title, text, url, locale, slug, target }: Props) {
  const [copied, setCopied] = useState(false)

  async function handleShare(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    const result = await shareQuestion({ title, text, url })
    track('share_clicked', { target, slug, locale })
    if (result === 'copied') {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const label = copied
    ? (locale === 'it' ? 'Copiato!' : 'Copied!')
    : (locale === 'it' ? 'Condividi' : 'Share')

  return (
    <button
      onClick={handleShare}
      aria-label={label}
      className="flex items-center gap-1.5 text-xs text-[var(--muted)] hover:text-white transition-colors px-2 py-1 rounded-lg hover:bg-white/10 shrink-0"
    >
      <Share2 size={14} aria-hidden="true" />
      <span>{label}</span>
    </button>
  )
}
