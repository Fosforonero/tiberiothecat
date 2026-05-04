import type { Metadata } from 'next'
import Link from 'next/link'

const BASE_URL = 'https://splitvote.io'

export const metadata: Metadata = {
  title: 'Chi siamo — SplitVote | Voti globali sui dilemmi morali',
  description: 'SplitVote è una piattaforma indipendente per voti globali in tempo reale su dilemmi morali impossibili. Scopri la nostra missione e come contattarci.',
  alternates: {
    canonical: `${BASE_URL}/it/about`,
    languages: {
      'it-IT': `${BASE_URL}/it/about`,
      'en': `${BASE_URL}/about`,
      'x-default': `${BASE_URL}/about`,
    },
  },
  openGraph: {
    title: 'Chi siamo — SplitVote',
    description: 'Una piattaforma indipendente per voti globali in tempo reale sui dilemmi morali più difficili. Nessuna risposta giusta — solo una onesta.',
    url: `${BASE_URL}/it/about`,
    siteName: 'SplitVote',
    locale: 'it_IT',
  },
}

export default function ItAboutPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-16 text-[var(--text)]">
      <h1 className="text-3xl font-black mb-2">Chi siamo</h1>
      <p className="text-sm text-[var(--muted)] mb-10">
        Voti globali in tempo reale sui dilemmi morali più difficili.
      </p>

      <section className="space-y-8 text-sm leading-relaxed text-[var(--muted)]">

        <div>
          <h2 className="text-base font-bold text-white mb-2">Cos&apos;è SplitVote?</h2>
          <p>
            SplitVote è una piattaforma di voti globali in tempo reale costruita attorno a dilemmi
            morali impossibili. Ti presentiamo scelte binarie — A o B, senza via di mezzo — e ti
            mostriamo come si divide il resto del mondo. Ogni dilemma è pensato per essere scomodo:
            non esiste una risposta ovviamente giusta, solo una onesta.
          </p>
        </div>

        <div>
          <h2 className="text-base font-bold text-white mb-2">La nostra missione</h2>
          <p>
            La maggior parte dei sondaggi chiede per chi voteresti o quale prodotto preferisci.
            Noi siamo più interessati a cosa ti dice l&apos;istinto quando le poste in gioco sono
            reali — azioneresti la leva del tram? Confessaresti un crimine che nessuno conosce?
            Aggregare milioni di queste decisioni silenziose rivela qualcosa di più onesto di
            qualsiasi sondaggio d&apos;opinione.
          </p>
          <p className="mt-3">
            Pubblichiamo solo risultati aggregati. Nessun voto individuale viene mai reso pubblico.
            Non falsifichiamo i numeri né inseriamo voti sintetici.
          </p>
        </div>

        <div>
          <h2 className="text-base font-bold text-white mb-2">Contenuti e standard editoriali</h2>
          <p>
            I dilemmi provengono da due fonti: una selezione curata di scenari etici classici e una
            pipeline giornaliera che genera nuovi dilemmi ispirati all&apos;attualità. Tutti i contenuti
            generati dall&apos;intelligenza artificiale vengono revisionati e approvati da un editor umano
            prima della pubblicazione — nulla viene pubblicato automaticamente. Rifiutiamo contenuti
            offensivi, riferimenti a persone reali e domande con una risposta ovviamente corretta.
          </p>
        </div>

        <div>
          <h2 className="text-base font-bold text-white mb-2">Chi siamo</h2>
          <p>
            SplitVote è un progetto indipendente con base in Italia. Non siamo affiliati ad alcun
            media, università o organizzazione politica.
          </p>
        </div>

        <div>
          <h2 className="text-base font-bold text-white mb-2">Contatti</h2>
          <ul className="space-y-1.5">
            <li>
              Generale:{' '}
              <a href="mailto:hello@splitvote.io" className="text-blue-400 hover:underline">
                hello@splitvote.io
              </a>
            </li>
            <li>
              Privacy e diritti sui dati:{' '}
              <a href="mailto:privacy@splitvote.io" className="text-blue-400 hover:underline">
                privacy@splitvote.io
              </a>
            </li>
            <li>
              Business e partnership:{' '}
              <a href="mailto:business@splitvote.io" className="text-blue-400 hover:underline">
                business@splitvote.io
              </a>
            </li>
          </ul>
        </div>

        <div className="pt-4 border-t border-[var(--border)] flex flex-wrap gap-4 text-xs">
          <Link href="/it/privacy" className="text-blue-400 hover:underline">Informativa sulla Privacy</Link>
          <Link href="/it/terms" className="text-blue-400 hover:underline">Termini di Servizio</Link>
          <Link href="/it/faq" className="text-blue-400 hover:underline">FAQ</Link>
          <Link href="/it" className="text-blue-400 hover:underline">Esplora i dilemmi</Link>
        </div>

      </section>
    </div>
  )
}
