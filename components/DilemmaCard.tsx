import Link from 'next/link'
import { Globe, Sparkles, Flame } from 'lucide-react'
import type { Scenario } from '@/lib/scenarios'
import DilemmaOptionPills from '@/components/DilemmaOptionPills'
import { CATEGORY_LABELS_IT } from '@/lib/scenarios-it'

export type DilemmaCardBadge = 'trending' | 'ai' | 'new' | 'voted'

interface Props {
  scenario: Scenario
  playHref: string
  totalVotes?: number
  badge?: DilemmaCardBadge
  locale?: 'en' | 'it'
}

const BADGE_COPY = {
  en: { trending: 'trending', new: '🆕 new', voted: '✓ Voted', ai: 'New' },
  it: { trending: 'tendenza', new: '🆕 nuovo', voted: '✓ Votato', ai: 'Nuovo' },
}

export default function DilemmaCard({ scenario, playHref, totalVotes, badge, locale = 'en' }: Props) {
  const badgeCopy = locale === 'it' ? BADGE_COPY.it : BADGE_COPY.en
  const votesLabel = locale === 'it' ? 'voti' : 'votes'

  return (
    <Link href={playHref} className="card-neon group block rounded-2xl p-5 sm:p-6">
      <div className="flex items-start gap-3 sm:gap-4">
        <span className="text-3xl sm:text-4xl flex-shrink-0">{scenario.emoji}</span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="text-xs font-bold uppercase tracking-widest text-[var(--muted)]">
              {locale === 'it' ? (CATEGORY_LABELS_IT[scenario.category] ?? scenario.category) : scenario.category}
            </span>
            {badge === 'trending' && (
              <span className="flex items-center gap-1 text-[10px] bg-orange-500/20 text-orange-400 border border-orange-500/30 rounded-full px-2 py-0.5 font-bold">
                <Flame size={9} />
                {badgeCopy.trending}
              </span>
            )}
            {badge === 'ai' && (
              <span className="flex items-center gap-1 text-[10px] bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-full px-2 py-0.5 font-bold">
                <Sparkles size={9} />
                {badgeCopy.ai}
              </span>
            )}
            {badge === 'new' && (
              <span className="text-[10px] bg-green-500/20 text-green-400 border border-green-500/30 rounded-full px-2 py-0.5 font-bold">
                {badgeCopy.new}
              </span>
            )}
            {badge === 'voted' && (
              <span className="text-[10px] bg-green-500/20 text-green-400 border border-green-500/30 rounded-full px-2 py-0.5 font-bold">
                {badgeCopy.voted}
              </span>
            )}
          </div>
          <p className="font-semibold text-[var(--text)] leading-snug mb-3 line-clamp-3 text-sm sm:text-base">
            {scenario.question}
          </p>
          <DilemmaOptionPills optionA={scenario.optionA} optionB={scenario.optionB} />
          {totalVotes !== undefined && totalVotes > 0 && (
            <div className="mt-2.5 flex items-center gap-1.5 text-xs text-[var(--muted)]">
              <Globe size={10} />
              <span>{totalVotes.toLocaleString(locale === 'it' ? 'it-IT' : 'en-US')} {votesLabel}</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}
