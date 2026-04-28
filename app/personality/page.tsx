import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import PersonalityClient from './PersonalityClient'

export const metadata: Metadata = {
  title: 'Your Moral Profile | SplitVote',
  description: 'Discover your SplitVote personality archetype based on your votes. Which moral sign are you — Guardian, Rebel, Oracle, Diplomat, Strategist, or Empath?',
  alternates: {
    canonical: 'https://splitvote.io/personality',
    languages: {
      'en': 'https://splitvote.io/personality',
      'it': 'https://splitvote.io/it/personality',
      'x-default': 'https://splitvote.io/personality',
    },
  },
  openGraph: {
    title: 'Your Moral Profile — SplitVote',
    description: 'Find out your moral archetype based on your dilemma votes.',
    url: 'https://splitvote.io/personality',
    siteName: 'SplitVote',
  },
}

export default function PersonalityPage() {
  const locale = cookies().get('lang-pref')?.value === 'it' ? 'it' as const : 'en' as const
  return <PersonalityClient locale={locale} />
}
