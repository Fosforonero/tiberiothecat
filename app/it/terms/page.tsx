import type { Metadata } from 'next'

const BASE_URL = 'https://splitvote.io'

export const metadata: Metadata = {
  title: 'Termini di Servizio | SplitVote',
  description: 'Termini di Servizio di SplitVote.io.',
  robots: { index: true, follow: true },
  alternates: {
    canonical: `${BASE_URL}/it/terms`,
    languages: {
      'it-IT': `${BASE_URL}/it/terms`,
      'en': `${BASE_URL}/terms`,
      'x-default': `${BASE_URL}/terms`,
    },
  },
}

export default function ItTermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-16 text-[var(--text)]">
      <h1 className="text-3xl font-black mb-2">Termini di Servizio</h1>
      <p className="text-sm text-[var(--muted)] mb-10">Ultimo aggiornamento: 25 aprile 2026</p>

      <section className="space-y-6 text-sm leading-relaxed text-[var(--muted)]">

        <div>
          <h2 className="text-base font-bold text-white mb-2">1. Accettazione dei termini</h2>
          <p>
            Accedendo o utilizzando SplitVote.io (&ldquo;il Sito&rdquo;) accetti i presenti Termini di
            Servizio. Se non sei d&apos;accordo, interrompi immediatamente l&apos;utilizzo del Sito.
          </p>
        </div>

        <div>
          <h2 className="text-base font-bold text-white mb-2">2. Utilizzo del servizio</h2>
          <p>Puoi utilizzare SplitVote.io per:</p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li>Votare su dilemmi morali anonimi.</li>
            <li>Visualizzare i risultati aggregati in tempo reale.</li>
            <li>Creare un account per salvare la cronologia dei voti e guadagnare badge.</li>
            <li>Inviare dilemmi (solo utenti Premium, previa revisione editoriale).</li>
          </ul>
        </div>

        <div>
          <h2 className="text-base font-bold text-white mb-2">3. Condotta vietata</h2>
          <p>Non è consentito:</p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li>Utilizzare bot, script o strumenti automatizzati per alterare i conteggi dei voti.</li>
            <li>Inviare contenuti offensivi, diffamatori, sessuali, o che riguardino persone reali identificabili.</li>
            <li>Tentare di violare la sicurezza del Sito o degli account altrui.</li>
            <li>Utilizzare il Sito per qualsiasi scopo illegale ai sensi della legge italiana o dell&apos;UE.</li>
          </ul>
        </div>

        <div>
          <h2 className="text-base font-bold text-white mb-2">4. Contenuti degli utenti</h2>
          <p>
            I dilemmi inviati dagli utenti Premium restano di proprietà dell&apos;utente. Concedendo
            l&apos;invio, ci concedi una licenza mondiale, non esclusiva, gratuita per visualizzare e
            distribuire il contenuto sul Sito. Ci riserviamo il diritto di rifiutare o rimuovere
            qualsiasi contenuto senza preavviso.
          </p>
        </div>

        <div>
          <h2 className="text-base font-bold text-white mb-2">5. Proprietà intellettuale</h2>
          <p>
            Il design del Sito, il codice, il marchio &ldquo;SplitVote&rdquo; e i contenuti originali sono
            di proprietà di Matteo Pizzi e protetti dal diritto d&apos;autore. Non puoi riprodurli senza
            previa autorizzazione scritta.
          </p>
        </div>

        <div>
          <h2 className="text-base font-bold text-white mb-2">6. Limitazione di responsabilità</h2>
          <p>
            Il Sito è fornito &ldquo;così com&apos;è&rdquo; senza garanzie di alcun tipo. Non siamo
            responsabili per eventuali danni diretti o indiretti derivanti dall&apos;utilizzo del Sito.
            I dilemmi morali sono puramente ipotetici e a scopo di intrattenimento e riflessione etica.
          </p>
        </div>

        <div>
          <h2 className="text-base font-bold text-white mb-2">7. Pagamenti e Premium</h2>
          <p>
            I pagamenti per le funzionalità Premium sono elaborati tramite Stripe. Non conserviamo
            i dati della tua carta. Puoi gestire o annullare il tuo abbonamento in qualsiasi momento
            dalla dashboard. I rimborsi sono valutati caso per caso entro 14 giorni dall&apos;acquisto.
          </p>
        </div>

        <div>
          <h2 className="text-base font-bold text-white mb-2">8. Legge applicabile</h2>
          <p>
            I presenti Termini sono regolati dalla legge italiana. Per qualsiasi controversia sarà
            competente il tribunale di Milano.
          </p>
        </div>

        <div>
          <h2 className="text-base font-bold text-white mb-2">9. Modifiche ai termini</h2>
          <p>
            Ci riserviamo il diritto di modificare i presenti Termini in qualsiasi momento. Le
            modifiche rilevanti saranno comunicate tramite il Sito. L&apos;uso continuato del Sito
            dopo la pubblicazione delle modifiche costituisce accettazione.
          </p>
        </div>

        <div>
          <h2 className="text-base font-bold text-white mb-2">10. Contatti</h2>
          <p>
            Per domande sui presenti Termini scrivi a{' '}
            <a href="mailto:hello@splitvote.io" className="text-blue-400 hover:underline">
              hello@splitvote.io
            </a>.
          </p>
        </div>

      </section>
    </div>
  )
}
