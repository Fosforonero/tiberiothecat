import { getDynamicScenarios } from '@/lib/dynamic-scenarios'
import type { DynamicScenario } from '@/lib/dynamic-scenarios'
import { scenarios } from '@/lib/scenarios'
import Link from 'next/link'
import type { Metadata } from 'next'
import DilemmaOptionPills from '@/components/DilemmaOptionPills'

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

  // Fallback: show a curated selection of static dilemmas when no AI ones exist yet
  const fallbackScenarios = scenarios.slice(0, 12)

  type DisplayItem = {
    id: string
    emoji: string
    category: string
    question: string
    optionA: string
    optionB: string
    trend?: string
    isDynamic: boolean
  }

  const displayItems: DisplayItem[] = hasDynamic
    ? dynamicScenarios.map(s => ({ ...s, isDynamic: true }))
    : fallbackScenarios.map(s => ({ ...s, isDynamic: false }))

  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="inline-block bg-purple-500/10 text-purple-400 text-xs font-bold tracking-widest uppercase px-4 py-2 rounded-full mb-6 border border-purple-500/20">
          {hasDynamic ? '✨ Updated daily' : '🔥 Most popular'}
        </div>
        <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-4">
          Trending{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">
            {hasDynamic ? 'Today' : 'Now'}
          </span>
        </h1>
        <p className="text-lg text-[var(--muted)] max-w-md mx-auto">
          {hasDynamic
            ? "Moral dilemmas inspired by today's biggest news and trending topics. Fresh every morning at 6am UTC."
            : "The most debated moral dilemmas on SplitVote. AI-generated ones from today's news appear at 6am UTC."}
        </p>
      </div>

      <div className="space-y-4">
        {displayItems.map((scenario) => (
          <Link
            key={scenario.id}
            href={`/play/${scenario.id}`}
            className="group block rounded-2xl border border-purple-500/20 bg-[var(--surface)] p-6 hover:border-purple-500/50 hover:bg-[#1a1025] transition-all duration-200 hover:-translate-y-0.5"
          >
            <div className="flex items-start gap-4">
              <span className="text-4xl flex-shrink-0">{scenario.emoji}</span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  {scenario.isDynamic ? (
                    <span className="text-[10px] bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-full px-2 py-0.5 font-bold uppercase tracking-wide">
                      ✨ trending
                    </span>
                  ) : (
                    <span className="text-[10px] bg-orange-500/20 text-orange-400 border border-orange-500/30 rounded-full px-2 py-0.5 font-bold uppercase tracking-wide">
                      🔥 popular
                    </span>
                  )}
                  <span className="text-xs text-[var(--muted)] uppercase tracking-widest font-bold">
                    {scenario.category}
                  </span>
                  {scenario.isDynamic && scenario.trend && (
                    <span className="text-xs text-[var(--muted)] opacity-60 italic truncate max-w-[200px]">
                      inspired by: {scenario.trend}
                    </span>
                  )}
                </div>
                <p className="font-semibold text-[var(--text)] leading-snug mb-4">
                  {scenario.question}
                </p>
                <DilemmaOptionPills optionA={scenario.optionA} optionB={scenario.optionB} />
              </div>
              <span className="hidden sm:inline text-[var(--muted)] text-xs group-hover:text-purple-400 transition-colors flex-shrink-0">
                Vote →
              </span>
            </div>
          </Link>
        ))}
      </div>

      {/* Back link */}
      <div className="mt-12 text-center">
        <Link href="/" className="text-sm text-[var(--muted)] hover:text-white transition-colors">
          ← All dilemmas
        </Link>
      </div>
    </div>
  )
}
