import { scenarios } from '@/lib/scenarios'
import { getDynamicScenarios } from '@/lib/dynamic-scenarios'
import DilemmaGrid from '@/components/DilemmaGrid'
import AdSlot from '@/components/AdSlot'
import type { Scenario } from '@/lib/scenarios'

const SLOT_HOME = process.env.NEXT_PUBLIC_ADSENSE_SLOT_HOME ?? 'TODO'

export const revalidate = 3600 // revalidate every hour to pick up new AI dilemmas

export default async function HomePage() {
  // Merge static + AI-generated dilemmas (AI ones shown first with ✨ badge)
  let dynamicScenarios: Scenario[] = []
  try {
    dynamicScenarios = await getDynamicScenarios()
  } catch {
    // Redis unavailable — gracefully fall back to static only
  }

  // Deduplicate: if an AI scenario has same id as static one, skip it
  const staticIds = new Set(scenarios.map((s) => s.id))
  const uniqueDynamic = dynamicScenarios.filter((d) => !staticIds.has(d.id))

  // Dynamic first so they appear at the top (or interspersed after filter)
  const allScenarios: Scenario[] = [...uniqueDynamic, ...scenarios]

  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      {/* Hero */}
      <div className="text-center mb-12">
        <div className="inline-block bg-blue-500/10 text-blue-400 text-xs font-bold tracking-widest uppercase px-4 py-2 rounded-full mb-6 border border-blue-500/20">
          Real-time global votes
        </div>
        <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-6 leading-none">
          What would the
          <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-purple-400 to-blue-400">
            world choose?
          </span>
        </h1>
        <p className="text-xl text-[var(--muted)] max-w-lg mx-auto">
          Impossible moral dilemmas. Millions of real votes. No right answers — just honest ones.
        </p>
      </div>

      {/* Dilemma grid with category filter (client component) */}
      <DilemmaGrid scenarios={allScenarios} />

      {/* AdSense — below the grid */}
      <div className="mt-12">
        <AdSlot slot={SLOT_HOME} className="rounded-2xl" />
      </div>
    </div>
  )
}
