import Link from 'next/link'
import SplitBar from '@/components/SplitBar'
import CatalogCardVoted from '@/components/CatalogCardVoted'
import DilemmaCardShareButton from '@/components/DilemmaCardShareButton'
import { CATEGORY_LABELS_IT } from '@/lib/scenarios-it'
import type { Category } from '@/lib/scenarios'
import { CATEGORY_HUE } from '@/lib/catalog'

export type CatalogCardBadge = 'trending' | 'new' | 'ai' | 'contested'

interface Props {
  id:          string
  question:    string
  optionA:     string
  optionB:     string
  emoji:       string
  category:    Category
  locale:      'en' | 'it'
  playHref:    string
  resultsHref: string
  totalVotes:  number
  /** A's percentage 0-100. If undefined, the bar + percentages are hidden. */
  aPct?:       number
  badge?:      CatalogCardBadge
  /** Soft "today" count to surface below the card. Hidden if 0. */
  todayVotes?: number
  /** Lifestyle gets a small badge to set expectations. */
  isLifestyle?: boolean
}

const COPY = {
  en: {
    trending:  'TRENDING',
    new:       'NEW',
    ai:        'AI',
    contested: '50/50',
    lifestyle: 'LIFESTYLE',
    youVoted:  'YOU VOTED',
    votes:     (n: number) => `${formatN(n, 'en')} votes`,
    today:     (n: number) => `${formatN(n, 'en')} today`,
  },
  it: {
    trending:  'TENDENZA',
    new:       'NUOVO',
    ai:        'IA',
    contested: '50/50',
    lifestyle: 'LIFESTYLE',
    youVoted:  'HAI VOTATO',
    votes:     (n: number) => `${formatN(n, 'it')} voti`,
    today:     (n: number) => `${formatN(n, 'it')} oggi`,
  },
}

function formatN(n: number, locale: 'en' | 'it') {
  return n.toLocaleString(locale === 'it' ? 'it-IT' : 'en-US')
}

function badgeClass(badge: CatalogCardBadge): string {
  switch (badge) {
    case 'trending':  return 'text-[var(--neon-yellow)] border-[rgba(255,215,0,0.4)]'
    case 'new':       return 'text-[var(--neon-green)] border-[rgba(0,255,136,0.4)]'
    case 'ai':        return 'text-[var(--neon-purple)] border-[rgba(180,77,255,0.5)]'
    case 'contested': return 'text-[var(--neon-blue)] border-[rgba(0,212,255,0.4)]'
  }
}

