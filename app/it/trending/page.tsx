/**
 * /it/trending — Italian trending dilemmas page.
 * Shows AI-generated dilemmas with locale='it' from Redis.
 */
import { getDynamicScenariosByLocale } from '@/lib/dynamic-scenarios'
import Link from 'next/link'
import type { Metadata } from 'next'

const BASE_URL = 'https://splitvote.io'

export const metadata: Metadata = {
  title: 'Dilemmi di Tendenza Oggi | SplitVote',
  description: 'Dilemmi morali freschi generati ogni giorno dalle notizie più discusse in Italia. Vota e scopri come si divide il mondo in tempo reale.',
  alternates: {
    canonical: `${BASE_URL}/it/trending`,
    languages: {
      'it-IT': `${BASE_URL}/it/trending`,
      'en': `${BASE_URL}/trending`,
      'x-default': `${BASE_URL}/trending`,
    },
  },
  openGraph: {
    title: 'Dilemmi di Tendenza Oggi — SplitVote',
    description: 'Dilemmi morali freschi generati ogni giorno dalle notizie italiane. Aggiornati ogni mattina alle 6:00 UTC.',
    url: `${BASE_URL}/it/trending`,
    locale: 'it_IT',
  },
}

export const revalidate = 3600

export default async function ItTrendingPage() {
  let dilemmi: Awaited<ReturnType<typeof getDynamicScenariosByLocale>> = []
  try {
    dilemmi = await getDynamicScenariosByLocale('it')
  } catch { /* Redis unavailable */ }

  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="inline-block bg-purple-500/10 text-purple-400 text-xs font-bold tracking-widest uppercase px-4 py-2 rounded-full mb-6 border border-purple-500/20">
          {dilemmi.length > 0 ? '✨ Aggiornato ogni giorno' : '🔥 In evidenza'}
        </div>
        <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-4">
          Tendenze{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">
            Oggi
          </span>
        </h1>
        <p className="text-lg text-[var(--muted)] max-w-md mx-auto">
          {dilemmi.length > 0
            ? 'Dilemmi morali ispirati alle notizie e ai trend più caldi in Italia. Freschi ogni mattina alle 6:00 UTC.'
            : 'I dilemmi AI dal feed italiano appaiono alle 6:00 UTC. Riprova domani mattina!'}
        </p>
      </div>

      {dilemmi.length > 0 ? (
        <div className="space-y-4">
          {dilemmi.map((scenario) => (
            <Link
              key={scenario.id}
              href={`/it/play/${scenario.id}`}
              className="group block rounded-2xl border border-purple-500/20 bg-[var(--surface)] p-6 hover:border-purple-500/50 hover:bg-[#1a1025] transition-all duration-200 hover:-translate-y-0.5"
            >
              <div className="flex items-start gap-4">
                <span className="text-4xl flex-shrink-0">{scenario.emoji}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="text-[10px] bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-full px-2 py-0.5 font-bold uppercase tracking-wide">
                      ✨ tendenza
                    </span>
                    <span className="text-xs text-[var(--muted)] uppercase tracking-widest font-bold">
                      {scenario.category}
                    </span>
                    {scenario.trend && (
                      <span className="text-xs text-[var(--muted)] opacity-60 italic truncate max-w-[200px]">
                        ispirato da: {scenario.trend}
                      </span>
                    )}
                    <span className="text-xs text-[var(--muted)] opacity-50 ml-auto">
                      {new Date(scenario.generatedAt).toLocaleDateString('it-IT', { day: '2-digit', month: 'short' })}
                    </span>
                  </div>
                  <p className="font-semibold text-[var(--text)] leading-snug mb-4">
                    {scenario.question}
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    <span className="text-xs bg-red-500/10 text-red-400 border border-red-500/20 rounded-full px-3 py-1">
                      {scenario.optionA.split('.')[0]}
                    </span>
                    <span className="text-xs bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full px-3 py-1">
                      {scenario.optionB.split('.')[0]}
                    </span>
                  </div>
                </div>
                <span className="text-[var(--muted)] text-xs group-hover:text-purple-400 transition-colors flex-shrink-0">
                  Vota →
                </span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 text-[var(--muted)]">
          <p className="text-4xl mb-4">🌙</p>
          <p className="text-lg font-semibold text-white mb-2">Nessun dilemma italiano ancora</p>
          <p className="text-sm">Il cron genera nuovi dilemmi ogni giorno alle 6:00 UTC. Torna domani!</p>
        </div>
      )}

      {/* Links */}
      <div className="mt-12 flex justify-center gap-6 text-sm text-[var(--muted)]">
        <Link href="/it" className="hover:text-white transition-colors">
          ← Tutti i dilemmi
        </Link>
        <Link href="/trending" className="hover:text-white transition-colors">
          🌍 Trending EN →
        </Link>
      </div>
    </div>
  )
}
