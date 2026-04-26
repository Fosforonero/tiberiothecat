import Link from 'next/link'
import { scenarios } from '@/lib/scenarios'
import { getDynamicScenariosByLocale } from '@/lib/dynamic-scenarios'
import JsonLd from '@/components/JsonLd'
import LangSwitcher from '@/components/LangSwitcher'
import type { Metadata } from 'next'

const BASE_URL = 'https://splitvote.io'

export const metadata: Metadata = {
  title: 'Dilemmi Morali — Vota e Confrontati con il Mondo | SplitVote',
  description:
    'Rispondi a dilemmi etici impossibili e scopri come vota il resto del mondo in tempo reale. Cosa faresti tu? Trolley problem, dilemmi di sopravvivenza, giustizia e molto altro.',
  alternates: {
    canonical: `${BASE_URL}/it`,
    languages: {
      'it-IT': `${BASE_URL}/it`,
      'x-default': BASE_URL,
    },
  },
  openGraph: {
    title: 'Dilemmi Morali — Vota e Confrontati con il Mondo',
    description:
      'Rispondi a dilemmi etici e vedi come si divide il mondo. Voti in tempo reale, statistiche globali.',
    url: `${BASE_URL}/it`,
    siteName: 'SplitVote',
    locale: 'it_IT',
    type: 'website',
  },
  keywords: [
    'dilemmi morali',
    'dilemma etico',
    'cosa faresti',
    'trolley problem italiano',
    'dilemmi impossibili',
    'voto online',
    'dilemmi filosofici',
    'sondaggi morali',
    'scelta difficile',
    'dilemma morale online',
  ],
}

export const revalidate = 3600

const FEATURED_CATEGORIES = [
  { slug: 'morality', label: 'Moralità', emoji: '⚖️', desc: 'Le scelte più difficili della vita' },
  { slug: 'survival', label: 'Sopravvivenza', emoji: '🆘', desc: 'Cosa faresti per sopravvivere?' },
  { slug: 'loyalty', label: 'Lealtà', emoji: '🤝', desc: 'Amici, famiglia, principi' },
  { slug: 'justice', label: 'Giustizia', emoji: '🏛️', desc: 'Legge vs coscienza' },
  { slug: 'freedom', label: 'Libertà', emoji: '🕊️', desc: 'Sicurezza contro privacy' },
  { slug: 'technology', label: 'Tecnologia', emoji: '🤖', desc: 'IA, futuro, etica digitale' },
]

const FEATURED_DILEMMAS = [
  'trolley',
  'organ-harvest',
  'lifeboat',
  'truth-friend',
  'self-driving-crash',
  'privacy-terror',
]

const IT_TRANSLATIONS: Record<string, { question: string; a: string; b: string }> = {
  trolley: {
    question: "Un tram fuori controllo sta per investire 5 persone. Puoi deviarlo verso un binario dove c'è 1 persona sola.",
    a: 'Devio il tram. Salvo 5 e sacrifico 1.',
    b: 'Non faccio nulla. Il destino decida.',
  },
  'organ-harvest': {
    question: "Sei un medico. Gli organi di un paziente sano potrebbero salvare 5 moribondi. Nessuno lo saprebbe mai.",
    a: 'Prelevi gli organi. 5 vite > 1.',
    b: 'Impossibile. Non si uccide un innocente.',
  },
  lifeboat: {
    question: "La scialuppa di salvataggio regge solo 8 persone, ma ce ne sono 10. Chi lasci affogare?",
    a: 'Scelgo i più forti. Massimizzare le chance.',
    b: 'Sorteggio casuale. Ogni vita vale uguale.',
  },
  'truth-friend': {
    question: "Il tuo migliore amico ti chiede se il suo partner lo tradisce. Tu sai che sì. Gli dici la verità?",
    a: 'Sì, merita la verità.',
    b: 'No, non sono affari miei.',
  },
  'self-driving-crash': {
    question: "La tua auto autonoma deve scegliere: investire te oppure 3 pedoni. Come la programmi?",
    a: 'Proteggi me. Ho scelto la macchina.',
    b: 'Proteggi i pedoni. Più vite salvate.',
  },
  'privacy-terror': {
    question: "Il governo vuole sorvegliare tutte le comunicazioni private per prevenire attacchi terroristici.",
    a: 'Accetto. La sicurezza viene prima.',
    b: 'Rifiuto. La privacy è un diritto.',
  },
}

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'Cos\'è un dilemma morale?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Un dilemma morale è una situazione ipotetica in cui non esiste una risposta chiaramente giusta o sbagliata. Entrambe le scelte implicano conseguenze significative, mettendo alla prova i tuoi valori etici e morali.',
      },
    },
    {
      '@type': 'Question',
      name: 'Come funziona SplitVote?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'SplitVote presenta dilemmi etici impossibili. Voti la tua risposta e subito dopo vedi come ha risposto il resto del mondo in tempo reale. Puoi confrontarti per categoria demografica, paese, età.',
      },
    },
    {
      '@type': 'Question',
      name: 'Cos\'è il Trolley Problem?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Il Trolley Problem (problema del tram) è un celebre dilemma etico: un tram fuori controllo sta per investire 5 persone. Puoi deviarlo su un binario secondario dove c\'è 1 sola persona. Tiri la leva o no? Non esiste una risposta giusta: è uno strumento per esplorare la morale.',
      },
    },
    {
      '@type': 'Question',
      name: 'I dilemmi morali hanno una risposta giusta?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'No. I dilemmi morali sono progettati per non avere una risposta universalmente corretta. Servono a esplorare differenti sistemi etici (utilitarismo, deontologia, etica della virtù) e a capire cosa davvero valorizza una persona o una società.',
      },
    },
  ],
}

