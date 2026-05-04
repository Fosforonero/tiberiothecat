import type { Metadata } from 'next'
import Link from 'next/link'
import JsonLd from '@/components/JsonLd'

const BASE_URL = 'https://splitvote.io'

export const metadata: Metadata = {
  title: 'Would You Rather Questions – Fun, Hard & Thought-Provoking Choices',
  description: 'Explore fun, hard and thought-provoking would you rather questions. Vote on SplitVote and compare your choices with people around the world.',
  alternates: {
    canonical: `${BASE_URL}/would-you-rather-questions`,
    languages: {
      'en': `${BASE_URL}/would-you-rather-questions`,
      'it-IT': `${BASE_URL}/it/domande-would-you-rather`,
      'x-default': `${BASE_URL}/would-you-rather-questions`,
    },
  },
  openGraph: {
    title: 'Would You Rather Questions – Fun, Hard & Thought-Provoking Choices',
    description: 'Explore fun, hard and thought-provoking would you rather questions. Vote on SplitVote and compare your choices with people around the world.',
    url: `${BASE_URL}/would-you-rather-questions`,
    siteName: 'SplitVote',
    locale: 'en_US',
  },
}

const QUESTIONS = [
  'Would you rather be rich but alone or poor with friends?',
  'Would you rather always tell the truth or always lie?',
  'Would you rather know how you die or when you die?',
  'Would you rather lose your phone or your wallet?',
  'Would you rather be famous or respected?',
  'Would you rather live forever or die tomorrow?',
  'Would you rather save one loved one or five strangers?',
  'Would you rather have unlimited money or unlimited time?',
  'Would you rather be feared or loved?',
  'Would you rather never feel pain or never feel happiness?',
  'Would you rather forget your past or never move on?',
  'Would you rather win every argument or never argue again?',
  'Would you rather be invisible or read minds?',
  'Would you rather live without internet or without friends?',
  'Would you rather risk everything or play it safe forever?',
  'Would you rather be extremely intelligent or extremely attractive?',
  'Would you rather be alone in space or lost in the ocean?',
  "Would you rather know everyone's secrets or have yours exposed?",
  'Would you rather lose your memory or your identity?',
  'Would you rather be right or be happy?',
]

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  name: 'Would You Rather Questions',
  description: 'Fun, hard and thought-provoking would you rather questions to explore your personality.',
  numberOfItems: QUESTIONS.length,
  itemListElement: QUESTIONS.map((q, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    name: q,
  })),
}

export default function WouldYouRatherQuestionsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      <JsonLd data={jsonLd} />

      {/* Hero */}
      <div className="text-center mb-12">
        <div className="inline-block bg-cyan-500/10 text-cyan-400 text-xs font-bold tracking-widest uppercase px-4 py-2 rounded-full mb-6 border border-cyan-500/20">
          Interactive Questions
        </div>
        <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-4 leading-none">
          Would You Rather{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-purple-400 to-blue-400">
            Questions
          </span>
        </h1>
        <p className="text-lg text-[var(--muted)] max-w-2xl mx-auto">
          Fun, hard and thought-provoking choices — vote and see how the world is split.
        </p>
      </div>

      {/* Intro */}
      <div className="space-y-4 text-[var(--muted)] leading-relaxed mb-10 text-sm sm:text-base">
        <p>
          Would you rather questions are one of the most engaging ways to explore your personality
          and decision-making style. Each choice forces you to pick between two difficult options,
          revealing how you think under pressure.
        </p>
        <p>
          On SplitVote, you can go beyond just reading questions — you can vote and instantly
          compare your answers with people around the world. Every result is real, every
          percentage is live.
        </p>
      </div>

      {/* Questions list */}
      <section aria-labelledby="questions-heading" className="mb-12">
        <h2
          id="questions-heading"
          className="text-xl font-black text-white mb-6 flex items-center gap-2"
        >
          <span className="text-2xl">🤔</span>
          20 Would You Rather Questions
        </h2>
        <ol className="space-y-3">
          {QUESTIONS.map((q, i) => (
            <li
              key={i}
              className="flex items-start gap-4 rounded-2xl border border-[var(--border)] bg-[#0d0d1a]/60 p-4 hover:border-blue-500/30 transition-colors"
            >
              <span className="flex-shrink-0 w-7 h-7 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold flex items-center justify-center">
                {i + 1}
              </span>
              <span className="text-sm sm:text-base text-white leading-snug">{q}</span>
            </li>
          ))}
        </ol>
      </section>

      {/* Play links */}
      <section aria-labelledby="play-heading" className="mb-12">
        <h2 id="play-heading" className="text-base font-bold text-white mb-4">
          Try these on SplitVote — vote and see the world split
        </h2>
        <ul className="space-y-2">
          {[
            { href: '/play/rich-or-fair', label: 'Rich or Fair — would you rather be rich in an unequal world?' },
            { href: '/play/save-partner-vs-stranger', label: 'Save Partner vs Stranger — who do you choose?' },
            { href: '/play/forgive-cheater', label: 'Forgive a Cheater — would you give them another chance?' },
            { href: '/play/love-or-career', label: 'Love or Career — what matters more when you must choose?' },
            { href: '/play/privacy-terror', label: 'Privacy vs Terror — share your data to stop an attack?' },
          ].map(({ href, label }) => (
            <li key={href}>
              <Link
                href={href}
                className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[#0d0d1a]/60 px-4 py-3 text-sm text-[var(--muted)] hover:text-white hover:border-blue-500/20 transition-colors"
              >
                <span className="text-blue-400 font-bold flex-shrink-0">→</span>
                <span>{label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* Cross-links */}
      <div className="rounded-2xl border border-[var(--border)] bg-[#0d0d1a]/40 p-5 mb-12 space-y-2">
        <p className="text-xs text-[var(--muted)] uppercase tracking-widest font-bold mb-3">
          Explore more
        </p>
        <div className="flex flex-wrap gap-3">
          <Link href="/moral-dilemmas" className="text-sm text-blue-400 hover:text-blue-300 underline underline-offset-2 transition-colors">
            Moral Dilemmas →
          </Link>
          <Link href="/trending" className="text-sm text-blue-400 hover:text-blue-300 underline underline-offset-2 transition-colors">
            Trending Dilemmas →
          </Link>
          <Link href="/personality" className="text-sm text-purple-400 hover:text-purple-300 underline underline-offset-2 transition-colors">
            Your Moral Profile →
          </Link>
          <Link href="/it/domande-would-you-rather" className="text-sm text-purple-400 hover:text-purple-300 underline underline-offset-2 transition-colors">
            Versione italiana →
          </Link>
        </div>
      </div>

      {/* CTA */}
      <div className="rounded-2xl border border-blue-500/30 bg-blue-500/5 p-8 text-center">
        <p className="text-white font-black text-xl mb-2">
          Want to see what others would choose?
        </p>
        <p className="text-[var(--muted)] text-sm mb-6 max-w-md mx-auto">
          Try the interactive voting experience on SplitVote and compare your answers with
          users worldwide. Every vote counts.
        </p>
        <Link
          href="/play/trolley"
          className="inline-block px-8 py-3 rounded-xl bg-gradient-to-r from-red-500 to-purple-600 hover:from-red-400 hover:to-purple-500 text-white font-bold text-sm transition-all shadow-lg"
        >
          Start voting now →
        </Link>
      </div>

      <p className="text-center text-xs text-[var(--muted)] mt-10 opacity-60">
        No account required. Your vote is anonymous.
      </p>
    </div>
  )
}