export default function CatalogCard({
  id, question, optionA, optionB, emoji, category, locale,
  playHref, resultsHref, totalVotes, aPct, badge, todayVotes, isLifestyle,
}: Props) {
  const c = COPY[locale]
  const categoryLabel = locale === 'it' ? (CATEGORY_LABELS_IT[category] ?? category) : category
  const hue = CATEGORY_HUE[category]
  const bPct = aPct !== undefined ? Math.max(0, 100 - aPct) : undefined
  const hasSplit = aPct !== undefined && totalVotes >= 50

  return (
    <article className="cat-card group relative bg-[var(--surface)] border border-[var(--border)] rounded-[16px] overflow-hidden transition-all hover:border-[rgba(77,159,255,0.4)] hover:bg-[var(--surface2)] hover:-translate-y-px hover:shadow-[0_8px_32px_rgba(77,159,255,0.10)] motion-reduce:transition-none motion-reduce:hover:translate-y-0">
      {/* Top hairline shimmer */}
      <div
        aria-hidden="true"
        className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/[0.18] to-transparent z-[1]"
      />

      <Link
        href={playHref}
        className="block px-[18px] pt-4 pb-3"
        aria-label={question}
      >
        <div className="flex gap-3 items-start">
          <span
            className="text-2xl leading-none flex-shrink-0 mt-0.5"
            aria-hidden="true"
            style={{ filter: 'saturate(0.85)' }}
          >
            {emoji}
          </span>
          <div className="flex-1 min-w-0">
            {/* Meta line — category dot + badges + voted tag */}
            <div className="flex items-center gap-1.5 flex-wrap font-mono text-[10px] font-semibold tracking-[0.18em] uppercase mb-2.5 min-h-[18px]">
              <span className="text-[var(--muted)] inline-flex items-center gap-1.5">
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  aria-hidden="true"
                  style={{ background: `oklch(0.75 0.16 ${hue})` }}
                />
                {categoryLabel}
              </span>
              {badge && (
                <span
                  className={`px-1.5 py-0.5 border rounded-full text-[9px] font-bold tracking-[0.14em] ${badgeClass(badge)}`}
                >
                  {c[badge]}
                </span>
              )}
              {isLifestyle && (
                <span className="px-1.5 py-0.5 border rounded-full text-[9px] font-bold tracking-[0.14em] text-yellow-300 border-yellow-500/30 bg-yellow-500/10">
                  {c.lifestyle}
                </span>
              )}
              {/* Client-side voted indicator (cookie + localStorage) */}
              <CatalogCardVoted scenarioId={id} locale={locale} resultsHref={resultsHref} youVotedCopy={c.youVoted} />
            </div>

            {/* Question — clamped to 4 lines + fixed min-height so the
                option pills (and mini split bar) align at the same Y across
                cards in the grid regardless of how long each question is. */}
            <p className="text-[var(--text)] text-[14.5px] font-semibold leading-[1.4] -tracking-[0.003em] mb-3 [text-wrap:pretty] line-clamp-4 min-h-[5.6em]">
              {question}
            </p>

            {/* Options A / B */}
            <div className="grid grid-cols-2 gap-1.5 mb-2.5">
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 border border-[rgba(255,51,102,0.28)] rounded-full text-[var(--accent-a)] text-[11px] font-semibold min-w-0 bg-white/[0.012]">
                <span className="w-3.5 h-3.5 inline-flex items-center justify-center border border-current rounded-[3px] font-mono text-[8px] font-semibold opacity-65 flex-shrink-0">A</span>
                <span className="flex-1 min-w-0 truncate text-[var(--text)] font-medium">{optionA}</span>
                {hasSplit && aPct !== undefined && (
                  <span className="font-mono text-[10.5px] font-semibold tabular-nums flex-shrink-0">{aPct}%</span>
                )}
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 border border-[rgba(77,159,255,0.28)] rounded-full text-[var(--accent-b)] text-[11px] font-semibold min-w-0 bg-white/[0.012]">
                <span className="w-3.5 h-3.5 inline-flex items-center justify-center border border-current rounded-[3px] font-mono text-[8px] font-semibold opacity-65 flex-shrink-0">B</span>
                <span className="flex-1 min-w-0 truncate text-[var(--text)] font-medium">{optionB}</span>
                {hasSplit && bPct !== undefined && (
                  <span className="font-mono text-[10.5px] font-semibold tabular-nums flex-shrink-0">{bPct}%</span>
                )}
              </div>
            </div>

            {/* Mini split bar slot — fixed height so a card without enough
                votes (no bar) still aligns its footer with cards that have
                the bar. Renders the bar only when totalVotes >= 50. */}
            <div className="h-1">
              {hasSplit && aPct !== undefined && (
                <SplitBar a={aPct} b={bPct} size="sm" label={`${aPct}% / ${bPct}%`} />
              )}
            </div>
          </div>
        </div>
      </Link>

      {/* Footer — votes + today + share */}
      <div className="flex items-center gap-1.5 px-[18px] pb-3.5 font-mono text-[10.5px] text-[var(--muted)] tabular-nums">
        <span>{c.votes(totalVotes)}</span>
        {todayVotes !== undefined && todayVotes > 0 && (
          <>
            <span className="opacity-50">·</span>
            <span className="text-[var(--muted-2,#5e7299)]">{c.today(todayVotes)}</span>
          </>
        )}
        <div className="ml-auto">
          <DilemmaCardShareButton
            question={question}
            playHref={playHref}
            scenarioId={id}
            locale={locale}
          />
        </div>
      </div>
    </article>
  )
}
