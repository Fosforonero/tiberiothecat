'use client'

import { useState } from 'react'
import { Sparkles } from 'lucide-react'
import { CATEGORIES } from '@/lib/scenarios'
import type { Scenario, Category } from '@/lib/scenarios'
import Link from 'next/link'

interface Props {
  scenarios: Scenario[]
}

export default function DilemmaGrid({ scenarios }: Props) {
  const [activeCategory, setActiveCategory] = useState<Category | 'all'>('all')

  const filtered = activeCategory === 'all'
    ? scenarios
    : scenarios.filter((s) => s.category === activeCategory)

  return (
    <>
      {/* Category filter — scrollable on mobile */}
      <div className="flex gap-2 justify-start md:justify-center mb-8 overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0 md:flex-wrap scrollbar-hide">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.value}
            onClick={() => setActiveCategory(cat.value)}
            className={`flex-shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all duration-150 border
              ${activeCategory === cat.value
                ? 'bg-blue-500/20 border-blue-500/50 text-blue-300 shadow-[0_0_12px_rgba(77,159,255,0.2)]'
                : 'bg-transparent border-[var(--border)] text-[var(--muted)] hover:border-blue-500/30 hover:text-white'
              }`}
          >
            <span>{cat.emoji}</span>
            <span className="hidden sm:inline">{cat.label}</span>
          </button>
        ))}
      </div>

      {/* Count */}
      <p className="text-center text-xs text-[var(--muted)] mb-5 opacity-60">
        {filtered.length} dilemma{filtered.length !== 1 ? 's' : ''}
      </p>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        {filtered.map((scenario) => (
          <Link
            key={scenario.id}
            href={`/play/${scenario.id}`}
            className="card-neon group block rounded-2xl p-5 sm:p-6"
          >
            <div className="flex items-start gap-3 sm:gap-4">
              <span className="text-3xl sm:text-4xl flex-shrink-0">{scenario.emoji}</span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className="text-xs font-bold uppercase tracking-widest text-[var(--muted)]">
                    {scenario.category}
                  </span>
                  {'generatedAt' in scenario && (
                    <span className="flex items-center gap-1 text-[10px] bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-full px-2 py-0.5">
                      <Sparkles size={9} />
                      trending
                    </span>
                  )}
                </div>
                <p className="font-semibold text-[var(--text)] leading-snug mb-3 line-clamp-3 text-sm sm:text-base">
                  {scenario.question}
                </p>
                <div className="flex gap-2 flex-wrap">
                  <span className="text-xs bg-red-500/10 text-red-400 border border-red-500/20 rounded-full px-3 py-1 line-clamp-1 max-w-[45%]">
                    {scenario.optionA.split('.')[0]}
                  </span>
                  <span className="text-xs bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full px-3 py-1 line-clamp-1 max-w-[45%]">
                    {scenario.optionB.split('.')[0]}
                  </span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </>
  )
}
