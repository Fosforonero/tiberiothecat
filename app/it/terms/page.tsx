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
      <p className="text-sm text-[var(--muted)] mb-10">Ultimo aggiornamento: 28 aprile 2026</p>

      <section className="space-y-6 text-sm leading-relaxed text-[var(--muted)]">

        <div>
          <h2 className="text-base font-bold text-white mb-2">1. Accettazione dei termini</h2>
          <p>
            Accedendo o utilizzando SplitVote.io (&ldquo;il Sito&rdquo; o &ldquo;il Servizio&rdquo;) accetti i presenti Termini di
            Servizio. Se non sei d&apos;accordo, interrompi immediatamente l&apos;utilizzo del Sito.
          </p>
        </div>

        <div>
          <h2 className="text-base font-bold text-white mb-2">2. Descrizione del servizio</h2>
          <p>
            SplitVote.io è una piattaforma di voto anonima online che presenta dilemmi morali e mostra
            i risultati aggregati in tempo reale. Il Servizio è fornito esclusivamente a scopo di intrattenimento
            ed educativo. Nessun voto, risultato o contenuto del Servizio costituisce consulenza medica, legale,
            finanziaria o di altro tipo. I risultati dei voti non sono campioni scientificamente rappresentativi
            di alcuna popolazione.
          </p>
        </div>

        <div>
          <h2 className="text-base font-bold text-white mb-2">3. Requisiti di età</h2>
          <p>
            Per utilizzare il Servizio devi avere almeno 13 anni. Utilizzando il Servizio dichiari e
            garantisci di soddisfare questo requisito di età. Se hai meno di 18 anni, ti invitiamo a
            leggere questi Termini insieme a un genitore o tutore.
          </p>
        </div>

        <div>
          <h2 className="text-base font-bold text-white mb-2">4. Account e gamification</h2>
          <p>
            Puoi utilizzare il Servizio in modo anonimo senza creare un account. Se ti registri, ricevi
            un nome visualizzato pseudonimo (&ldquo;Splitvoter-XXXXXX&rdquo;) e accesso alle funzionalità
            di gamification: punti XP, streak, badge e missioni giornaliere. Sei responsabile della
            riservatezza del tuo account. Ci riserviamo il diritto di rimuovere o rinominare account
            che violano i presenti Termini.
          </p>
        </div>

        <div>
          <h2 className="text-base font-bold text-white mb-2">5. Condotta vietata</h2>
          <p>Non è consentito:</p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li>Utilizzare bot, script o strumenti automatizzati per alterare i conteggi dei voti.</li>
            <li>Inviare contenuti offensivi, diffamatori, sessualmente espliciti o che riguardino persone reali identificabili in modo lesivo.</li>
            <li>Tentare di violare le misure di sicurezza o i limiti di frequenza del Sito.</li>
            <li>Effettuare scraping aggressivo o crawling che imponga un carico irragionevole sul Servizio.</li>
            <li>Utilizzare il Sito per qualsiasi scopo illegale ai sensi della legge italiana o dell&apos;UE.</li>
          </ul>
        </div>

        <div>
          <h2 className="text-base font-bold text-white mb-2">6. Contenuti degli utenti</h2>
          <p>
            Gli abbonati Premium possono inviare suggerimenti di dilemmi. Il contenuto inviato rimane di
            tua proprietà, ma con l&apos;invio ci concedi una licenza mondiale, non esclusiva, gratuita per
            visualizzare e distribuire il contenuto sul Sito. Tutti i dilemmi inviati dagli utenti sono
            soggetti a revisione editoriale prima della pubblicazione. Ci riserviamo il diritto di
            rifiutare, modificare o rimuovere qualsiasi contenuto senza preavviso.
          </p>
        </div>

        <div>
          <h2 className="text-base font-bold text-white mb-2">7. Contenuti generati dall&apos;AI</h2>
          <p>
            Alcuni dilemmi sul Servizio sono generati da sistemi AI (Anthropic Claude o modelli tramite
            OpenRouter). Tutti i contenuti generati dall&apos;AI vengono esaminati e approvati da un
            amministratore umano prima di diventare visibili al pubblico. Non garantiamo che i contenuti
            generati dall&apos;AI siano accurati, completi o privi di pregiudizi.
          </p>
        </div>

        <div>
          <h2 className="text-base font-bold text-white mb-2">8. Abbonamento Premium e pagamenti</h2>
          <p className="mb-2">SplitVote.io offre funzionalità a pagamento opzionali:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong className="text-white">Abbonamento Premium</strong> — rimuove gli annunci e sblocca cambi di nome illimitati. Fatturato tramite Stripe su base ricorrente.</li>
            <li><strong className="text-white">Cambio nome una tantum</strong> — gli utenti gratuiti ricevono un cambio nome gratuito; quelli aggiuntivi richiedono un pagamento una tantum elaborato da Stripe.</li>
          </ul>
          <p className="mt-2">
            Tutti i pagamenti sono elaborati da Stripe. Non conserviamo i dati della carta di pagamento.
            Puoi gestire o annullare il tuo abbonamento Premium in qualsiasi momento tramite il portale
            clienti accessibile dalla dashboard del profilo. La cancellazione ha effetto alla fine del
            periodo di fatturazione corrente. I rimborsi sono valutati caso per caso; contatta{' '}
            <a href="mailto:support@splitvote.io" className="text-blue-400 hover:underline">
              support@splitvote.io
            </a>{' '}
            entro 14 giorni dall&apos;acquisto.
          </p>
          <p className="mt-2">
            Nulla nei presenti Termini limita i diritti dei consumatori che potresti avere ai sensi
            del diritto italiano o dell&apos;UE applicabile.
          </p>
        </div>

        <div>
          <h2 className="text-base font-bold text-white mb-2">9. Proprietà intellettuale</h2>
          <p>
            Il design del Sito, il codice, il marchio &ldquo;SplitVote&rdquo; e i contenuti originali sono
            di proprietà di Matteo Pizzi e protetti dal diritto d&apos;autore. Puoi condividere risultati
            e screenshot per uso personale non commerciale con attribuzione a SplitVote.io. Non puoi
            riprodurre il contenuto del Sito senza previa autorizzazione scritta.
          </p>
        </div>

        <div>
          <h2 className="text-base font-bold text-white mb-2">10. Pubblicità di terze parti</h2>
          <p>
            Il Servizio può mostrare annunci pubblicitari di Google AdSense. Non siamo responsabili del
            contenuto degli annunci di terze parti. Gli abbonati Premium non vedono annunci pubblicitari.
          </p>
        </div>

        <div>
          <h2 className="text-base font-bold text-white mb-2">11. Moderazione e risoluzione dell&apos;account</h2>
          <p>
            Ci riserviamo il diritto di sospendere o chiudere account, rimuovere contenuti o limitare
            l&apos;accesso al Servizio a nostra esclusiva discrezione, senza preavviso, se riteniamo che
            un utente abbia violato i presenti Termini o stia agendo in modo dannoso per il Servizio
            o per altri utenti.
          </p>
        </div>

        <div>
          <h2 className="text-base font-bold text-white mb-2">12. Limitazione di responsabilità</h2>
          <p>
            Il Servizio è fornito &ldquo;così com&apos;è&rdquo; senza garanzie di alcun tipo. Nella misura
            massima consentita dalla legge, non siamo responsabili per danni indiretti, incidentali,
            speciali o consequenziali derivanti dall&apos;utilizzo del Servizio. La nostra responsabilità
            totale non supererà €100 o l&apos;importo pagato nei 12 mesi precedenti la richiesta,
            se superiore. I dilemmi morali sono puramente ipotetici e a scopo di intrattenimento e
            riflessione etica.
          </p>
        </div>

        <div>
          <h2 className="text-base font-bold text-white mb-2">13. Privacy</h2>
          <p>
            L&apos;utilizzo del Servizio è regolato anche dalla nostra{' '}
            <a href="/it/privacy" className="text-blue-400 hover:underline">Informativa sulla Privacy</a>,
            che è incorporata nei presenti Termini per riferimento.
          </p>
        </div>

        <div>
          <h2 className="text-base font-bold text-white mb-2">14. Legge applicabile</h2>
          <p>
            I presenti Termini sono regolati dalla legge italiana. Per qualsiasi controversia sarà
            competente il tribunale di Milano. Nulla in questa clausola limita i diritti obbligatori
            di tutela dei consumatori che potresti avere ai sensi del diritto UE applicabile.
          </p>
        </div>

        <div>
          <h2 className="text-base font-bold text-white mb-2">15. Modifiche ai termini</h2>
          <p>
            Ci riserviamo il diritto di modificare i presenti Termini in qualsiasi momento. Le
            modifiche rilevanti saranno comunicate aggiornando la data &ldquo;Ultimo aggiornamento&rdquo;.
            L&apos;uso continuato del Sito dopo la pubblicazione delle modifiche costituisce accettazione.
          </p>
        </div>

        <div>
          <h2 className="text-base font-bold text-white mb-2">16. Contatti</h2>
          <p>
            Per domande sui presenti Termini scrivi a{' '}
            <a href="mailto:legal@splitvote.io" className="text-blue-400 hover:underline">
              legal@splitvote.io
            </a>.
          </p>
        </div>

      </section>
    </div>
  )
}
