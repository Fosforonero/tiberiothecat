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

const VALID_CATEGORIES = CATEGORIES.filter(c => c.value !== 'all').map(c => c.value as Category)

export async function generateStaticParams() {
  return VALID_CATEGORIES.map(c => ({ category: c }))
}

const CAT_IT: Record<string, { label: string; description: string }> = {
  morality:      { label: 'Moralità',       description: 'Nessuna risposta giusta. Solo una onesta.' },
  survival:      { label: 'Sopravvivenza',  description: 'Ogni scelta ha un costo.' },
  loyalty:       { label: 'Lealtà',         description: 'Quando onestà e amore si scontrano.' },
  justice:       { label: 'Giustizia',      description: 'Legge, equità e zone morali grigie.' },
  freedom:       { label: 'Libertà',        description: 'Dove tracci il confine?' },
  technology:    { label: 'Tecnologia',     description: 'Il futuro è già complicato.' },
  society:       { label: 'Società',        description: 'Grandi domande. Nessuna risposta facile.' },
  relationships: { label: 'Relazioni',      description: 'Amore, lealtà e scelte impossibili.' },
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const cat = CATEGORIES.find(c => c.value === params.category && c.value !== 'all')
  if (!cat) return {}

  const itMeta = CAT_IT[cat.value as string]
  const title = `${cat.emoji} Dilemmi di ${itMeta?.label ?? cat.label} — Vota in Tempo Reale | SplitVote`
  const description = itMeta?.description ?? `Dilemmi di ${itMeta?.label ?? cat.label} — vota e scopri come si divide il mondo.`

  return {
    title,
    description,
    alternates: {
      canonical: `${BASE_URL}/it/category/${cat.value}`,
      languages: {
        'it-IT': `${BASE_URL}/it/category/${cat.value}`,
        'en': `${BASE_URL}/category/${cat.value}`,
        'x-default': `${BASE_URL}/category/${cat.value}`,
      },
    },
    openGraph: {
      title,
      description,
      url: `${BASE_URL}/it/category/${cat.value}`,
      siteName: 'SplitVote',
      locale: 'it_IT',
    },
  }
}

export const revalidate = 3600

export default async function ItCategoryPage({ params }: Props) {
  const cat = CATEGORIES.find(c => c.value === params.category && c.value !== 'all')
  if (!cat) notFound()

  const category = cat.value as Category
  const itMeta = CAT_IT[category] ?? { label: cat.label, description: '' }

  // Static scenarios for this category (link to EN /play since no static IT play)
  const staticFiltered = scenarios.filter(s => s.category === category)

  // Dynamic IT scenarios for this category
  let dynamicIT: DynamicScenario[] = []
  try {
    const all = await getDynamicScenarios()
    const staticIds = new Set(scenarios.map(s => s.id))
    dynamicIT = all.filter(d => d.category === category && d.locale === 'it' && !staticIds.has(d.id))
  } catch { /* Redis unavailable */ }

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'SplitVote', item: BASE_URL },
      { '@type': 'ListItem', position: 2, name: 'Dilemmi', item: `${BASE_URL}/it` },
      { '@type': 'ListItem', position: 3, name: itMeta.label, item: `${BASE_URL}/it/category/${category}` },
    ],
  }

  return (
    <>
      <JsonLd data={breadcrumbSchema} />

      <div className="max-w-4xl mx-auto px-4 py-16">
        {/* Breadcrumb */}
        <nav className="text-xs text-[var(--muted)] mb-8" aria-label="Breadcrumb">
          <Link href="/it" className="hover:text-white transition-colors">Tutti i dilemmi</Link>
          <span className="mx-2">›</span>
          <span className="text-white">{itMeta.label}</span>
        </nav>

        {/* Header */}
        <div className="text-center mb-12">
          <div className="text-6xl mb-4">{cat.emoji}</div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-4">
            {itMeta.label}{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-purple-400 to-blue-400">
              Dilemmi
            </span>
          </h1>
          <p className="text-lg text-[var(--muted)] max-w-md mx-auto">{itMeta.description}</p>
          <p className="text-sm text-[var(--muted)] mt-3 opacity-60">
            {dynamicIT.length + staticFiltered.length} dilemm{(dynamicIT.length + staticFiltered.length) === 1 ? 'a' : 'i'} · Voti globali in tempo reale
          </p>
        </div>

        {/* Dynamic IT dilemmas first */}
        {dynamicIT.length > 0 && (
          <div className="mb-8">
            <p className="text-xs font-black uppercase tracking-widest text-purple-400 mb-4">✨ Tendenze</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {dynamicIT.map(scenario => (
                <Link
                  key={scenario.id}
                  href={`/it/play/${scenario.id}`}
                  className="group block rounded-2xl border border-purple-500/20 bg-[var(--surface)] p-6 hover:border-purple-500/40 hover:bg-[#1a1025] transition-all duration-200 hover:-translate-y-0.5"
                >
                  <div className="flex items-start gap-4">
                    <span className="text-4xl flex-shrink-0">{scenario.emoji}</span>
                    <div className="min-w-0">
                      <span className="text-[10px] bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-full px-2 py-0.5 mb-2 inline-block">
                        ✨ tendenza
                      </span>
                      <p className="font-semibold text-[var(--text)] leading-snug mb-4 line-clamp-3">{scenario.question}</p>
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
          </div>
        )}

        {/* Static scenarios */}
        {staticFiltered.length > 0 && (
          <div>
            {dynamicIT.length > 0 && (
              <p className="text-xs font-black uppercase tracking-widest text-[var(--muted)] mb-4">Classici</p>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {staticFiltered.map(scenario => (
                <Link
                  key={scenario.id}
                  href={`/play/${scenario.id}`}
                  className="group block rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 hover:border-blue-500/40 hover:bg-[#16162a] transition-all duration-200 hover:-translate-y-0.5"
                >
                  <div className="flex items-start gap-4">
                    <span className="text-4xl flex-shrink-0">{scenario.emoji}</span>
                    <div className="min-w-0">
                      <p className="font-semibold text-[var(--text)] leading-snug mb-4 line-clamp-3">{scenario.question}</p>
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
          </div>
        )}

        {/* Other categories */}
        <div className="mt-16">
          <p className="text-xs font-bold uppercase tracking-widest text-[var(--muted)] mb-4 text-center">
            Esplora altre categorie
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            {CATEGORIES.filter(c => c.value !== 'all' && c.value !== cat.value).map(c => (
              <Link
                key={c.value}
                href={`/it/category/${c.value}`}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest border border-[var(--border)] text-[var(--muted)] hover:border-blue-500/30 hover:text-white transition-all"
              >
                <span>{c.emoji}</span>
                <span>{CAT_IT[c.value as string]?.label ?? c.label}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Back link */}
        <div className="mt-8 text-center">
          <Link href="/it" className="text-sm text-[var(--muted)] hover:text-white transition-colors">
            ← Tutti i dilemmi IT
          </Link>
        </div>
      </div>
    </>
  )
}
