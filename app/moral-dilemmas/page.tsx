import type { Metadata } from 'next'
import Link from 'next/link'
import JsonLd from '@/components/JsonLd'

const BASE_URL = 'https://splitvote.io'

export const metadata: Metadata = {
  title: 'Moral Dilemmas – Difficult Choices That Test Your Values',
  description: 'Explore moral dilemmas that challenge your values, ethics and decision-making. Vote on SplitVote and see how the world responds.',
  alternates: {
    canonical: `${BASE_URL}/moral-dilemmas`,
    languages: {
      'en': `${BASE_URL}/moral-dilemmas`,
      'it-IT': `${BASE_URL}/it/dilemmi-morali`,
      'x-default': `${BASE_URL}/moral-dilemmas`,
    },
  },
  openGraph: {
    title: 'Moral Dilemmas – Difficult Choices That Test Your Values',
    description: 'Explore moral dilemmas that challenge your values, ethics and decision-making. Vote on SplitVote and see how the world responds.',
    url: `${BASE_URL}/moral-dilemmas`,
    siteName: 'SplitVote',
    locale: 'en_US',
  },
}

const DILEMMAS = [
  'Pull a lever to divert a runaway trolley — killing one to save five?',
  'Steal medicine to save your child\'s life?',
  'Sacrifice one innocent person to save five others?',
  'Tell a painful truth that could shatter someone\'s happiness forever?',
  'Report a close friend\'s serious crime, knowing it will ruin their life?',
  'Lie to protect someone you love from unbearable heartbreak?',
  'Accept money you know came from an unethical source?',
  'Break an unjust law to do the right thing?',
  'Donate your kidney to a stranger who would otherwise die?',
  'Push one person in front of a trolley to stop it and save five?',
  'Reveal a secret that would free an innocent person but destroy your family?',
  'Use a single lie to prevent a major injustice?',
  'Let five people die rather than violate one person\'s rights?',
  'Cover up a loved one\'s mistake that harmed others?',
  'End someone\'s suffering against their stated wishes if you believe it is the kindest act?',
  'Hack a system illegally to expose life-threatening corporate fraud?',
  'Trade your freedom for the safety of everyone you love?',
  'Betray your country to prevent a war that would kill thousands?',
  'Allow one person to suffer indefinitely to guarantee the happiness of millions?',
  'Sacrifice your future to repair harm done by someone else in your family?',
]

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  name: 'Moral Dilemmas',
  description: 'Difficult moral dilemma scenarios that challenge your values, ethics and decision-making.',
  numberOfItems: DILEMMAS.length,
  itemListElement: DILEMMAS.map((d, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    name: d,
  })),
}

export default function MoralDilemmasPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      <JsonLd data={jsonLd} />

      {/* Hero */}
      <div className="text-center mb-12">
        <div className="inline-block bg-red-500/10 text-red-400 text-xs font-bold tracking-widest uppercase px-4 py-2 rounded-full mb-6 border border-red-500/20">
          Ethics & Philosophy
        </div>
        <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-4 leading-none">
          Moral{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-purple-400 to-blue-400">
            Dilemmas
          </span>
        </h1>
        <p className="text-lg text-[var(--muted)] max-w-2xl mx-auto">
          Difficult choices that challenge your values, ethics and decision-making — with no perfect answer.
        </p>
      </div>

      {/* Intro */}
      <div className="space-y-4 text-[var(--muted)] leading-relaxed mb-10 text-sm sm:text-base">
        <p>
          Moral dilemmas challenge your beliefs, ethics, and decision-making. They force you to
          choose between two difficult options, often without a perfect answer.
        </p>
        <p>
          These scenarios are widely used in psychology, philosophy, and everyday life to
          understand how people think and act under pressure. From the classic trolley problem
          to real-world ethical conflicts, moral dilemmas reveal what we truly value when
          it costs us something.
        </p>
      </div>

      {/* Dilemmas list */}
      <section aria-labelledby="dilemmas-heading" className="mb-12">
        <h2
          id="dilemmas-heading"
          className="text-xl font-black text-white mb-6 flex items-center gap-2"
        >
          <span className="text-2xl">⚖️</span>
          20 Moral Dilemmas
        </h2>
        <ol className="space-y-3">
          {DILEMMAS.map((d, i) => (
            <li
              key={i}
              className="flex items-start gap-4 rounded-2xl border border-[var(--border)] bg-[#0d0d1a]/60 p-4 hover:border-red-500/20 transition-colors"
            >
              <span className="flex-shrink-0 w-7 h-7 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold flex items-center justify-center">
                {i + 1}
              </span>
              <span className="text-sm sm:text-base text-white leading-snug">{d}</span>
            </li>
          ))}
        </ol>
      </section>

      {/* Cross-links */}
      <div className="rounded-2xl border border-[var(--border)] bg-[#0d0d1a]/40 p-5 mb-12 space-y-2">
        <p className="text-xs text-[var(--muted)] uppercase tracking-widest font-bold mb-3">
          Explore more
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/would-you-rather-questions"
            className="text-sm text-blue-400 hover:text-blue-300 underline underline-offset-2 transition-colors"
          >
            Would You Rather Questions →
          </Link>
          <Link
            href="/it/dilemmi-morali"
            className="text-sm text-purple-400 hover:text-purple-300 underline underline-offset-2 transition-colors"
          >
            Versione italiana →
          </Link>
        </div>
      </div>

      {/* CTA */}
      <div className="rounded-2xl border border-red-500/30 bg-red-500/5 p-8 text-center">
        <p className="text-white font-black text-xl mb-2">
          On SplitVote, you can explore real moral dilemmas.
        </p>
        <p className="text-[var(--muted)] text-sm mb-6 max-w-md mx-auto">
          See how people around the world respond. Start voting now and discover how your
          choices compare with millions of others.
        </p>
        <Link
          href="/play/trolley"
          className="inline-block px-8 py-3 rounded-xl bg-gradient-to-r from-red-500 to-purple-600 hover:from-red-400 hover:to-purple-500 text-white font-bold text-sm transition-all shadow-lg"
        >
          Vote on the trolley problem →
        </Link>
      </div>

      <p className="text-center text-xs text-[var(--muted)] mt-10 opacity-60">
        No account required. Your vote is anonymous.
      </p>
    </div>
  )
}
