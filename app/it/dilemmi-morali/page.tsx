import type { Metadata } from 'next'
import Link from 'next/link'
import JsonLd from '@/components/JsonLd'

const BASE_URL = 'https://splitvote.io'

export const metadata: Metadata = {
  title: 'Dilemmi Morali – Scelte difficili che mettono alla prova i tuoi valori',
  description: 'Scopri dilemmi morali che mettono alla prova etica e decisioni. Vota su SplitVote e confrontati con il mondo.',
  alternates: {
    canonical: `${BASE_URL}/it/dilemmi-morali`,
    languages: {
      'it-IT': `${BASE_URL}/it/dilemmi-morali`,
      'en': `${BASE_URL}/moral-dilemmas`,
      'x-default': `${BASE_URL}/moral-dilemmas`,
    },
  },
  openGraph: {
    title: 'Dilemmi Morali – Scelte difficili che mettono alla prova i tuoi valori',
    description: 'Scopri dilemmi morali che mettono alla prova etica e decisioni. Vota su SplitVote e confrontati con il mondo.',
    url: `${BASE_URL}/it/dilemmi-morali`,
    siteName: 'SplitVote',
    locale: 'it_IT',
  },
}

const DILEMMI: { text: string; id?: string }[] = [
  { text: 'Azioneresti una leva per deviare un tram fuori controllo — uccidendo uno per salvarne cinque?', id: 'trolley' },
  { text: 'Ruberesti medicinali per salvare la vita di tuo figlio?', id: 'steal-medicine' },
  { text: 'Sacrificheresti una persona innocente per salvarne cinque?', id: 'organ-harvest' },
  { text: 'Diresti una verità dolorosa che potrebbe distruggere la felicità di qualcuno per sempre?', id: 'truth-friend' },
  { text: 'Denunceresti il crimine grave di un amico intimo, sapendo che lo rovinerebbe?', id: 'report-friend' },
  { text: 'Menteresti per proteggere qualcuno che ami da un dolore insopportabile?' },
  { text: 'Accetteresti dei soldi sapendo che provengono da una fonte non etica?' },
  { text: 'Violeresti una legge ingiusta per fare la cosa giusta?' },
  { text: 'Doneresti un rene a uno sconosciuto che altrimenti morirebbe?' },
  { text: 'Spingeresti una persona davanti a un tram per fermarlo e salvarne cinque?' },
  { text: 'Riveleresti un segreto che libererebbe un innocente ma distruggerebbe la tua famiglia?' },
  { text: 'Useresti una singola bugia per prevenire una grande ingiustizia?', id: 'deepfake-expose' },
  { text: 'Lasceresti morire cinque persone piuttosto che violare i diritti di una?' },
  { text: "Copriresti l'errore di una persona cara che ha danneggiato altri?", id: 'cover-accident' },
  { text: "Metteresti fine alle sofferenze di qualcuno contro la sua volontà dichiarata, se credi che sia l'atto più umano?", id: 'mercy-kill' },
  { text: 'Hackeresti illegalmente un sistema per smascherare una frode aziendale che mette a rischio vite umane?', id: 'whistleblower' },
  { text: 'Rinunceresti alla tua libertà per garantire la sicurezza di tutti quelli che ami?' },
  { text: 'Tradiresti il tuo Paese per prevenire una guerra che ucciderebbe migliaia di persone?' },
  { text: 'Permetteresti a una persona di soffrire indefinitamente per garantire la felicità di milioni?' },
  { text: 'Sacrificheresti il tuo futuro per riparare il danno causato da qualcuno della tua famiglia?' },
]

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  name: 'Dilemmi Morali',
  description: 'Scenari etici difficili che mettono alla prova i tuoi valori, la tua etica e il tuo modo di prendere decisioni.',
  numberOfItems: DILEMMI.length,
  itemListElement: DILEMMI.map((d, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    name: d.text,
    ...(d.id ? { url: `${BASE_URL}/it/play/${d.id}` } : {}),
  })),
}

