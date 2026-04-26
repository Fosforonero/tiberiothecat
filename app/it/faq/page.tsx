import type { Metadata } from 'next'
import Link from 'next/link'

const BASE_URL = 'https://splitvote.io'

export const metadata: Metadata = {
  title: 'Domande Frequenti — Come funziona SplitVote | SplitVote',
  description: 'Domande frequenti su SplitVote: cos\'è un dilemma morale, come funziona il voto, la privacy dei tuoi dati e le funzionalità premium.',
  alternates: {
    canonical: `${BASE_URL}/it/faq`,
    languages: {
      'it-IT': `${BASE_URL}/it/faq`,
      'en': `${BASE_URL}/faq`,
      'x-default': `${BASE_URL}/faq`,
    },
  },
  openGraph: {
    title: 'FAQ — Come funziona SplitVote?',
    description: 'Tutto quello che devi sapere su SplitVote: votazioni, dilemmi, privacy e account.',
    url: `${BASE_URL}/it/faq`,
    siteName: 'SplitVote',
    locale: 'it_IT',
  },
}

const SECTIONS = [
  {
    title: 'Su SplitVote',
    emoji: '🌍',
    items: [
      {
        q: "Cos'è SplitVote?",
        a: "SplitVote è una piattaforma di voti globali in tempo reale costruita attorno a dilemmi morali impossibili. Ti presentiamo scelte binarie — A o B, senza via di mezzo — e ti mostriamo come si divide il resto del mondo. Ogni dilemma è pensato per essere scomodo: non esiste una risposta ovviamente giusta, solo una onesta.",
      },
      {
        q: "Perché esiste?",
        a: "La maggior parte dei sondaggi online chiede per chi voteresti o quale marca preferisci. Noi siamo più interessati a cosa ti dice l'istinto quando le poste in gioco sono reali: ruberesti medicinali per tuo figlio? Azioneresti la leva del tram? Confessaresti un crimine di 20 anni fa che nessuno conosce? Aggregare milioni di queste decisioni silenziose rivela qualcosa di più onesto di qualsiasi sondaggio di opinione.",
      },
      {
        q: "Chi c'è dietro SplitVote?",
        a: "SplitVote è un progetto indipendente. Non siamo affiliati ad alcun media, università o organizzazione politica. Utilizziamo i dati raccolti per scrivere report occasionali e per alimentare i grafici pubblici del sito — mai per vendere profili individuali.",
      },
    ],
  },
  {
    title: 'Votazione e risultati',
    emoji: '🗳️',
    items: [
      {
        q: 'Come funziona il voto?',
        a: "Scegli un dilemma, leggi la domanda, scegli A o B. È tutto. Non hai bisogno di un account per votare. I voti anonimi vengono memorizzati con un cookie del browser che ti impedisce di votare due volte sullo stesso dilemma. Gli utenti registrati possono cambiare idea entro 24 ore dal voto; dopo, la scelta è bloccata.",
      },
      {
        q: 'Le percentuali sono reali?',
        a: "Sì. Ogni percentuale che vedi è calcolata in tempo reale dai voti effettivi espressi su quel dilemma. Non falsifichiamo i numeri, non inseriamo voti sintetici, né pesiamo i risultati per favorire una narrativa. I nuovi dilemmi possono mostrare 50/50 semplicemente perché nessuno ha ancora votato — è la baseline onesta.",
      },
      {
        q: 'Da dove arrivano i nuovi dilemmi?',
        a: "Due fonti. Prima, una serie di classici selezionati a mano (problema del tram, scialuppa di salvataggio, espianto di organi, ecc.). Secondo, ogni mattina alle 06:00 UTC una pipeline automatica scansiona Google Trends e Reddit, distilla i temi del giorno e genera 3 nuovi dilemmi ispirati all'attualità — visibili nella sezione Tendenze. Tutti i dilemmi generati dall'IA sono contrassegnati con l'icona ✨.",
      },
      {
        q: 'Posso inviare un mio dilemma?',
        a: "Gli utenti Premium possono inviare dilemmi tramite /submit-poll. Le proposte vengono esaminate dal nostro team prima di andare live (24-48 ore). Rifiutiamo contenuti offensivi, riferimenti a persone reali e domande con una risposta ovviamente corretta.",
      },
    ],
  },
  {
    title: 'Account e profilo',
    emoji: '👤',
    items: [
      {
        q: 'Ho bisogno di un account?',
        a: "No. Il voto è anonimo e funziona senza registrazione. Un account sblocca la dashboard (la tua cronologia dei voti, badge, statistiche), la possibilità di cambiare il voto entro 24 ore e le funzionalità Premium.",
      },
      {
        q: 'Come mi registro?',
        a: "Vai su /login — accedi con Google in un clic oppure usa email + password. Non pubblicheremo mai nulla per tuo conto e non ti invieremo email di marketing.",
      },
      {
        q: 'Cosa sono i badge?',
        a: "Obiettivi che ottieni partecipando: Primo Voto, 10/50/100 Voti, Striscia di 7 Giorni, Anticonformista (voti con la minoranza), Globetrotter (copri più categorie), Early Adopter (iscritto prima del 2026). Alcune cornici cosmetiche (Oro, Neon, Cosmico) sono acquistabili; tutto il resto si ottiene giocando.",
      },
      {
        q: 'Posso eliminare il mio account?',
        a: "Sì. Scrivi a hello@splitvote.io dall'indirizzo con cui ti sei iscritto e cancelleremo il tuo profilo e tutta la cronologia dei voti collegata entro 7 giorni. I conteggi aggregati (le percentuali su ogni dilemma) non possono essere annullati perché non sono collegati alla tua identità.",
      },
    ],
  },
  {
    title: 'Privacy e dati',
    emoji: '🔒',
    items: [
      {
        q: 'Quali dati raccogliete?',
        a: "Per i votanti anonimi: un cookie per dilemma che dice \"hai già votato A\", e un IP hashato per la limitazione delle richieste (eliminato dopo 1 ora). Per gli utenti registrati: email, nome visualizzato opzionale e i tuoi voti — più informazioni demografiche opzionali (anno di nascita, paese, genere) che puoi fornire per statistiche più ricche. Nulla di personalmente identificabile appare mai nei grafici pubblici.",
      },
      {
        q: 'Vendete i miei dati?',
        a: "No. Possiamo pubblicare statistiche aggregate e anonimizzate (\"il 73% dei votatori under 30 ha scelto A\") per giornalismo o ricerca, ma mai record individuali. I clienti business vedono le stesse analisi aggregate — mai dati grezzi degli utenti.",
      },
      {
        q: 'Come funziona il banner dei cookie?',
        a: "Utilizziamo Google Consent Mode v2. Per impostazione predefinita, tutti i cookie analitici e pubblicitari sono negati — devi fare clic attivamente su \"Accetta\" per abilitarli. Anche quando negati, abbiamo ancora bisogno di un piccolo cookie funzionale per ricordare su quali dilemmi hai già votato.",
      },
    ],
  },
]

