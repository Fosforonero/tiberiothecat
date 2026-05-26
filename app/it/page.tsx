import Link from 'next/link'
import PersonalityTeaser from '@/components/PersonalityTeaser'
import { scenarios } from '@/lib/scenarios'
import type { DynamicScenario } from '@/lib/dynamic-scenarios'
import { getFreshDynamicScenarios, getCachedVotesBatch, getCachedTrendingIds } from '@/lib/cached-data'
import { getServerVotedIds, freshFirst } from '@/lib/voted-ids'
import VotedDilemmaCard from '@/components/VotedDilemmaCard'
import DailyDilemma from '@/components/DailyDilemma'
import JsonLd from '@/components/JsonLd'
import { translateScenarioToItalian } from '@/lib/scenarios-it'
import type { Metadata } from 'next'
import type { Scenario } from '@/lib/scenarios'

function getDailyScenario(all: Scenario[]): Scenario {
  if (all.length === 0) return all[0] ?? scenarios[0]
  const daysSinceEpoch = Math.floor(Date.now() / 86_400_000)
  return all[daysSinceEpoch % all.length]
}

const BASE_URL = 'https://splitvote.io'

// Bypasses Next.js Data Cache to avoid stale dynamic discovery state
// (same pattern as commit 76ad684 — extended here to IT home).
export const dynamic = 'force-dynamic'

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

