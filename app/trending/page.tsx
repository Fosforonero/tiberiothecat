import { getDynamicScenarios } from '@/lib/dynamic-scenarios'
import type { DynamicScenario } from '@/lib/dynamic-scenarios'
import { scenarios } from '@/lib/scenarios'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Trending Dilemmas Today | SplitVote',
  description: 'Fresh moral dilemmas generated daily from breaking news and trending topics. Vote and see how the world decides in real time.',
  alternates: { canonical: 'https://splitvote.io/trending' },
  openGraph: {
    title: 'Trending Dilemmas Today — SplitVote',
    description: 'Fresh moral dilemmas generated daily from breaking news and trending topics.',
    url: 'https://splitvote.io/trending',
  },
}

export const revalidate = 3600

export default async function TrendingPage() {
  let dynamicScenarios: DynamicScenario[] = []
  try {
    const all = await getDynamicScenarios()
    const staticIds = new Set(scenarios.map((s) => s.id))
    dynamicScenarios = all.filter((d) => !staticIds.has(d.id))
  } catch { /* Redis unavailable */ }

  const hasDynamic = dynamicScenarios.length > 0

  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="inline-block bg-purple-500/10 text-purple-400 text-xs font-bold tracking-widest uppercase px-4 py-2 rounded-full mb-6 border border-purple-500/20">
          ✨ Updated daily
        </div>
        <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-4">
          Trending{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">
            Today
          </span>
        </h1>
        <p className="text-lg text-[var(--muted)] max-w-md mx-auto">
          Moral dilemmas inspired by today&apos;s biggest news and trending topics. Fresh every morning at 6am UTC.
        </p>
      </div>

      {hasDynamic ? (
        <div className="space-y-4">
          {dynamicScenarios.map((scenario) => (
            <Link
              key={scenario.id}
              href={`/play/${scenario.id}`}
              className="group block rounded-2xl border border-purple-500/20 bg-[var(--surface)] p-6 hover:border-purple-500/50 hover:bg-[#1a1025] transition-all duration-200 hover:-translate-y-0.5"
            >
              <div className="flex items-start gap-4">
                <span className="text-4xl flex-shrink-0">{scenario.emoji}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="text-[10px] bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-full px-2 py-0.5 font-bold uppercase tracking-wide">
                      ✨ trending
                    </span>
                    <span className="text-xs text-[var(--muted)] uppercase tracking-widest font-bold">
                      {scenario.category}
                    </span>
                    {'trend' in scenario && scenario.trend && (
                      <span className="text-xs text-[var(--muted)] opacity-60 italic truncate max-w-[200px]">
                        inspired by: {scenario.trend}
                      </span>
                    )}
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
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 border border-dashed border-[var(--border)] rounded-2xl bg-[var(--surface)]">
          <div className="text-5xl mb-4">🌅</div>
          <p className="text-[var(--muted)] font-semibold mb-2">No trending dilemmas yet today.</p>
          <p className="text-[var(--muted)] text-sm opacity-60">
            The first batch generates at 6:00 AM UTC. Check back soon!
          </p>
          <Link
            href="/"
            className="inline-block mt-6 border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--border)] text-[var(--text)] font-semibold text-sm px-6 py-3 rounded-xl transition-colors"
          >
            Browse all dilemmas →
          </Link>
        </div>
      )}

      {/* Back link */}
      <div className="mt-12 text-center">
        <Link href="/" className="text-sm text-[var(--muted)] hover:text-white transition-colors">
          ← All dilemmas
        </Link>
      </div>
    </div>
  )
}
