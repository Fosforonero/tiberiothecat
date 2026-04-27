import Link from 'next/link'
import { scenarios } from '@/lib/scenarios'
import { getDynamicScenariosByLocale } from '@/lib/dynamic-scenarios'
import type { DynamicScenario } from '@/lib/dynamic-scenarios'
import { getVotesBatch } from '@/lib/redis'
import DilemmaCard from '@/components/DilemmaCard'
import DailyDilemma from '@/components/DailyDilemma'
import JsonLd from '@/components/JsonLd'
import LangSwitcher from '@/components/LangSwitcher'
import { translateScenarioToItalian } from '@/lib/scenarios-it'
import type { Metadata } from 'next'
import type { Scenario } from '@/lib/scenarios'

function getDailyScenario(all: Scenario[]): Scenario {
  if (all.length === 0) return all[0] ?? scenarios[0]
  const daysSinceEpoch = Math.floor(Date.now() / 86_400_000)
  return all[daysSinceEpoch % all.length]
}

const BASE_URL = 'https://splitvote.io'

export const metadata: Metadata = {
  title: 'Dilemmi Morali — Vota e Confrontati con il Mondo',
  description:
    'Rispondi a dilemmi etici impossibili e scopri come vota il resto del mondo in tempo reale. Cosa faresti tu? Trolley problem, dilemmi di sopravvivenza, giustizia e molto altro.',
  alternates: {
    canonical: `${BASE_URL}/it`,
    languages: {
      'it-IT': `${BASE_URL}/it`,
      'en': BASE_URL,
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

const FEATURED_DILEMMA_IDS = [
  'trolley',
  'organ-harvest',
  'lifeboat',
  'truth-friend',
  'self-driving-crash',
  'privacy-terror',
]

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
  // Featured static dilemmas (with Italian text overrides)
  const featuredBase = FEATURED_DILEMMA_IDS
    .map((id) => scenarios.find((s) => s.id === id))
    .filter((s): s is Scenario => Boolean(s))

  const featured = featuredBase.map(translateScenarioToItalian)

  // Dynamic IT dilemmas from Redis
  let dynamicIT: DynamicScenario[] = []
  try {
    dynamicIT = await getDynamicScenariosByLocale('it')
  } catch { /* Redis unavailable */ }

  // Daily dilemma for IT — prefers dynamic IT, falls back to translated static pool
  const allITPool: Scenario[] = [
    ...dynamicIT,
    ...scenarios.map(translateScenarioToItalian),
  ]
  const dailyIT = getDailyScenario(allITPool)

  // Batch vote counts for featured + dynamic + daily
  let voteMap = new Map<string, number>()
  try {
    const ids = new Set([
      dailyIT.id,
      ...featured.map((s) => s.id),
      ...dynamicIT.slice(0, 12).map((s) => s.id),
    ])
    voteMap = await getVotesBatch([...ids])
  } catch { /* Non-blocking */ }

  const trendingIT = [...dynamicIT]
    .sort((a, b) => (b.scores?.finalScore ?? 0) - (a.scores?.finalScore ?? 0))
    .slice(0, 6)

  const newlyGeneratedIT = [...dynamicIT]
    .sort((a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime())
    .slice(0, 6)

  return (
    <>
      <JsonLd data={faqSchema} />
      <JsonLd data={websiteSchema} />

      <div className="max-w-4xl mx-auto px-4 py-12 sm:py-16">

        {/* Hero */}
        <div className="text-center mb-10 sm:mb-14">
          <div className="inline-flex items-center gap-2 bg-blue-500/10 text-blue-400 text-xs font-bold tracking-widest uppercase px-4 py-2 rounded-full mb-6 border border-blue-500/20 neon-glow-blue">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 pulse-glow" />
            Voti in tempo reale
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-black tracking-tight mb-5 sm:mb-6 leading-none">
            Cosa sceglierebbe
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-purple-400 to-blue-400">
              il mondo?
            </span>
          </h1>
          <p className="text-base sm:text-xl text-[var(--muted)] max-w-lg mx-auto leading-relaxed">
            Dilemmi morali impossibili. Milioni di voti reali. Nessuna risposta giusta — solo quella onesta.
          </p>
          <div className="mt-6">
            <LangSwitcher />
          </div>
        </div>

        {/* ── Dilemma del Giorno ── */}
        <DailyDilemma
          scenario={dailyIT}
          totalVotes={voteMap.get(dailyIT.id) ?? 0}
          locale="it"
        />

        {/* ── Dilemmi in Evidenza ── */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl sm:text-2xl font-black tracking-tight flex items-center gap-2">
              <span className="text-red-400">🔥</span> Dilemmi in Evidenza
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {featured.map((s) => (
              <DilemmaCard
                key={s.id}
                scenario={s}
                playHref={`/it/play/${s.id}`}
                totalVotes={voteMap.get(s.id)}
                locale="it"
              />
            ))}
          </div>
        </section>

        {/* ── Trending IT (AI-generated, ranked by finalScore) ── */}
        {trendingIT.length > 0 && (
          <section className="mb-12">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl sm:text-2xl font-black tracking-tight flex items-center gap-2">
                <span className="text-orange-400">🔥</span> Di Tendenza
              </h2>
              <Link href="/it/trending" className="text-sm text-[var(--muted)] hover:text-white transition-colors">
                Vedi tutti →
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {trendingIT.map((s) => (
                <DilemmaCard
                  key={s.id}
                  scenario={s}
                  playHref={`/it/play/${s.id}`}
                  totalVotes={voteMap.get(s.id)}
                  badge="trending"
                  locale="it"
                />
              ))}
            </div>
          </section>
        )}

        {/* ── Nuovi Generati ── */}
        {newlyGeneratedIT.length > 0 && newlyGeneratedIT[0].id !== trendingIT[0]?.id && (
          <section className="mb-12">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl sm:text-2xl font-black tracking-tight flex items-center gap-2">
                <span className="text-green-400">✨</span> Nuovi Generati
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {newlyGeneratedIT.map((s) => (
                <DilemmaCard
                  key={s.id}
                  scenario={s}
                  playHref={`/it/play/${s.id}`}
                  badge="new"
                  locale="it"
                />
              ))}
            </div>
          </section>
        )}

        {/* ── Categorie ── */}
        <section className="mb-12">
          <h2 className="text-xl sm:text-2xl font-black tracking-tight mb-5 flex items-center gap-2">
            <span>📂</span> Esplora per Categoria
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {FEATURED_CATEGORIES.map((cat) => (
              <Link
                key={cat.slug}
                href={`/it/category/${cat.slug}`}
                className="card-neon group rounded-xl p-4 transition-all text-center"
              >
                <span className="text-3xl block mb-2">{cat.emoji}</span>
                <span className="font-semibold text-[var(--text)] block">{cat.label}</span>
                <span className="text-xs text-[var(--muted)] group-hover:text-white transition-colors">{cat.desc}</span>
              </Link>
            ))}
          </div>
        </section>

        {/* ── FAQ ── */}
        <section className="mb-12">
          <h2 className="text-xl sm:text-2xl font-black tracking-tight mb-6 text-center">❓ Domande Frequenti</h2>
          <div className="space-y-3">
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
                className="card-neon rounded-xl p-4 cursor-pointer"
              >
                <summary className="font-semibold text-[var(--text)] list-none flex items-center justify-between">
                  {q}
                  <span className="text-[var(--muted)] group-open:rotate-180 transition-transform ml-2 flex-shrink-0">▾</span>
                </summary>
                <p className="mt-3 text-sm text-[var(--muted)] leading-relaxed">{a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* ── CTA finale ── */}
        <section className="text-center py-8">
          <h2 className="text-2xl font-black mb-3">Pronto a scegliere?</h2>
          <p className="text-[var(--muted)] mb-6">Unisciti a migliaia di persone che votano ogni giorno.</p>
          <Link
            href="/it"
            className="inline-block rounded-full bg-blue-600 hover:bg-blue-500 text-white font-bold px-8 py-3 transition-colors shadow-[0_0_20px_rgba(59,130,246,0.4)]"
          >
            Vedi tutti i dilemmi →
          </Link>
        </section>
      </div>
    </>
  )
}
