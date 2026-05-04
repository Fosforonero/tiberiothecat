import type { Metadata } from 'next'
import Link from 'next/link'
import PersonalityClient from '@/app/personality/PersonalityClient'
import { ARCHETYPES, MORAL_AXES } from '@/lib/personality'

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
  return (
    <>
      <div className="max-w-2xl mx-auto px-4 pt-16 pb-8 text-[var(--text)]">
        <h1 className="text-3xl sm:text-4xl font-black text-white mb-3">
          Il Tuo Profilo di Personalità Morale
        </h1>
        <p className="text-[var(--muted)] text-sm mb-10 leading-relaxed">
          SplitVote analizza le tue risposte ai dilemmi morali su 5 dimensioni etiche e ti
          abbina a uno dei 18 archetipi di personalità. Vota, accedi e scopri quale segno
          morale ti rappresenta.
        </p>

        <section className="mb-10">
          <h2 className="text-base font-bold text-white mb-4">Come funziona</h2>
          <ol className="space-y-3 text-sm text-[var(--muted)]">
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-400 text-xs font-bold flex items-center justify-center">1</span>
              <span>Vota sui dilemmi morali — ogni risposta modifica il tuo punteggio su uno o più assi etici.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-400 text-xs font-bold flex items-center justify-center">2</span>
              <span>I tuoi punteggi vengono confrontati con 18 profili di archetipo per trovare la corrispondenza più vicina.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-400 text-xs font-bold flex items-center justify-center">3</span>
              <span>Accedi dopo 3 o più voti per sbloccare il tuo profilo di personalità morale completo.</span>
            </li>
          </ol>
        </section>

        <section className="mb-10">
          <h2 className="text-base font-bold text-white mb-4">Le 5 dimensioni morali</h2>
          <ul className="space-y-2">
            {MORAL_AXES.map(axis => (
              <li key={axis.id} className="flex items-center gap-3 text-sm text-[var(--muted)] py-1">
                <span className="text-lg leading-none">{axis.emoji}</span>
                <span>
                  <strong className="text-white">{axis.nameIt}</strong>
                  {' '}— {axis.leftPoleIt} ↔ {axis.rightPoleIt}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className="mb-10">
          <h2 className="text-base font-bold text-white mb-4">18 archetipi morali</h2>
          <ul className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {ARCHETYPES.map(arch => (
              <li
                key={arch.id}
                className="flex flex-col items-center justify-center gap-1 rounded-xl border border-[var(--border)] bg-[var(--surface)] py-3 text-center"
              >
                <span className="text-xl leading-none">{arch.signEmoji}</span>
                <span className={`text-xs font-bold ${arch.color}`}>{arch.nameIt}</span>
              </li>
            ))}
          </ul>
        </section>

        <div className="flex flex-wrap gap-3 mb-4">
          <Link
            href="/it/play/trolley"
            className="inline-block px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold text-sm transition-all"
          >
            Vota il tuo primo dilemma →
          </Link>
          <Link
            href="/it/trending"
            className="inline-block px-6 py-3 rounded-xl border border-[var(--border)] text-[var(--muted)] hover:text-white hover:border-white/30 text-sm font-bold transition-colors"
          >
            Dilemmi di tendenza →
          </Link>
        </div>
        <p className="text-xs text-[var(--muted)] opacity-60">
          Solo a scopo di intrattenimento — non validato scientificamente.
        </p>
      </div>

      <PersonalityClient locale="it" />
    </>
  )
}
