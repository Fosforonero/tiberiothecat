import Link from 'next/link'
import { Globe, Sparkles, Flame } from 'lucide-react'
import type { Scenario } from '@/lib/scenarios'

export type DilemmaCardBadge = 'trending' | 'ai' | 'new'

interface Props {
  scenario: Scenario
  playHref: string
  totalVotes?: number
  badge?: DilemmaCardBadge
}

export default function DilemmaCard({ scenario, playHref, totalVotes, badge }: Props) {
  return (
    <Link href={playHref} className="card-neon group block rounded-2xl p-5 sm:p-6">
      <div className="flex items-start gap-3 sm:gap-4">
        <span className="text-3xl sm:text-4xl flex-shrink-0">{scenario.emoji}</span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="text-xs font-bold uppercase tracking-widest text-[var(--muted)]">
              {scenario.category}
            </span>
            {badge === 'trending' && (
              <span className="flex items-center gap-1 text-[10px] bg-orange-500/20 text-orange-400 border border-orange-500/30 rounded-full px-2 py-0.5 font-bold">
                <Flame size={9} />
                trending
              </span>
            )}
            {badge === 'ai' && (
              <span className="flex items-center gap-1 text-[10px] bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-full px-2 py-0.5 font-bold">
                <Sparkles size={9} />
                AI
              </span>
            )}
            {badge === 'new' && (
              <span className="text-[10px] bg-green-500/20 text-green-400 border border-green-500/30 rounded-full px-2 py-0.5 font-bold">
                🆕 new
              </span>
            )}
          </div>
          <p className="font-semibold text-[var(--text)] leading-snug mb-3 line-clamp-3 text-sm sm:text-base">
            {scenario.question}
          </p>
          <div className="flex gap-2 flex-wrap">
            <span className="text-xs bg-red-500/10 text-red-400 border border-red-500/20 rounded-full px-3 py-1 line-clamp-1 max-w-[45%]">
              {scenario.optionA.split('.')[0]}
            </span>
            <span className="text-xs bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full px-3 py-1 line-clamp-1 max-w-[45%]">
              {scenario.optionB.split('.')[0]}
            </span>
          </div>
          {totalVotes !== undefined && totalVotes > 0 && (
            <div className="mt-2.5 flex items-center gap-1.5 text-xs text-[var(--muted)]">
              <Globe size={10} />
              <span>{totalVotes.toLocaleString()} votes</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}
