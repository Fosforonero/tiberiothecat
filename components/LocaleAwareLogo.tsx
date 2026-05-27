'use client'
import Link from 'next/link'
import { useLocale } from '@/hooks/useLocale'

export default function LocaleAwareLogo() {
  const { prefix } = useLocale()
  const href = prefix || '/'
  return (
    <Link href={href} className="flex-shrink-0 flex items-center group" aria-label="SplitVote home">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/brand/splitvote_wordmark.webp"
        alt="SplitVote"
        width={121}
        height={28}
        className="h-[28px] w-auto flex-shrink-0"
      />
    </Link>
  )
}
