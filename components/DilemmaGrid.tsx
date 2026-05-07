'use client'

import { useState, useEffect } from 'react'
import { Sparkles } from 'lucide-react'
import { CATEGORIES } from '@/lib/scenarios'
import type { Scenario, Category } from '@/lib/scenarios'
import { CATEGORY_LABELS_IT } from '@/lib/scenarios-it'
import Link from 'next/link'
import DilemmaOptionPills from '@/components/DilemmaOptionPills'
import { getServerVotedIds } from '@/lib/client-voted-ids'

function GridCard({ scenario, locale, playHref }: { scenario: Scenario; locale: 'en' | 'it'; playHref: string }) {
  const [isVoted, setIsVoted] = useState(false)
  const resultsHref = locale === 'it' ? `/it/results/${scenario.id}` : `/results/${scenario.id}`

  useEffect(() => {
    if (document.cookie.includes(`sv_voted_${scenario.id}=`)) {
      setIsVoted(true)
      return
    }
    getServerVotedIds().then((ids) => {
      if (ids.has(scenario.id)) setIsVoted(true)
    })
  }, [scenario.id])

  return (
    <Link
      href={isVoted ? resultsHref : playHref}
      className="card-neon group block rounded-2xl p-5 sm:p-6"
    >
      <div className="flex items-start gap-3 sm:gap-4">
        <span className="text-3xl sm:text-4xl flex-shrink-0">{scenario.emoji}</span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="text-xs font-bold uppercase tracking-widest text-[var(--muted)]">
              {locale === 'it' ? (CATEGORY_LABELS_IT[scenario.category] ?? scenario.category) : scenario.category}
            </span>
            {'generatedAt' in scenario && (
              <span className="flex items-center gap-1 text-[10px] bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-full px-2 py-0.5">
                <Sparkles size={9} />
                {locale === 'it' ? 'nuovo' : 'trending'}
              </span>
            )}
            {isVoted && (
              <span className="text-[10px] bg-green-500/20 text-green-400 border border-green-500/30 rounded-full px-2 py-0.5 font-bold">
                {locale === 'it' ? '✓ Votato' : '✓ Voted'}
              </span>
            )}
          </div>
          <p className="font-semibold text-[var(--text)] leading-snug mb-3 line-clamp-3 text-sm sm:text-base">
            {scenario.question}
          </p>
          <DilemmaOptionPills optionA={scenario.optionA} optionB={scenario.optionB} />
        </div>
      </div>
    </Link>
  )
}

interface Props {
  scenarios: Scenario[]
  locale?: 'en' | 'it'
}

export default function DilemmaGrid({ scenarios, locale = 'en' }: Props) {
  const [activeCategory, setActiveCategory] = useState<Category | 'all'>('all')

  const filtered = activeCategory === 'all'
    ? scenarios
    : scenarios.filter((s) => s.category === activeCategory)

  function catLabel(value: Category | 'all', enLabel: string): string {
    if (locale !== 'it') return enLabel
    if (value === 'all') return 'Tutti'
    return CATEGORY_LABELS_IT[value] ?? enLabel
  }

  const playHref = (id: string) => locale === 'it' ? `/it/play/${id}` : `/play/${id}`

  const countText = locale === 'it'
    ? `${filtered.length} dilemm${filtered.length !== 1 ? 'i' : 'a'}`
    : `${filtered.length} dilemma${filtered.length !== 1 ? 's' : ''}`

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
            <span className="hidden sm:inline">{catLabel(cat.value, cat.label)}</span>
          </button>
        ))}
      </div>

      {/* Count */}
      <p className="text-center text-xs text-[var(--muted)] mb-5 opacity-60">
        {countText}
      </p>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        {filtered.map((scenario) => (
          <GridCard
            key={scenario.id}
            scenario={scenario}
            locale={locale}
            playHref={playHref(scenario.id)}
          />
        ))}
      </div>
    </>
  )
}
