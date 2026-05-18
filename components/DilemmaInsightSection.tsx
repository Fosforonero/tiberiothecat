/**
 * components/DilemmaInsightSection.tsx
 *
 * Server-only section appended below the play/results main interaction.
 * Adds deterministic, scenario-specific SEO copy without touching any
 * client component or vote flow.
 *
 * Two modes:
 *   - `mode="play"`   → "Why this dilemma matters" + 2 discussion prompts
 *   - `mode="results"`→ "What the split says" + same prompts
 *
 * Caching contract: pure server component, no per-user data. Safe inside
 * a `revalidate = 60` route (results) because the inputs are scenario +
 * aggregate vote stats only.
 */

import Link from 'next/link'
import {
  getDilemmaSeoSummary,
  getDilemmaDiscussionPrompts,
  getResultsInsight,
  type InsightLocale,
  type InsightScenario,
  type InsightVoteStats,
} from '@/lib/dilemma-seo-insights'

const COPY: Record<InsightLocale, {
  playHeading: string
  resultsHeading: string
  promptsHeading: string
  exploreCategory: string
  seeResults: string
  votedYet: string
}> = {
  en: {
    playHeading:     'Why this dilemma matters',
    resultsHeading:  'What the split says',
    promptsHeading:  'Worth asking yourself',
    exploreCategory: 'More dilemmas in this category →',
    seeResults:      'See the live result split →',
    votedYet:        'No votes yet — be the first to cast yours.',
  },
  it: {
    playHeading:     'Perché questo dilemma conta',
    resultsHeading:  'Cosa racconta il risultato',
    promptsHeading:  'Domande da farti',
    exploreCategory: 'Altri dilemmi in questa categoria →',
    seeResults:      'Vedi il risultato in tempo reale →',
    votedYet:        'Nessun voto ancora — sii il primo.',
  },
}

interface Props {
  scenario: InsightScenario
  locale: InsightLocale
  mode: 'play' | 'results'
  /** Pass aggregate stats on results mode. Omit/empty on play mode. */
  voteStats?: InsightVoteStats
}

export default function DilemmaInsightSection({
  scenario, locale, mode, voteStats,
}: Props) {
  const t = COPY[locale]
  const localePath = locale === 'it' ? '/it' : ''
  const categoryHref = `${localePath}/category/${scenario.category}`

  const summary = mode === 'play'
    ? getDilemmaSeoSummary({ scenario, locale })
    : getResultsInsight({ scenario, locale, voteStats })

  const prompts = getDilemmaDiscussionPrompts({ scenario, locale })

  return (
    <section
      className="max-w-2xl mx-auto px-4 pb-12 mt-2"
      aria-label={mode === 'play' ? t.playHeading : t.resultsHeading}
    >
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)]/60 p-5 sm:p-6">
        <h2 className="text-sm font-black uppercase tracking-widest text-[var(--muted)] mb-3">
          {mode === 'play' ? t.playHeading : t.resultsHeading}
        </h2>
        <p className="text-sm sm:text-[15px] leading-relaxed text-white/90">
          {summary}
        </p>

        <p className="mt-5 text-[11px] font-bold uppercase tracking-widest text-[var(--muted)]">
          {t.promptsHeading}
        </p>
        <ul className="mt-2 space-y-1.5 text-sm text-white/80 list-disc pl-5">
          {prompts.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>

        <div className="mt-5 text-xs">
          <Link
            href={categoryHref}
            className="text-blue-400 hover:text-blue-300 font-semibold transition-colors"
          >
            {t.exploreCategory}
          </Link>
        </div>
      </div>
    </section>
  )
}
