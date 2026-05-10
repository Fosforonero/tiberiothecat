import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import Link from 'next/link'
import PersonalityClient from './PersonalityClient'
import { ARCHETYPES, MORAL_AXES } from '@/lib/personality'

const VALID_ARCHETYPE_IDS = new Set(ARCHETYPES.map(a => a.id))

interface Props {
  searchParams: { archetype?: string }
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const requested = (searchParams.archetype ?? '').toLowerCase()
  const isValidArchetype = VALID_ARCHETYPE_IDS.has(requested)
  const archetype = isValidArchetype ? ARCHETYPES.find(a => a.id === requested) : null

  // Dynamic title/description when an archetype is in the URL → richer share preview
  const title = archetype
    ? `${archetype.signEmoji} I'm a ${archetype.name} — SplitVote Moral Personality`
    : 'Your Moral Profile | SplitVote'
  const description = archetype
    ? `${archetype.tagline} — Discover your SplitVote moral archetype based on how you vote on real dilemmas.`
    : 'Discover your SplitVote personality archetype based on your votes. Which moral sign are you — Guardian, Rebel, Oracle, Diplomat, Strategist, or Empath?'

  // OG image: personalised when archetype is set, generic fallback otherwise
  const ogImage = `https://splitvote.io/api/personality-card?archetype=${isValidArchetype ? requested : 'diplomat'}&locale=en&format=og`
  const canonicalSuffix = isValidArchetype ? `?archetype=${requested}` : ''

  return {
    title,
    description,
    alternates: {
      canonical: `https://splitvote.io/personality${canonicalSuffix}`,
      languages: {
        'en': `https://splitvote.io/personality${canonicalSuffix}`,
        'it-IT': `https://splitvote.io/it/personality${canonicalSuffix}`,
        'x-default': `https://splitvote.io/personality${canonicalSuffix}`,
      },
    },
    openGraph: {
      title: archetype ? `${archetype.signEmoji} ${archetype.name} — SplitVote Sign` : 'Your Moral Profile — SplitVote',
      description: archetype ? `"${archetype.tagline}" — Find your own moral archetype on SplitVote.` : 'Find out your moral archetype based on your dilemma votes.',
      url: `https://splitvote.io/personality${canonicalSuffix}`,
      siteName: 'SplitVote',
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: archetype ? `${archetype.name} — SplitVote moral personality` : 'SplitVote moral personality',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: archetype ? `${archetype.signEmoji} I'm a ${archetype.name}` : 'Your Moral Profile — SplitVote',
      description: archetype ? `"${archetype.tagline}"` : 'Discover your moral archetype on SplitVote.',
      images: [ogImage],
    },
  }
}

export default function PersonalityPage() {
  const locale = cookies().get('lang-pref')?.value === 'it' ? 'it' as const : 'en' as const
  return (
    <>
      <div className="max-w-2xl mx-auto px-4 pt-16 pb-8 text-[var(--text)]">
        <h1 className="text-3xl sm:text-4xl font-black text-white mb-3">
          Your Moral Personality Profile
        </h1>
        <p className="text-[var(--muted)] text-sm mb-10 leading-relaxed">
          SplitVote maps your answers to moral dilemmas onto 5 ethical dimensions and matches
          you to one of 18 personality archetypes. Vote, sign in, and see which moral sign
          defines you.
        </p>

        <section className="mb-10">
          <h2 className="text-base font-bold text-white mb-4">How it works</h2>
          <ol className="space-y-3 text-sm text-[var(--muted)]">
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-400 text-xs font-bold flex items-center justify-center">1</span>
              <span>Vote on moral dilemmas — each answer shifts your score on one or more ethical axes.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-400 text-xs font-bold flex items-center justify-center">2</span>
              <span>Your scores are compared against 18 archetype profiles to find your closest match.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-400 text-xs font-bold flex items-center justify-center">3</span>
              <span>Sign in after 3 or more votes to unlock your full moral personality profile.</span>
            </li>
          </ol>
        </section>

        <section className="mb-10">
          <h2 className="text-base font-bold text-white mb-4">The 5 moral dimensions</h2>
          <ul className="space-y-2">
            {MORAL_AXES.map(axis => (
              <li key={axis.id} className="flex items-center gap-3 text-sm text-[var(--muted)] py-1">
                <span className="text-lg leading-none">{axis.emoji}</span>
                <span>
                  <strong className="text-white">{axis.name}</strong>
                  {' '}— {axis.leftPole} ↔ {axis.rightPole}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-5 mb-10">
          <p className="text-xs font-bold uppercase tracking-widest text-cyan-400 mb-3">
            Expert lens
          </p>
          <p className="text-sm text-[var(--muted)] leading-relaxed mb-4">
            Researchers studying moral psychology often map people&apos;s ethical reasoning along
            dimensions like harm-care, fairness, loyalty, authority, and individual vs. collective
            interest. SplitVote turns these tensions into short voting questions so you can explore
            where your intuitions fall.
          </p>
          <ul className="space-y-1.5 mb-3">
            <li>
              <a
                href="https://moralfoundations.org/"
                target="_blank"
                rel="noopener noreferrer"
                className="block py-1.5 text-xs text-blue-400 hover:text-blue-300 transition-colors"
              >
                Moral Foundations Theory
                <span className="text-[var(--muted)]"> — moralfoundations.org</span>
              </a>
            </li>
            <li>
              <a
                href="https://plato.stanford.edu/entries/experimental-moral/"
                target="_blank"
                rel="noopener noreferrer"
                className="block py-1.5 text-xs text-blue-400 hover:text-blue-300 transition-colors"
              >
                Experimental Moral Philosophy
                <span className="text-[var(--muted)]"> — Stanford Encyclopedia of Philosophy</span>
              </a>
            </li>
            <li>
              <a
                href="https://www.joshua-greene.net/research/moral-cognition"
                target="_blank"
                rel="noopener noreferrer"
                className="block py-1.5 text-xs text-blue-400 hover:text-blue-300 transition-colors"
              >
                Moral cognition research
                <span className="text-[var(--muted)]"> — Joshua Greene, Harvard</span>
              </a>
            </li>
          </ul>
          <p className="text-[10px] text-[var(--muted)]">
            SplitVote is for entertainment and aggregate insight, not a scientific test.
          </p>
        </div>

        <section className="mb-10">
          <h2 className="text-base font-bold text-white mb-4">18 moral archetypes</h2>
          <ul className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {ARCHETYPES.map(arch => (
              <li
                key={arch.id}
                className="flex flex-col items-center justify-center gap-1 rounded-xl border border-[var(--border)] bg-[var(--surface)] py-3 text-center"
              >
                <span className="text-xl leading-none">{arch.signEmoji}</span>
                <span className={`text-xs font-bold ${arch.color}`}>{arch.name}</span>
              </li>
            ))}
          </ul>
        </section>

        <div className="flex flex-wrap gap-3 mb-4">
          <Link
            href="/play/trolley"
            className="inline-block px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold text-sm transition-all"
          >
            Vote your first dilemma →
          </Link>
          <Link
            href="/trending"
            className="inline-block px-6 py-3 rounded-xl border border-[var(--border)] text-[var(--muted)] hover:text-white hover:border-white/30 text-sm font-bold transition-colors"
          >
            See trending dilemmas →
          </Link>
        </div>
        <p className="text-xs text-[var(--muted)] opacity-60">
          For entertainment only — not scientifically validated.
        </p>
      </div>

      <PersonalityClient locale={locale} />
    </>
  )
}