const FEATURED_DILEMMA_IDS = [
  'trolley',
  'organ-harvest',
  'lifeboat',
  'truth-friend',
  'self-driving-crash',
  'privacy-terror',
]

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

  // Same source as category pages — prevents cache divergence with getCachedDynamicScenariosByLocale
  const staticIds = new Set(scenarios.map((s) => s.id))
  let dynamicIT: DynamicScenario[] = []
  try {
    const allDynamic = await getFreshDynamicScenarios()
    dynamicIT = allDynamic
      .filter((d) => !staticIds.has(d.id) && d.locale === 'it')
      .sort((a, b) => {
        const ta = a.approvedAt ? new Date(a.approvedAt).getTime() : a.generatedAt ? new Date(a.generatedAt).getTime() : 0
        const tb = b.approvedAt ? new Date(b.approvedAt).getTime() : b.generatedAt ? new Date(b.generatedAt).getTime() : 0
        return tb - ta
      })
  } catch { /* Redis unavailable */ }

  // Full IT catalog: dynamic IT (already deduped against static) + all static translated
  const uniqueDynamicIT = dynamicIT
  const allScenariosIT: Scenario[] = [...uniqueDynamicIT, ...scenarios.map(translateScenarioToItalian)]

  // Daily dilemma for IT — prefers dynamic IT, falls back to translated static pool
  const allITPool: Scenario[] = allScenariosIT
  const dailyIT = getDailyScenario(allITPool)

  // Batch vote counts for featured + dynamic + daily
  let voteMap = new Map<string, number>()
  try {
    const ids = new Set([
      dailyIT.id,
      ...featured.map((s) => s.id),
      ...dynamicIT.slice(0, 12).map((s) => s.id),
    ])
    const obj = await getCachedVotesBatch([...ids])
    voteMap = new Map(Object.entries(obj))
  } catch { /* Non-blocking */ }

  // Run trending lookup and viewer voted-IDs lookup in parallel — independent.
  const [trendingITIds, votedIds] = await Promise.all([
    getCachedTrendingIds(allITPool.map(s => s.id), 6),
    getServerVotedIds(),
  ])
  const itScenarioById = new Map(allITPool.map(s => [s.id, s]))

  // Accumulate seen IDs in section priority order so the same scenario ID
  // cannot appear in more than one visible section. Each section then gets
  // freshFirst() so position-0 in every grid is guaranteed unvoted whenever
  // the section contains any unvoted item.
  const seen = new Set<string>([dailyIT.id])

  const featuredRaw = featured.filter(s => !seen.has(s.id))
  const featuredDeduped = freshFirst(featuredRaw, votedIds)
  featuredDeduped.forEach(s => seen.add(s.id))

  const trendingRaw = trendingITIds
    .map(id => itScenarioById.get(id))
    .filter((s): s is Scenario => s !== undefined && !seen.has(s.id))
  const trendingIT = freshFirst(trendingRaw, votedIds)
  trendingIT.forEach(s => seen.add(s.id))

  const newlyGeneratedRaw = [...dynamicIT]
    .filter(s => !seen.has(s.id))
    .sort((a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime())
    .slice(0, 6)
  const newlyGeneratedIT = freshFirst(newlyGeneratedRaw, votedIds)

  // "Per te" — 3 personalised picks + 1 fixed catalog CTA (DILEMMAS-CATALOG-01).
  // Mirrors the EN home structure with 4th slot as a CTA card linking to
  // /it/dilemmi-morali.
  type PickItem = { scenario: Scenario; badge: 'trending' | 'new' | undefined }
  const picks: PickItem[] = []
  if (trendingIT[0])         picks.push({ scenario: trendingIT[0],         badge: 'trending' })
  if (featuredDeduped[0])    picks.push({ scenario: featuredDeduped[0],    badge: undefined  })
  if (newlyGeneratedIT[0])   picks.push({ scenario: newlyGeneratedIT[0],   badge: 'new'      })
  if (picks.length < 3 && featuredDeduped[1])    picks.push({ scenario: featuredDeduped[1],    badge: undefined  })
  if (picks.length < 3 && trendingIT[1])         picks.push({ scenario: trendingIT[1],         badge: 'trending' })
  if (picks.length < 3 && newlyGeneratedIT[1])   picks.push({ scenario: newlyGeneratedIT[1],   badge: 'new'      })
  const perTe = picks.slice(0, 3)

  return (
    <>
      <JsonLd data={websiteSchema} />

      <div className="max-w-4xl mx-auto px-4 py-12 sm:py-16">

        {/* Hero */}
        <div className="text-center mb-4 sm:mb-10">
          <div className="inline-flex items-center gap-2 bg-blue-500/10 text-blue-400 text-xs font-bold tracking-widest uppercase px-4 py-2 rounded-full mb-6 border border-blue-500/20 neon-glow-blue">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 pulse-glow" />
            Voti in tempo reale
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-[88px] font-black tracking-tight mb-5 sm:mb-6 leading-none">
            Cosa sceglierebbe
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-purple-400 to-blue-400">
              il mondo?
            </span>
          </h1>
          <p className="text-base sm:text-xl text-[var(--muted)] max-w-lg mx-auto leading-relaxed">
            Vota in anonimo. Scopri come si divide il mondo. Fai crescere il tuo profilo morale.
          </p>
          <div className="mt-6 flex items-center justify-center">
            <Link
              href="/it/trending"
              className="text-sm text-[var(--muted)] hover:text-white transition-colors"
            >
              Vedi le tendenze →
            </Link>
          </div>
        </div>

        {/* ── Game loop ── */}
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 mb-4 text-xs text-[var(--muted)]">
          <span className="flex items-center gap-1.5">
            <span className="text-blue-400 font-black neon-text-blue">1.</span> Vota un dilemma
          </span>
          <span className="text-white/15 hidden sm:inline">→</span>
          <span className="flex items-center gap-1.5">
            <span className="text-purple-400 font-black neon-text-purple">2.</span> Scopri come si divide il mondo
          </span>
          <span className="text-white/15 hidden sm:inline">→</span>
          <span className="flex items-center gap-1.5">
            <span className="text-yellow-400 font-black neon-text-yellow">3.</span> Fai crescere il tuo profilo morale
          </span>
        </div>

        {/* ── Trust strip ── */}
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 mb-8 text-xs text-[var(--muted)]">
          <span className="flex items-center gap-1.5"><span className="text-green-400">✓</span> Nessun account richiesto</span>
          <span className="flex items-center gap-1.5"><span className="text-green-400">✓</span> Voto anonimo</span>
          <span className="flex items-center gap-1.5"><span className="text-green-400">✓</span> Scopri chi la pensa come te</span>
        </div>

        {/* ── Dilemma del Giorno ── */}
        <p className="text-xs font-bold uppercase tracking-widest text-[var(--muted)] text-center mb-3">
          Il dilemma di oggi — scopri da che parte stai
        </p>
        <DailyDilemma
          scenario={dailyIT}
          totalVotes={voteMap.get(dailyIT.id) ?? 0}
          locale="it"
        />

        {/* ── Personality teaser (utenti loggati, dismiss 7 giorni) ── */}
        <PersonalityTeaser locale="it" />

        {/* ── Per te — single deterministic continuation section
              (1 trending + 1 in evidenza + 2 fresh, max 4 cards) ── */}
        {perTe.length > 0 && (
          <section className="mb-10">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl sm:text-2xl font-black tracking-tight flex items-center gap-2">
                <span className="text-blue-400" aria-hidden="true">▶</span> Per te
              </h2>
              <Link href="/it/trending" className="text-sm text-[var(--muted)] hover:text-white transition-colors">
                Vedi tutti →
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {perTe.map(({ scenario: s, badge }) => (
                <VotedDilemmaCard
                  key={s.id}
                  scenario={s}
                  playHref={`/it/play/${s.id}`}
                  resultsHref={`/it/results/${s.id}`}
                  totalVotes={voteMap.get(s.id)}
                  badge={badge}
                  locale="it"
                />
              ))}
              <Link
                href="/it/dilemmi-morali"
                className="group relative flex flex-col justify-between rounded-2xl border border-blue-500/30 bg-gradient-to-br from-blue-500/10 to-purple-500/5 p-5 hover:border-blue-500/60 hover:from-blue-500/15 hover:to-purple-500/10 transition-all motion-reduce:transition-none"
                aria-label={`Esplora il catalogo completo di ${allScenariosIT.length} dilemmi`}
              >
                <div>
                  <div className="text-3xl mb-3" aria-hidden="true">🔍</div>
                  <p className="text-lg font-black text-white leading-tight mb-2">
                    Esplora tutti i {allScenariosIT.length} dilemmi
                  </p>
                  <p className="text-sm text-[var(--muted)] leading-snug">
                    Sfoglia il catalogo completo. Filtra per categoria, ordina per popolarità o divisività.
                  </p>
                </div>
                <div className="mt-4 text-xs text-blue-300 font-bold tracking-widest uppercase flex items-center gap-1">
                  Apri catalogo
                  <span aria-hidden="true" className="transition-transform group-hover:translate-x-1 motion-reduce:transition-none">→</span>
                </div>
              </Link>
            </div>
          </section>
        )}

        {/* ── Esplora per tema — quiet pill chip row to surface category
              discovery without bringing back the deleted "Esplora per
              Categoria" grid. Mobile-first: text-only chips with
              flex-wrap, min-h 36 px, last chip ("Tutti i temi →")
              visually distinct as the broader browse path. Mirrors the
              EN structure exactly. ── */}
        <div className="mb-8">
          <p className="text-xs font-bold uppercase tracking-widest text-[var(--muted)] text-center mb-3">
            Esplora per tema
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Link
              href="/it/category/morality"
              className="inline-flex items-center px-3.5 py-2 min-h-[36px] rounded-full border border-[var(--border)] hover:border-blue-500/40 text-xs text-[var(--muted)] hover:text-white bg-[var(--surface)]/40 hover:bg-[var(--surface)] transition-all"
            >
              Moralità
            </Link>
            <Link
              href="/it/category/survival"
              className="inline-flex items-center px-3.5 py-2 min-h-[36px] rounded-full border border-[var(--border)] hover:border-blue-500/40 text-xs text-[var(--muted)] hover:text-white bg-[var(--surface)]/40 hover:bg-[var(--surface)] transition-all"
            >
              Sopravvivenza
            </Link>
            <Link
              href="/it/category/relationships"
              className="inline-flex items-center px-3.5 py-2 min-h-[36px] rounded-full border border-[var(--border)] hover:border-blue-500/40 text-xs text-[var(--muted)] hover:text-white bg-[var(--surface)]/40 hover:bg-[var(--surface)] transition-all"
            >
              Relazioni
            </Link>
            <Link
              href="/it/category/technology"
              className="inline-flex items-center px-3.5 py-2 min-h-[36px] rounded-full border border-[var(--border)] hover:border-blue-500/40 text-xs text-[var(--muted)] hover:text-white bg-[var(--surface)]/40 hover:bg-[var(--surface)] transition-all"
            >
              Tecnologia
            </Link>
            <Link
              href="/it/temi"
              className="inline-flex items-center gap-1 px-3.5 py-2 min-h-[36px] rounded-full border border-blue-500/30 hover:border-blue-500/60 text-xs text-blue-300/80 hover:text-blue-300 bg-blue-500/5 hover:bg-blue-500/10 transition-all"
            >
              Tutti i temi
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>

        {/* ── Compact continuation links — secondary nav. "Tutti i temi" was
              removed from this strip since the chip row above already
              surfaces the broader browse path. /it/faq retains the full
              FAQ content. ── */}
        <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 mb-12 text-sm text-[var(--muted)]">
          <Link href="/it/trending" className="hover:text-white transition-colors">
            <span aria-hidden="true">🔥</span> Di tendenza
          </Link>
          <span className="text-white/15">·</span>
          <Link href="/it/leaderboard" className="hover:text-white transition-colors">
            <span aria-hidden="true">🏆</span> Classifica
          </Link>
          <span className="text-white/15">·</span>
          <Link href="/it/faq" className="hover:text-white transition-colors">
            <span aria-hidden="true">❓</span> Domande frequenti
          </Link>
        </div>

      </div>
    </>
  )
}
