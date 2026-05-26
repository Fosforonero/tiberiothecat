import Link from 'next/link'
import SplitBar from '@/components/SplitBar'
import DailyResetCountdown from '@/components/DailyResetCountdown'
import { CATEGORY_LABELS_IT } from '@/lib/scenarios-it'
import type { CatalogItem } from '@/lib/catalog'

interface FeaturedItem {
  item:    CatalogItem
  votes:   number
  aPct:    number | undefined   // undefined when no real votes yet
  today?:  number
}

type SecondaryKind = 'divisive' | 'mostVoted'

interface Props {
  daily:         FeaturedItem | undefined
  secondary:     FeaturedItem | undefined
  secondaryKind: SecondaryKind
  locale:        'en' | 'it'
  playHrefBase:  string
  resultsHrefBase: string
}

const COPY = {
  en: {
    daily:        'DILEMMA OF THE DAY',
    divisive:     'MOST DIVISIVE THIS WEEK',
    mostVoted:    'MOST VOTED',
    resetsIn:     'Resets in',
    gap:          'gap',
    voteNow:      'VOTE NOW',
    seeResults:   'See results',
    votesToday:   (n: number) => `${formatN(n, 'en')} votes today`,
    votesTotal:   (n: number) => `${formatN(n, 'en')} ${n === 1 ? 'vote' : 'votes'}`,
    noVotesYet:   'No votes yet',
    beTheFirst:   'Be the first',
  },
  it: {
    daily:        'DILEMMA DEL GIORNO',
    divisive:     'IL PIÙ DIVISIVO DELLA SETTIMANA',
    mostVoted:    'IL PIÙ VOTATO',
    resetsIn:     'Si resetta in',
    gap:          'di scarto',
    voteNow:      'VOTA ORA',
    seeResults:   'Vedi risultati',
    votesToday:   (n: number) => `${formatN(n, 'it')} voti oggi`,
    votesTotal:   (n: number) => `${formatN(n, 'it')} ${n === 1 ? 'voto' : 'voti'}`,
    noVotesYet:   'Nessun voto ancora',
    beTheFirst:   'Sii il primo',
  },
}

function formatN(n: number, locale: 'en' | 'it') {
  return n.toLocaleString(locale === 'it' ? 'it-IT' : 'en-US')
}

interface FeaturedCardProps {
  featured:      FeaturedItem
  accent:        'yellow' | 'purple'
  label:         string
  locale:        'en' | 'it'
  variant:       'daily' | 'divisive' | 'mostVoted'
  playHref:      string
  resultsHref:   string
  c:             (typeof COPY)['en']
}

