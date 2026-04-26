import type { Metadata } from 'next'

const BASE_URL = 'https://splitvote.io'

export const metadata: Metadata = {
  title: 'Informativa sulla Privacy | SplitVote',
  description: 'Informativa sulla privacy di SplitVote.io — come raccogliamo, utilizziamo e proteggiamo i tuoi dati.',
  robots: { index: true, follow: true },
  alternates: {
    canonical: `${BASE_URL}/it/privacy`,
    languages: {
      'it-IT': `${BASE_URL}/it/privacy`,
      'en': `${BASE_URL}/privacy`,
      'x-default': `${BASE_URL}/privacy`,
    },
  },
}

export default function ItPrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-16 text-[var(--text)]">
      <h1 className="text-3xl font-black mb-2">Informativa sulla Privacy</h1>
      <p className="text-sm text-[var(--muted)] mb-10">Ultimo aggiornamento: 25 aprile 2026</p>

      <section className="space-y-6 text-sm leading-relaxed text-[var(--muted)]">

        <div>
          <h2 className="text-base font-bold text-white mb-2">1. Chi siamo</h2>
          <p>
            SplitVote.io (&ldquo;noi&rdquo;, &ldquo;ci&rdquo;, &ldquo;nostro&rdquo;) è una piattaforma online che presenta sondaggi anonimi
            su dilemmi morali e mostra i risultati aggregati in tempo reale. Il sito è gestito da
            Matteo Pizzi, con sede in Italia. Contatto:{' '}
            <a href="mailto:privacy@splitvote.io" className="text-blue-400 hover:underline">
              privacy@splitvote.io
            </a>
          </p>
        </div>

        <div>
          <h2 className="text-base font-bold text-white mb-2">2. Dati che raccogliamo</h2>
          <p className="mb-2"><strong className="text-white">Votanti anonimi:</strong></p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Un cookie di sessione per dilemma che registra la tua scelta (A o B) per prevenire voti duplicati.</li>
            <li>Un hash dell&apos;indirizzo IP per la limitazione delle richieste (cancellato dopo 1 ora).</li>
          </ul>
          <p className="mt-2 mb-2"><strong className="text-white">Utenti registrati (aggiuntivi rispetto ai precedenti):</strong></p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Indirizzo email e nome visualizzato (opzionale).</li>
            <li>Cronologia dei voti collegata al tuo account.</li>
            <li>Dati demografici opzionali: anno di nascita, paese, genere.</li>
          </ul>
        </div>

        <div>
          <h2 className="text-base font-bold text-white mb-2">3. Come utilizziamo i dati</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Per mostrare le percentuali aggregate in tempo reale su ogni dilemma.</li>
            <li>Per prevenire abusi e voti multipli sullo stesso dilemma.</li>
            <li>Per fornire funzionalità dell&apos;account (dashboard, badge, cronologia).</li>
            <li>Per pubblicare report statistici anonimi a scopo giornalistico o di ricerca.</li>
          </ul>
          <p className="mt-2">
            Non vendiamo mai dati individuali né li condividiamo con terze parti per scopi pubblicitari.
          </p>
        </div>

        <div>
          <h2 className="text-base font-bold text-white mb-2">4. Basi giuridiche (GDPR)</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong className="text-white">Legittimo interesse</strong> — limitazione delle richieste, prevenzione delle frodi.</li>
            <li><strong className="text-white">Esecuzione del contratto</strong> — fornitura dei servizi dell&apos;account.</li>
            <li><strong className="text-white">Consenso</strong> — cookie analitici e pubblicitari (tramite banner cookie).</li>
          </ul>
        </div>

        <div>
          <h2 className="text-base font-bold text-white mb-2">5. Cookie</h2>
          <p>
            Utilizziamo Google Consent Mode v2. Per impostazione predefinita, tutti i cookie analitici e
            pubblicitari sono negati fino a quando non clicchi su &ldquo;Accetta&rdquo; nel banner cookie.
            I cookie funzionali (per ricordare i voti già espressi) sono sempre attivi perché necessari
            al funzionamento del servizio.
          </p>
        </div>

        <div>
          <h2 className="text-base font-bold text-white mb-2">6. Dove sono conservati i dati</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong className="text-white">Profili e autenticazione:</strong> Supabase (Postgres con sede nell&apos;UE).</li>
            <li><strong className="text-white">Contatori dei voti:</strong> Upstash Redis (edge globale a bassa latenza).</li>
            <li><strong className="text-white">Hosting:</strong> Vercel (edge globale).</li>
          </ul>
        </div>

        <div>
          <h2 className="text-base font-bold text-white mb-2">7. Conservazione dei dati</h2>
          <p>
            Gli hash IP per la limitazione delle richieste vengono eliminati dopo 1 ora. I dati dell&apos;account
            vengono conservati fino alla cancellazione dell&apos;account. I conteggi aggregati dei voti sono
            conservati indefinitamente perché non sono collegati a nessun individuo.
          </p>
        </div>

        <div>
          <h2 className="text-base font-bold text-white mb-2">8. I tuoi diritti</h2>
          <p>
            Ai sensi del GDPR hai il diritto di accedere, rettificare, cancellare i tuoi dati personali,
            opporti al trattamento e richiedere la portabilità dei dati. Per esercitare questi diritti,
            scrivi a{' '}
            <a href="mailto:privacy@splitvote.io" className="text-blue-400 hover:underline">
              privacy@splitvote.io
            </a>.
            Per la cancellazione dell&apos;account, scrivi a{' '}
            <a href="mailto:hello@splitvote.io" className="text-blue-400 hover:underline">
              hello@splitvote.io
            </a>{' '}
            dall&apos;indirizzo con cui ti sei iscritto.
          </p>
        </div>

        <div>
          <h2 className="text-base font-bold text-white mb-2">9. Modifiche alla presente informativa</h2>
          <p>
            Aggiorneremo questa pagina in caso di modifiche rilevanti. La data dell&apos;ultimo aggiornamento
            è indicata in cima. L&apos;uso continuato del sito dopo la pubblicazione delle modifiche
            costituisce accettazione delle stesse.
          </p>
        </div>

      </section>
    </div>
  )
}