export default function ItFaqPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      {/* Hero */}
      <div className="text-center mb-12">
        <div className="inline-block bg-cyan-500/10 text-cyan-400 text-xs font-bold tracking-widest uppercase px-4 py-2 rounded-full mb-6 border border-cyan-500/20">
          Domande Frequenti
        </div>
        <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-4 leading-none">
          Come funziona{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-purple-400 to-blue-400">
            SplitVote
          </span>
          ?
        </h1>
        <p className="text-lg text-[var(--muted)] max-w-md mx-auto">
          La risposta breve: voti tu, vota il mondo, contiamo noi. La risposta lunga è qui sotto.
        </p>
      </div>

      {/* Sections */}
      <div className="space-y-12">
        {SECTIONS.map(section => (
          <section key={section.title}>
            <h2 className="text-xl font-black text-white mb-5 flex items-center gap-2">
              <span className="text-2xl">{section.emoji}</span>
              {section.title}
            </h2>
            <div className="space-y-3">
              {section.items.map((item, idx) => (
                <details
                  key={idx}
                  className="group rounded-2xl border border-[var(--border)] bg-[#0d0d1a]/60 hover:border-blue-500/30 transition-colors"
                >
                  <summary className="cursor-pointer list-none flex items-start justify-between gap-4 p-5">
                    <h3 className="text-sm sm:text-base font-bold text-white leading-snug">{item.q}</h3>
                    <span className="flex-shrink-0 text-[var(--muted)] group-hover:text-blue-400 transition-colors text-lg leading-none mt-0.5 group-open:rotate-45 transition-transform duration-150">
                      +
                    </span>
                  </summary>
                  <div className="px-5 pb-5 text-sm text-[var(--muted)] leading-relaxed">{item.a}</div>
                </details>
              ))}
            </div>
          </section>
        ))}
      </div>

      {/* CTA */}
      <div className="mt-16 rounded-2xl border border-blue-500/30 bg-blue-500/5 p-6 text-center">
        <p className="text-white font-bold text-lg mb-2">Ancora curioso?</p>
        <p className="text-[var(--muted)] text-sm mb-4">
          Il modo più semplice per capire SplitVote è votare su un dilemma.
        </p>
        <Link
          href="/it"
          className="inline-block px-6 py-3 rounded-xl bg-blue-500 hover:bg-blue-400 text-white font-bold text-sm transition-colors"
        >
          Esplora i dilemmi →
        </Link>
      </div>

      <p className="text-center text-xs text-[var(--muted)] mt-10 opacity-60">
        Domanda senza risposta? Scrivici a{' '}
        <a href="mailto:hello@splitvote.io" className="text-blue-400 hover:text-blue-300 underline underline-offset-2">
          hello@splitvote.io
        </a>
      </p>
    </div>
  )
}