function FeaturedCard({
  featured, accent, label, locale, variant, playHref, resultsHref, c,
}: FeaturedCardProps) {
  const isIT = locale === 'it'
  const { item, votes, aPct, today } = featured
  const hasVotes = aPct !== undefined
  const aPctNum = aPct ?? 50
  const bPctNum = 100 - aPctNum
  const gap = hasVotes ? Math.abs(aPctNum - bPctNum) : 0
  const categoryLabel = isIT ? (CATEGORY_LABELS_IT[item.category] ?? item.category) : item.category

  const isYellow = accent === 'yellow'
  const wrapperClass = isYellow
    ? 'border-[rgba(255,215,0,0.28)] bg-gradient-to-b from-[rgba(255,215,0,0.05)] to-transparent shadow-[0_0_0_1px_rgba(255,215,0,0.06),0_8px_32px_rgba(255,215,0,0.10),0_0_64px_rgba(255,215,0,0.06)]'
    : 'border-[rgba(180,77,255,0.28)] bg-gradient-to-b from-[rgba(180,77,255,0.05)] to-transparent shadow-[0_0_0_1px_rgba(180,77,255,0.06),0_8px_32px_rgba(180,77,255,0.10),0_0_64px_rgba(180,77,255,0.06)]'

  const dotClass = isYellow
    ? 'bg-[var(--neon-yellow)] shadow-[0_0_10px_var(--neon-yellow)]'
    : 'bg-[var(--neon-purple)] shadow-[0_0_10px_var(--neon-purple)]'

  const labelTextClass = isYellow ? 'text-[var(--neon-yellow)]' : 'text-[var(--neon-purple)]'

  const ctaClass = isYellow
    ? 'bg-[var(--neon-yellow)] text-[#1a1300] shadow-[0_0_24px_rgba(255,215,0,0.35),inset_0_1px_0_rgba(255,255,255,0.4)]'
    : 'bg-[var(--neon-purple)] text-white shadow-[0_0_24px_rgba(180,77,255,0.35),inset_0_1px_0_rgba(255,255,255,0.25)]'

  const topHairline = isYellow
    ? 'bg-gradient-to-r from-transparent via-[rgba(255,215,0,0.7)] to-transparent'
    : 'bg-gradient-to-r from-transparent via-[rgba(180,77,255,0.7)] to-transparent'

  // Meta slot (right side of header): countdown for daily, gap for divisive,
  // total votes for mostVoted, "no votes yet" when empty.
  let metaNode: React.ReactNode
  if (variant === 'daily') {
    metaNode = <DailyResetCountdown prefix={c.resetsIn} />
  } else if (!hasVotes) {
    metaNode = <span className="text-[var(--muted-2,#5e7299)] font-medium">{c.noVotesYet}</span>
  } else if (variant === 'mostVoted') {
    metaNode = (
      <span className="text-[var(--muted)] font-medium">
        <b className={`${labelTextClass} font-semibold tabular-nums`}>{formatN(votes, locale)}</b>{' '}
        <span className="font-normal">{isIT ? 'voti' : 'votes'}</span>
      </span>
    )
  } else {
    metaNode = (
      <span className="text-[var(--muted)] font-medium">
        <b className={`${labelTextClass} font-semibold tabular-nums`}>{gap}pp</b>{' '}
        <span className="font-normal">{c.gap}</span>
      </span>
    )
  }

  return (
    <article className={`relative bg-[var(--surface)] border rounded-3xl overflow-hidden flex flex-col ${wrapperClass}`}>
      <div aria-hidden="true" className={`absolute top-0 left-0 right-0 h-px z-[1] ${topHairline}`} />

      <div className="flex justify-between items-center px-[22px] pt-4 pb-1.5 font-mono text-[10.5px] tracking-[0.18em] uppercase">
        <span className={`inline-flex items-center gap-2 ${labelTextClass} font-semibold`}>
          <span aria-hidden="true" className={`w-1.5 h-1.5 rounded-full animate-pulse motion-reduce:animate-none ${dotClass}`} />
          {label}
        </span>
        {metaNode}
      </div>

      <div className="px-[22px] pt-2 pb-[18px] flex-1">
        <div className="font-mono text-[10.5px] font-semibold tracking-[0.18em] uppercase text-[var(--muted)] flex items-center gap-2 flex-wrap mb-3.5">
          <span aria-hidden="true" className="text-[16px] font-sans tracking-normal">{item.emoji}</span>
          <span className="text-[var(--text)]">{categoryLabel}</span>
          {hasVotes && today !== undefined && today > 0 && (
            <>
              <span aria-hidden="true" className="text-[var(--muted-2,#5e7299)]">·</span>
              <span>{c.votesToday(today)}</span>
            </>
          )}
        </div>
        <h2 className="text-[clamp(20px,2.3vw,26px)] font-bold leading-[1.25] -tracking-[0.015em] [text-wrap:balance] mb-4 max-w-[580px] text-[var(--text)]">
          {item.question}
        </h2>
        <div className="grid grid-cols-2 gap-2.5 mb-3.5">
          <div className="flex items-center gap-2.5 px-4 py-3 border border-[rgba(255,51,102,0.32)] rounded-full bg-white/[0.015] text-[13px] font-semibold">
            <span className="w-[18px] h-[18px] inline-flex items-center justify-center border border-[var(--accent-a)] text-[var(--accent-a)] rounded font-mono text-[9px] font-semibold opacity-70 flex-shrink-0">A</span>
            <span className="flex-1 min-w-0 truncate text-[var(--text)]">{item.optionA}</span>
            {hasVotes && (
              <span className="font-mono text-[11px] font-semibold tabular-nums text-[var(--accent-a)] flex-shrink-0">{aPctNum}%</span>
            )}
          </div>
          <div className="flex items-center gap-2.5 px-4 py-3 border border-[rgba(77,159,255,0.32)] rounded-full bg-white/[0.015] text-[13px] font-semibold">
            <span className="w-[18px] h-[18px] inline-flex items-center justify-center border border-[var(--accent-b)] text-[var(--accent-b)] rounded font-mono text-[9px] font-semibold opacity-70 flex-shrink-0">B</span>
            <span className="flex-1 min-w-0 truncate text-[var(--text)]">{item.optionB}</span>
            {hasVotes && (
              <span className="font-mono text-[11px] font-semibold tabular-nums text-[var(--accent-b)] flex-shrink-0">{bPctNum}%</span>
            )}
          </div>
        </div>
        {hasVotes ? (
          <SplitBar a={aPctNum} b={bPctNum} size="lg" label={`${aPctNum}% / ${bPctNum}%`} />
        ) : (
          <div className="flex items-center justify-center gap-2 py-1.5 font-mono text-[10.5px] font-semibold tracking-[0.16em] uppercase">
            <span className="text-[var(--muted-2,#5e7299)]">{c.noVotesYet}</span>
            <span aria-hidden="true" className="text-[var(--muted-2,#5e7299)]">·</span>
            <Link href={playHref} className={`${labelTextClass} hover:opacity-80 transition-opacity motion-reduce:transition-none`}>
              {c.beTheFirst} →
            </Link>
          </div>
        )}
      </div>

      <div className="flex items-center gap-4 px-[22px] py-3.5 border-t border-[var(--border)]">
        <Link
          href={playHref}
          className={`px-[18px] py-[11px] border-0 rounded-[10px] text-[11.5px] font-extrabold tracking-[0.14em] uppercase transition-transform hover:-translate-y-px active:translate-y-px motion-reduce:transition-none ${ctaClass}`}
        >
          {c.voteNow}
        </Link>
        <Link
          href={resultsHref}
          className="ml-auto font-mono text-[10.5px] font-semibold text-[var(--muted)] tracking-[0.14em] uppercase hover:text-[var(--text)]"
        >
          {c.seeResults} →
        </Link>
      </div>
    </article>
  )
}

export default function CatalogFeaturedRow({
  daily, secondary, secondaryKind, locale, playHrefBase, resultsHrefBase,
}: Props) {
  const c = COPY[locale]
  if (!daily && !secondary) return null

  const secondaryLabel = secondaryKind === 'mostVoted' ? c.mostVoted : c.divisive

  return (
    <section
      aria-label={locale === 'it' ? 'In evidenza' : 'Featured'}
      className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-5 mb-8"
    >
      {daily && (
        <FeaturedCard
          featured={daily}
          accent="yellow"
          label={c.daily}
          locale={locale}
          variant="daily"
          playHref={`${playHrefBase}/${daily.item.id}`}
          resultsHref={`${resultsHrefBase}/${daily.item.id}`}
          c={c}
        />
      )}
      {secondary && (
        <FeaturedCard
          featured={secondary}
          accent="purple"
          label={secondaryLabel}
          locale={locale}
          variant={secondaryKind}
          playHref={`${playHrefBase}/${secondary.item.id}`}
          resultsHref={`${resultsHrefBase}/${secondary.item.id}`}
          c={c}
        />
      )}
    </section>
  )
}