export default function DilemmiMoraliPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      <JsonLd data={jsonLd} />

      {/* Breadcrumb */}
      <nav className="text-xs text-[var(--muted)] mb-8" aria-label="Percorso di navigazione">
        <Link href="/it" className="hover:text-white transition-colors">Tutti i dilemmi</Link>
        <span className="mx-2">›</span>
        <span className="text-white">Dilemmi morali</span>
      </nav>

      {/* Hero */}
      <div className="text-center mb-12">
        <div className="inline-block bg-red-500/10 text-red-400 text-xs font-bold tracking-widest uppercase px-4 py-2 rounded-full mb-6 border border-red-500/20">
          Etica e Filosofia
        </div>
        <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-4 leading-none">
          Dilemmi{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-purple-400 to-blue-400">
            Morali
          </span>
        </h1>
        <p className="text-lg text-[var(--muted)] max-w-2xl mx-auto">
          Scelte difficili che mettono alla prova i tuoi valori e la tua etica — spesso senza una risposta perfetta.
        </p>
      </div>

      {/* Intro */}
      <div className="space-y-4 text-[var(--muted)] leading-relaxed mb-10 text-sm sm:text-base">
        <p>
          I dilemmi morali mettono alla prova le tue convinzioni, la tua etica e il tuo modo di
          prendere decisioni. Ti costringono a scegliere tra due opzioni difficili, spesso senza
          una risposta perfetta.
        </p>
        <p>
          Sono utilizzati in psicologia, filosofia e nella vita quotidiana per capire come le
          persone pensano e agiscono sotto pressione. Dal classico problema del tram ai conflitti
          etici del mondo reale, i dilemmi morali rivelano cosa apprezziamo davvero quando
          ci costa qualcosa.
        </p>
      </div>

      {/* Dilemmi list */}
      <section aria-labelledby="dilemmi-heading" className="mb-12">
        <h2
          id="dilemmi-heading"
          className="text-xl font-black text-white mb-6 flex items-center gap-2"
        >
          <span className="text-2xl">⚖️</span>
          20 dilemmi morali
        </h2>
        <ol className="space-y-3">
          {DILEMMI.map((d, i) => (
            <li
              key={i}
              className="flex items-start gap-4 rounded-2xl border border-[var(--border)] bg-[#0d0d1a]/60 p-4 hover:border-red-500/20 transition-colors"
            >
              <span className="flex-shrink-0 w-7 h-7 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold flex items-center justify-center">
                {i + 1}
              </span>
              {d.id ? (
                <Link
                  href={`/it/play/${d.id}`}
                  className="text-sm sm:text-base text-white leading-snug hover:text-red-300 transition-colors"
                >
                  {d.text}
                </Link>
              ) : (
                <span className="text-sm sm:text-base text-white leading-snug">{d.text}</span>
              )}
            </li>
          ))}
        </ol>
      </section>

      {/* Play links */}
      <section aria-labelledby="play-heading" className="mb-12">
        <h2 id="play-heading" className="text-base font-bold text-white mb-4">
          Prova questi su SplitVote — vota e scopri come si divide il mondo
        </h2>
        <ul className="space-y-2">
          {[
            { href: '/it/play/trolley', label: 'Il Problema del Tram — azioneresti la leva o staresti fermo?' },
            { href: '/it/play/steal-medicine', label: 'Rubare le Medicine — lo faresti per salvare tuo figlio?' },
            { href: '/it/play/organ-harvest', label: 'Trapianto di Organi — sacrificheresti uno per salvarne cinque?' },
            { href: '/it/play/whistleblower', label: 'Segnalare un illecito — denunceresti o resteresti in silenzio?' },
            { href: '/it/play/report-friend', label: 'Denunciare un Amico — giustizia o lealtà?' },
          ].map(({ href, label }) => (
            <li key={href}>
              <Link
                href={href}
                className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[#0d0d1a]/60 px-4 py-3 text-sm text-[var(--muted)] hover:text-white hover:border-red-500/20 transition-colors"
              >
                <span className="text-red-400 font-bold flex-shrink-0">→</span>
                <span>{label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* Cross-links */}
      <div className="rounded-2xl border border-[var(--border)] bg-[#0d0d1a]/40 p-5 mb-12">
        <p className="text-xs text-[var(--muted)] uppercase tracking-widest font-bold mb-3">
          Esplora altro
        </p>
        <div className="flex flex-wrap gap-3">
          <Link href="/it/domande-would-you-rather" className="text-sm text-blue-400 hover:text-blue-300 underline underline-offset-2 transition-colors">
            Domande preferiresti →
          </Link>
          <Link href="/it/trending" className="text-sm text-blue-400 hover:text-blue-300 underline underline-offset-2 transition-colors">
            Dilemmi di Tendenza →
          </Link>
          <Link href="/it/personality" className="text-sm text-purple-400 hover:text-purple-300 underline underline-offset-2 transition-colors">
            Il Tuo Profilo Morale →
          </Link>
          <Link href="/moral-dilemmas" className="text-sm text-purple-400 hover:text-purple-300 underline underline-offset-2 transition-colors">
            English version →
          </Link>
        </div>
      </div>

      {/* CTA */}
      <div className="rounded-2xl border border-red-500/30 bg-red-500/5 p-8 text-center">
        <p className="text-white font-black text-xl mb-2">
          Su SplitVote puoi esplorare dilemmi reali.
        </p>
        <p className="text-[var(--muted)] text-sm mb-6 max-w-md mx-auto">
          Vedi come rispondono le persone in tutto il mondo. Inizia a votare e scopri come le
          tue scelte si confrontano con quelle degli altri.
        </p>
        <Link
          href="/it/play/trolley"
          className="inline-block px-8 py-3 rounded-xl bg-gradient-to-r from-red-500 to-purple-600 hover:from-red-400 hover:to-purple-500 text-white font-bold text-sm transition-all shadow-lg"
        >
          Vota sul problema del tram →
        </Link>
      </div>

      <p className="text-center text-xs text-[var(--muted)] mt-10 opacity-60">
        Nessun account richiesto. Il tuo voto è anonimo.
      </p>
    </div>
  )
}
