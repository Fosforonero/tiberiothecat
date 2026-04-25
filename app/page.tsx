import { scenarios } from '@/lib/scenarios'
import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      {/* Hero */}
      <div className="text-center mb-16">
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

      {/* Scenario grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {scenarios.map((scenario) => (
          <Link
            key={scenario.id}
            href={`/play/${scenario.id}`}
            className="group block rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 hover:border-blue-500/40 hover:bg-[#16162a] transition-all duration-200 hover:-translate-y-0.5"
          >
            <div className="flex items-start gap-4">
              <span className="text-4xl flex-shrink-0">{scenario.emoji}</span>
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-[var(--muted)] mb-2 block">
                  {scenario.category}
                </span>
                <p className="font-semibold text-[var(--text)] leading-snug mb-4 line-clamp-3">
                  {scenario.question}
                </p>
                <div className="flex gap-2">
                  <span className="text-xs bg-red-500/10 text-red-400 border border-red-500/20 rounded-full px-3 py-1 line-clamp-1">
                    {scenario.optionA.split('.')[0]}
                  </span>
                  <span className="text-xs bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full px-3 py-1 line-clamp-1">
                    {scenario.optionB.split('.')[0]}
                  </span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Ad slot placeholder */}
      <div className="mt-16 rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface)] p-8 text-center text-[var(--muted)] text-sm">
        {/* AdSense slot — activated after approval */}
        <span className="opacity-30">Advertisement</span>
      </div>
    </div>
  )
}
