'use client'
import { usePathname } from 'next/navigation'
import Link from 'next/link'

export default function LocaleAwareLogo() {
  const pathname = usePathname()
  const href = pathname.startsWith('/it') ? '/it' : '/'
  return (
    <Link href={href} className="flex-shrink-0 flex items-center group" aria-label="SplitVote home">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/brand/splitvote_wordmark.png"
        alt="SplitVote"
        height={28}
        className="h-[28px] w-auto flex-shrink-0"
      />
    </Link>
  )
}
