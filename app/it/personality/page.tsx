import type { Metadata } from 'next'
import PersonalityClient from '@/app/personality/PersonalityClient'

const BASE_URL = 'https://splitvote.io'

export const metadata: Metadata = {
  title: 'Il Tuo Profilo Morale | SplitVote',
  description: 'Scopri il tuo archetipo di personalità SplitVote basato sui tuoi voti sui dilemmi morali. Sei un Guardiano, Ribelle, Oracolo, Diplomatico, Stratega o Empatico?',
  alternates: {
    canonical: `${BASE_URL}/it/personality`,
    languages: {
      'it-IT': `${BASE_URL}/it/personality`,
      'en': `${BASE_URL}/personality`,
      'x-default': `${BASE_URL}/personality`,
    },
  },
  openGraph: {
    title: 'Il Tuo Profilo Morale — SplitVote',
    description: 'Scopri il tuo archetipo morale in base ai tuoi voti sui dilemmi.',
    url: `${BASE_URL}/it/personality`,
    siteName: 'SplitVote',
    locale: 'it_IT',
  },
}

export default function ItPersonalityPage() {
  return <PersonalityClient locale="it" />
}
