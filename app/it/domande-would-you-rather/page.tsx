import type { Metadata } from 'next'
import Link from 'next/link'
import JsonLd from '@/components/JsonLd'

const BASE_URL = 'https://splitvote.io'

export const metadata: Metadata = {
  title: 'Domande Would You Rather – Scelte divertenti, difficili e sorprendenti',
  description: 'Scopri le migliori domande would you rather. Vota su SplitVote e confronta le tue scelte con persone di tutto il mondo.',
  alternates: {
    canonical: `${BASE_URL}/it/domande-would-you-rather`,
    languages: {
      'it-IT': `${BASE_URL}/it/domande-would-you-rather`,
      'en': `${BASE_URL}/would-you-rather-questions`,
      'x-default': `${BASE_URL}/would-you-rather-questions`,
    },
  },
  openGraph: {
    title: 'Domande Would You Rather – Scelte divertenti, difficili e sorprendenti',
    description: 'Scopri le migliori domande would you rather. Vota su SplitVote e confronta le tue scelte con persone di tutto il mondo.',
    url: `${BASE_URL}/it/domande-would-you-rather`,
    siteName: 'SplitVote',
    locale: 'it_IT',
  },
}

const DOMANDE = [
  'Preferiresti essere ricco ma solo o povero con gli amici?',
  'Preferiresti dire sempre la verità o mentire sempre?',
  'Preferiresti sapere come morirai o quando morirai?',
  'Preferiresti perdere il telefono o il portafoglio?',
  'Preferiresti essere famoso o rispettato?',
  'Preferiresti vivere per sempre o morire domani?',
  'Preferiresti salvare una persona cara o cinque sconosciuti?',
  'Preferiresti avere soldi illimitati o tempo illimitato?',
  'Preferiresti essere temuto o amato?',
  'Preferiresti non sentire mai dolore o non sentire mai felicità?',
  'Preferiresti dimenticare il tuo passato o non riuscire mai ad andare avanti?',
  'Preferiresti vincere ogni discussione o non litigare mai più?',
  'Preferiresti essere invisibile o leggere la mente?',
  'Preferiresti vivere senza internet o senza amici?',
  'Preferiresti rischiare tutto o giocare sul sicuro per sempre?',
  'Preferiresti essere estremamente intelligente o estremamente attraente?',
  "Preferiresti essere solo nello spazio o perso nell'oceano?",
  'Preferiresti conoscere i segreti di tutti o avere i tuoi svelati?',
  'Preferiresti perdere la memoria o la tua identità?',
  'Preferiresti avere ragione o essere felice?',
]

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  name: 'Domande Would You Rather',
  description: 'Domande divertenti, difficili e sorprendenti per esplorare la tua personalità.',
  numberOfItems: DOMANDE.length,
  itemListElement: DOMANDE.map((d, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    name: d,
  })),
}

export default function DomandeWouldYouRatherPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      <JsonLd data={jsonLd} />

      {/* Hero */}
      <div className="text-center mb-12">
        <div className="inline-block bg-cyan-500/10 text-cyan-400 text-xs font-bold tracking-widest uppercase px-4 py-2 rounded-full mb-6 border border-cyan-500/20">
          Domande Interattive
        </div>
        <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-4 leading-none">
          Domande{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-purple-400 to-blue-400">
            Would You Rather
          </span>
        </h1>
        <p className="text-lg text-[var(--muted)] max-w-2xl mx-auto">
          Scelte divertenti, difficili e sorprendenti — vota e scopri come si divide il mondo.
        </p>
      </div>

      {/* Intro */}
      <div className="space-y-4 text-[var(--muted)] leading-relaxed mb-10 text-sm sm:text-base">
        <p>
          Le domande &quot;would you rather&quot; sono uno dei modi più coinvolgenti per esplorare la tua
          personalità e il tuo modo di prendere decisioni. Ogni scelta ti mette di fronte a due
          opzioni difficili, rivelando come reagisci sotto pressione.
        </p>
        <p>
          Su SplitVote puoi andare oltre: non solo leggere le domande, ma votare e confrontare
          le tue risposte con utenti di tutto il mondo. Ogni risultato è reale, ogni percentuale
          è in tempo reale.
        </p>
      </div>

      {/* Domande list */}
      <section aria-labelledby="domande-heading" className="mb-12">
        <h2
          id="domande-heading"
          className="text-xl font-black text-white mb-6 flex items-center gap-2"
        >
          <span className="text-2xl">🤔</span>
          20 Domande Would You Rather
        </h2>
        <ol className="space-y-3">
          {DOMANDE.map((d, i) => (
            <li
              key={i}
              className="flex items-start gap-4 rounded-2xl border border-[var(--border)] bg-[#0d0d1a]/60 p-4 hover:border-blue-500/30 transition-colors"
            >
              <span className="flex-shrink-0 w-7 h-7 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold flex items-center justify-center">
                {i + 1}
              </span>
              <span className="text-sm sm:text-base text-white leading-snug">{d}</span>
            </li>
          ))}
        </ol>
      </section>

      {/* Cross-links */}
      <div className="rounded-2xl border border-[var(--border)] bg-[#0d0d1a]/40 p-5 mb-12">
        <p className="text-xs text-[var(--muted)] uppercase tracking-widest font-bold mb-3">
          Esplora altro
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/it/dilemmi-morali"
            className="text-sm text-blue-400 hover:text-blue-300 underline underline-offset-2 transition-colors"
          >
            Dilemmi Morali →
          </Link>
          <Link
            href="/would-you-rather-questions"
            className="text-sm text-purple-400 hover:text-purple-300 underline underline-offset-2 transition-colors"
          >
            English version →
          </Link>
        </div>
      </div>

      {/* CTA */}
      <div className="rounded-2xl border border-blue-500/30 bg-blue-500/5 p-8 text-center">
        <p className="text-white font-black text-xl mb-2">
          Vuoi vedere cosa sceglierebbero gli altri?
        </p>
        <p className="text-[var(--muted)] text-sm mb-6 max-w-md mx-auto">
          Prova l&apos;esperienza interattiva di SplitVote e confronta le tue risposte con
          utenti di tutto il mondo.
        </p>
        <Link
          href="/it/play/trolley"
          className="inline-block px-8 py-3 rounded-xl bg-gradient-to-r from-red-500 to-purple-600 hover:from-red-400 hover:to-purple-500 text-white font-bold text-sm transition-all shadow-lg"
        >
          Inizia a votare →
        </Link>
      </div>

      <p className="text-center text-xs text-[var(--muted)] mt-10 opacity-60">
        Nessun account richiesto. Il tuo voto è anonimo.
      </p>
    </div>
  )
}
