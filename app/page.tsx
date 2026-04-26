import { scenarios } from '@/lib/scenarios'
import { getDynamicScenarios } from '@/lib/dynamic-scenarios'
import { getVotes } from '@/lib/redis'
import DilemmaGrid from '@/components/DilemmaGrid'
import AdSlot from '@/components/AdSlot'
import DailyDilemma from '@/components/DailyDilemma'
import type { Scenario } from '@/lib/scenarios'

const SLOT_HOME = process.env.NEXT_PUBLIC_ADSENSE_SLOT_HOME ?? 'TODO'

export const revalidate = 3600

function getDailyScenario(all: Scenario[]): Scenario {
  if (all.length === 0) return scenarios[0]
  const daysSinceEpoch = Math.floor(Date.now() / 86_400_000)
  return all[daysSinceEpoch % all.length]
}

export default async function HomePage() {
  let dynamicScenarios: Scenario[] = []
  try {
    dynamicScenarios = await getDynamicScenarios()
  } catch {
    // Redis unavailable
  }

  const staticIds = new Set(scenarios.map((s) => s.id))
  const uniqueDynamic = dynamicScenarios.filter((d) => !staticIds.has(d.id))
  const allScenarios: Scenario[] = [...uniqueDynamic, ...scenarios]

  const dailyScenario = getDailyScenario(allScenarios)
  let dailyVotes = 0
  try {
    const v = await getVotes(dailyScenario.id)
    dailyVotes = v.a + v.b
  } catch {
    // Non-blocking
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 sm:py-16">

      {/* ── Hero ── */}
      <div className="text-center mb-10 sm:mb-14">
        <div className="inline-flex items-center gap-2 bg-blue-500/10 text-blue-400 text-xs font-bold tracking-widest uppercase px-4 py-2 rounded-full mb-6 border border-blue-500/20 neon-glow-blue">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400 pulse-glow" />
          Real-time global votes
        </div>
        <h1 className="text-4xl sm:text-5xl md:text-7xl font-black tracking-tight mb-5 sm:mb-6 leading-none">
          What would the
          <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-purple-400 to-blue-400">
            world choose?
          </span>
        </h1>
        <p className="text-base sm:text-xl text-[var(--muted)] max-w-lg mx-auto leading-relaxed">
          Impossible moral dilemmas. Millions of real votes. No right answers — just honest ones.
        </p>
      </div>

      {/* ── Dilemma of the Day ── */}
      <DailyDilemma scenario={dailyScenario} totalVotes={dailyVotes} />

      {/* ── Dilemma grid ── */}
      <DilemmaGrid scenarios={allScenarios} />

      {/* AdSense */}
      <div className="mt-12">
        <AdSlot slot={SLOT_HOME} className="rounded-2xl" />
      </div>
    </div>
  )
}