const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: 'Dilemmi Morali Online — SplitVote',
  description: 'Rispondi a dilemmi etici e confronta la tua scelta con milioni di persone nel mondo.',
  url: `${BASE_URL}/it`,
  inLanguage: 'it-IT',
  isPartOf: { '@type': 'WebSite', name: 'SplitVote', url: BASE_URL },
}

export default async function ItPage() {
  const featured = FEATURED_DILEMMAS.map((id) => scenarios.find((s) => s.id === id)).filter(Boolean)

  // Dynamic IT dilemmas from Redis (generated by cron)
  let dynamicIT: Awaited<ReturnType<typeof getDynamicScenariosByLocale>> = []
  try {
    dynamicIT = await getDynamicScenariosByLocale('it')
  } catch { /* Redis unavailable — degrade gracefully */ }

  return (
    <>
      <JsonLd data={faqSchema} />
      <JsonLd data={websiteSchema} />

      <main className="min-h-screen bg-[var(--bg)] text-white">
        {/* Hero */}
        <section className="relative overflow-hidden py-20 px-4 text-center">
          <div className="absolute inset-0 bg-gradient-to-b from-blue-950/30 via-transparent to-transparent pointer-events-none" />
          <h1 className="relative text-4xl md:text-6xl font-black tracking-tight mb-4">
            <span className="text-white">Dilemmi</span>{' '}
            <span className="text-blue-400">Morali</span>{' '}
            <span className="text-white">Impossibili</span>
          </h1>
          <p className="relative text-lg md:text-xl text-gray-300 max-w-2xl mx-auto mb-8">
            Cosa faresti tu? Rispondi a dilemmi etici e scopri come vota il resto del mondo{' '}
            <strong className="text-white">in tempo reale</strong>.
          </p>
          <Link
            href="/"
            className="inline-block rounded-full bg-blue-600 hover:bg-blue-500 text-white font-bold px-8 py-3 text-lg transition-colors shadow-[0_0_20px_rgba(59,130,246,0.4)]"
          >
            Inizia a votare →
          </Link>
          <p className="mt-4 text-sm text-gray-500">Nessuna registrazione richiesta · Risultati istantanei</p>
          <LangSwitcher />
        </section>

        {/* Dilemmi in evidenza */}
        <section className="max-w-4xl mx-auto px-4 py-8">
          <h2 className="text-2xl font-bold mb-6 text-center">
            🔥 Dilemmi in Evidenza
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {featured.map((s) => {
              if (!s) return null
              const it = IT_TRANSLATIONS[s.id]
              return (
                <Link
                  key={s.id}
                  href={`/play/${s.id}`}
                  className="group rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 p-4 transition-all"
                >
                  <span className="text-3xl mb-3 block">{s.emoji}</span>
                  <p className="text-sm font-semibold text-white leading-snug mb-3 line-clamp-3">
                    {it?.question ?? s.question}
                  </p>
                  <div className="flex flex-col gap-1.5">
                    <span className="text-xs text-green-400 bg-green-400/10 rounded-full px-3 py-1 truncate">
                      A: {it?.a ?? s.optionA}
                    </span>
                    <span className="text-xs text-red-400 bg-red-400/10 rounded-full px-3 py-1 truncate">
                      B: {it?.b ?? s.optionB}
                    </span>
                  </div>
                  <span className="mt-3 block text-xs text-blue-400 group-hover:text-blue-300">
                    Vota ora →
                  </span>
                </Link>
              )
            })}
          </div>
        </section>

        {/* Dilemmi di Tendenza (AI-generated, locale='it') */}
        {dynamicIT.length > 0 && (
          <section className="max-w-4xl mx-auto px-4 py-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">✨ Dilemmi di Tendenza</h2>
              <Link
                href="/it/trending"
                className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
              >
                Vedi tutti →
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {dynamicIT.slice(0, 6).map((s) => (
                <Link
                  key={s.id}
                  href={`/it/play/${s.id}`}
                  className="group rounded-2xl border border-purple-500/20 bg-[var(--surface)] hover:bg-[#1a1025] hover:border-purple-500/40 p-4 transition-all"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">{s.emoji}</span>
                    <span className="text-[10px] bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-full px-2 py-0.5 font-bold uppercase tracking-wide">
                      ✨ trending
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-white leading-snug mb-3 line-clamp-3">
                    {s.question}
                  </p>
                  <div className="flex flex-col gap-1.5">
                    <span className="text-xs text-green-400 bg-green-400/10 rounded-full px-3 py-1 truncate">
                      A: {s.optionA}
                    </span>
                    <span className="text-xs text-red-400 bg-red-400/10 rounded-full px-3 py-1 truncate">
                      B: {s.optionB}
                    </span>
                  </div>
                  <span className="mt-3 block text-xs text-purple-400 group-hover:text-purple-300">
                    Vota ora →
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Categorie */}
        <section className="max-w-4xl mx-auto px-4 py-8">
          <h2 className="text-2xl font-bold mb-6 text-center">📂 Esplora per Categoria</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {FEATURED_CATEGORIES.map((cat) => (
              <Link
                key={cat.slug}
                href={`/category/${cat.slug}`}
                className="group rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 p-4 transition-all text-center"
              >
                <span className="text-3xl block mb-2">{cat.emoji}</span>
                <span className="font-semibold text-white block">{cat.label}</span>
                <span className="text-xs text-gray-400 group-hover:text-gray-300">{cat.desc}</span>
              </Link>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section className="max-w-3xl mx-auto px-4 py-12">
          <h2 className="text-2xl font-bold mb-8 text-center">❓ Domande Frequenti</h2>
          <div className="space-y-4">
            {[
              {
                q: "Cos'è un dilemma morale?",
                a: "Un dilemma morale è una situazione ipotetica dove non esiste una risposta chiaramente giusta. Entrambe le scelte hanno conseguenze significative, mettendo alla prova i tuoi valori etici.",
              },
              {
                q: "Cos'è il Trolley Problem?",
                a: "Il Trolley Problem (problema del tram) è il dilemma etico più famoso al mondo: un tram fuori controllo sta per investire 5 persone. Puoi deviarlo su un binario dove c'è 1 sola persona. Tiri la leva? Questo esperimento mentale esplora la differenza tra morale utilitaristica (5 > 1) e deontologica (non si usa una persona come mezzo).",
              },
              {
                q: "I dilemmi hanno una risposta giusta?",
                a: "No. Sono strumenti filosofici per esplorare sistemi etici diversi: l'utilitarismo (massimizza il bene comune), la deontologia (regole assolute), l'etica della virtù (cosa farebbe una persona virtuosa?). Non c'è risposta universale — ma è interessante vedere come si divide il mondo.",
              },
              {
                q: "Come funziona SplitVote?",
                a: "Voti la tua risposta al dilemma, poi vedi subito la distribuzione globale in tempo reale. Puoi creare un account per salvare le tue risposte, guadagnare badge e sfidare gli amici.",
              },
            ].map(({ q, a }) => (
              <details
                key={q}
                className="group rounded-xl border border-white/10 bg-white/5 p-4 cursor-pointer"
              >
                <summary className="font-semibold text-white list-none flex items-center justify-between">
                  {q}
                  <span className="text-gray-400 group-open:rotate-180 transition-transform">▾</span>
                </summary>
                <p className="mt-3 text-sm text-gray-300 leading-relaxed">{a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* CTA finale */}
        <section className="text-center py-12 px-4">
          <h2 className="text-2xl font-bold mb-3">Pronto a scegliere?</h2>
          <p className="text-gray-400 mb-6">Unisciti a migliaia di persone che votano ogni giorno.</p>
          <Link
            href="/"
            className="inline-block rounded-full bg-blue-600 hover:bg-blue-500 text-white font-bold px-8 py-3 transition-colors"
          >
            Vedi tutti i dilemmi →
          </Link>
        </section>
      </main>
    </>
  )
}
