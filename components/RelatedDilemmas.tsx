import Link from 'next/link'
import type { Scenario } from '@/lib/scenarios'

interface Props {
  current: Scenario
  all: Scenario[]
}

/**
 * Shows 4 related dilemmas from the same category — improves internal linking
 * and reduces bounce rate by keeping users exploring.
 */
export default function RelatedDilemmas({ current, all }: Props) {
  const related = all
    .filter((s) => s.id !== current.id && s.category === current.category)
    .slice(0, 4)

  if (related.length === 0) return null

  const categoryLabel = current.category.charAt(0).toUpperCase() + current.category.slice(1)

  return (
    <section
      aria-label="Related dilemmas"
      className="w-full max-w-2xl mx-auto mt-10 mb-4 px-4"
    >
      <h2 className="text-sm font-semibold uppercase tracking-widest text-gray-400 mb-4">
        More {categoryLabel} Dilemmas
      </h2>

      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {related.map((s) => (
          <li key={s.id}>
            <Link
              href={`/play/${s.id}`}
              className="group flex items-start gap-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 transition-all p-3"
            >
              <span className="text-2xl mt-0.5 shrink-0" aria-hidden>
                {s.emoji}
              </span>
              <span className="text-sm text-gray-300 group-hover:text-white transition-colors line-clamp-3 leading-snug">
                {s.question}
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <p className="mt-3 text-center">
        <Link
          href={`/category/${current.category}`}
          className="text-xs text-blue-400 hover:text-blue-300 underline underline-offset-2 transition-colors"
        >
          See all {categoryLabel} dilemmas →
        </Link>
      </p>
    </section>
  )
}
