'use client'

import { useState } from 'react'
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
      {/* Category filter */}
      <div className="flex flex-wrap gap-2 justify-center mb-10">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.value}
            onClick={() => setActiveCategory(cat.value)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all duration-150 border
              ${activeCategory === cat.value
                ? 'bg-blue-500/20 border-blue-500/50 text-blue-300'
                : 'bg-transparent border-[var(--border)] text-[var(--muted)] hover:border-blue-500/30 hover:text-white'
              }`}
          >
            <span>{cat.emoji}</span>
            <span>{cat.label}</span>
          </button>
        ))}
      </div>

      {/* Count */}
      <p className="text-center text-xs text-[var(--muted)] mb-6 opacity-60">
        {filtered.length} dilemma{filtered.length !== 1 ? 's' : ''}
      </p>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((scenario) => (
          <Link
            key={scenario.id}
            href={`/play/${scenario.id}`}
            className="group block rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 hover:border-blue-500/40 hover:bg-[#16162a] transition-all duration-200 hover:-translate-y-0.5"
          >
            <div className="flex items-start gap-4">
              <span className="text-4xl flex-shrink-0">{scenario.emoji}</span>
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-bold uppercase tracking-widest text-[var(--muted)]">
                    {scenario.category}
                  </span>
                  {'generatedAt' in scenario && (
                    <span className="text-[10px] bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-full px-2 py-0.5">
                      ✨ trending
                    </span>
                  )}
                </div>
                <p className="font-semibold text-[var(--text)] leading-snug mb-4 line-clamp-3">
                  {scenario.question}
                </p>
                <div className="flex gap-2 flex-wrap">
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
    </>
  )
}
