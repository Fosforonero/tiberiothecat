import { notFound } from 'next/navigation'
import { scenarios, CATEGORIES } from '@/lib/scenarios'
import type { Category } from '@/lib/scenarios'
import { getDynamicScenarios } from '@/lib/dynamic-scenarios'
import type { DynamicScenario } from '@/lib/dynamic-scenarios'
import type { Metadata } from 'next'
import Link from 'next/link'
import JsonLd from '@/components/JsonLd'

const BASE_URL = 'https://splitvote.io'

interface Props {
  params: { category: string }
}

const VALID_CATEGORIES = CATEGORIES.filter((c) => c.value !== 'all').map((c) => c.value as Category)

export async function generateStaticParams() {
  return VALID_CATEGORIES.map((c) => ({ category: c }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const cat = CATEGORIES.find((c) => c.value === params.category)
  if (!cat || cat.value === 'all') return {}

  const descriptions: Record<string, string> = {
    morality: 'Impossible moral dilemmas — right vs right. Vote and see how the world decides.',
    survival: 'Life-or-death survival dilemmas. What would you do when every choice has a cost?',
    loyalty: 'Loyalty dilemmas — when honesty and love collide. Vote and see the world split.',
    justice: 'Justice dilemmas — law, fairness, and moral grey zones. Where does the world stand?',
    freedom: 'Freedom vs safety dilemmas. Where do you draw the line?',
    technology: 'Tech and AI ethical dilemmas — the future is already complicated. Vote now.',
    society: 'Big society questions — inequality, borders, policy. Where does the world stand?',
    relationships: 'Love, loyalty, and impossible choices. Relationship dilemmas voted by the world.',
  }

  const title = `${cat.emoji} ${cat.label} Dilemmas — Real-time Global Votes | SplitVote`
  const description = descriptions[cat.value as string] ?? `${cat.label} moral dilemmas — vote and see how the world decides.`

  return {
    title,
    description,
    alternates: { canonical: `${BASE_URL}/category/${cat.value}` },
    openGraph: {
      title,
      description,
      url: `${BASE_URL}/category/${cat.value}`,
      siteName: 'SplitVote',
    },
    twitter: { card: 'summary_large_image', title, description },
  }
}

export const revalidate = 3600

export default async function CategoryPage({ params }: Props) {
  const cat = CATEGORIES.find((c) => c.value === params.category && c.value !== 'all')
  if (!cat) notFound()

  const category = cat.value as Category

  // Static + dynamic dilemmas for this category
  const staticFiltered = scenarios.filter((s) => s.category === category)
  let dynamicFiltered: DynamicScenario[] = []
  try {
    const dynamic = await getDynamicScenarios()
    const staticIds = new Set(scenarios.map((s) => s.id))
    dynamicFiltered = dynamic.filter((d) => d.category === category && !staticIds.has(d.id))
  } catch { /* Redis unavailable */ }

  const allForCategory = [...dynamicFiltered, ...staticFiltered]

  const descriptions: Record<string, string> = {
    morality: 'No right answers. Just honest ones.',
    survival: 'Every choice has a cost.',
    loyalty: 'When honesty and love collide.',
    justice: 'Law, fairness, and moral grey zones.',
    freedom: 'Where do you draw the line?',
    technology: 'The future is already complicated.',
    society: 'Big questions. No easy answers.',
    relationships: 'Love, loyalty, and impossible choices.',
  }

  // JSON-LD: BreadcrumbList
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'SplitVote', item: BASE_URL },
      { '@type': 'ListItem', position: 2, name: `${cat.label} Dilemmas`, item: `${BASE_URL}/category/${cat.value}` },
    ],
  }

  // JSON-LD: ItemList of dilemmas in this category
  const itemListSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `${cat.label} Moral Dilemmas — SplitVote`,
    description: descriptions[cat.value as string],
    url: `${BASE_URL}/category/${cat.value}`,
    numberOfItems: allForCategory.length,
    itemListElement: allForCategory.slice(0, 20).map((s, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: s.question,
      url: `${BASE_URL}/play/${s.id}`,
    })),
  }

  return (
    <>
      <JsonLd data={breadcrumbSchema} />
      <JsonLd data={itemListSchema} />

      <div className="max-w-4xl mx-auto px-4 py-16">
        {/* Breadcrumb */}
        <nav className="text-xs text-[var(--muted)] mb-8" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-white transition-colors">All dilemmas</Link>
          <span className="mx-2">›</span>
          <span className="text-white">{cat.label}</span>
        </nav>

        {/* Header */}
        <div className="text-center mb-12">
          <div className="text-6xl mb-4">{cat.emoji}</div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-4">
            {cat.label}{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-purple-400 to-blue-400">
              Dilemmas
            </span>
          </h1>
          <p className="text-lg text-[var(--muted)] max-w-md mx-auto">
            {descriptions[cat.value as string]}
          </p>
          <p className="text-sm text-[var(--muted)] mt-3 opacity-60">
            {allForCategory.length} dilemma{allForCategory.length !== 1 ? 's' : ''} · Real-time global votes
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {allForCategory.map((scenario) => (
            <Link
              key={scenario.id}
              href={`/play/${scenario.id}`}
              className="group block rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 hover:border-blue-500/40 hover:bg-[#16162a] transition-all duration-200 hover:-translate-y-0.5"
            >
              <div className="flex items-start gap-4">
                <span className="text-4xl flex-shrink-0">{scenario.emoji}</span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-2">
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

        {/* Other categories */}
        <div className="mt-16">
          <p className="text-xs font-bold uppercase tracking-widest text-[var(--muted)] mb-4 text-center">
            Explore other categories
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            {CATEGORIES.filter((c) => c.value !== 'all' && c.value !== cat.value).map((c) => (
              <Link
                key={c.value}
                href={`/category/${c.value}`}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest border border-[var(--border)] text-[var(--muted)] hover:border-blue-500/30 hover:text-white transition-all"
              >
                <span>{c.emoji}</span>
                <span>{c.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
