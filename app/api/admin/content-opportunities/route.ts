/**
 * GET /api/admin/content-opportunities
 *
 * Admin-only, read-only endpoint.
 * Returns ranked content opportunities for blog articles and new dilemma topics
 * based on most-voted approved dilemmas, category gaps, and trending patterns.
 *
 * Used by the admin dashboard to guide manual content decisions.
 * Never triggers any generation or publication automatically.
 */

import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-guard'
import { getDynamicScenarios } from '@/lib/dynamic-scenarios'
import { scenarios } from '@/lib/scenarios'
import { getVotesBatch } from '@/lib/redis'
import { allPosts } from '@/lib/blog'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const VALID_CATEGORIES = [
  'morality', 'survival', 'loyalty', 'justice',
  'freedom', 'technology', 'society', 'relationships',
] as const

type Category = typeof VALID_CATEGORIES[number]

// Blog topic templates by category
const BLOG_TOPIC_TEMPLATES: Record<Category, (locale: 'en' | 'it') => string> = {
  morality:      (l) => l === 'it' ? 'La Psicologia delle Scelte Morali Impossibili'            : 'The Psychology Behind Impossible Moral Choices',
  survival:      (l) => l === 'it' ? 'Cosa Rivela di Te un Dilemma di Sopravvivenza'            : 'What Survival Dilemmas Reveal About You',
  loyalty:       (l) => l === 'it' ? 'Lealtà vs Onestà: Quando i Valori si Scontrano'          : 'Loyalty vs Honesty: When Values Collide',
  justice:       (l) => l === 'it' ? 'Giustizia o Coscienza: Il Conflitto Eterno'               : 'Justice vs Conscience: The Eternal Conflict',
  freedom:       (l) => l === 'it' ? 'Libertà vs Sicurezza: Non Esiste la Scelta Giusta'        : 'Freedom vs Safety: There Is No Right Answer',
  technology:    (l) => l === 'it' ? "L'Etica dell'Intelligenza Artificiale: Cosa Sceglieresti" : 'The Ethics of AI: What Would You Actually Choose',
  society:       (l) => l === 'it' ? 'I Dilemmi della Società Moderna: Cosa Divide il Mondo'   : 'The Dilemmas Dividing Modern Society',
  relationships: (l) => l === 'it' ? "Relazioni e Tradimenti: I Dilemmi che Nessuno Vuole Affrontare" : 'Relationships and Betrayal: The Dilemmas Nobody Wants to Face',
}

const BLOG_KEYWORDS: Record<Category, Record<'en' | 'it', string>> = {
  morality:      { en: 'moral psychology dilemmas', it: 'psicologia morale dilemmi' },
  survival:      { en: 'survival scenario psychology', it: 'scenari di sopravvivenza psicologia' },
  loyalty:       { en: 'loyalty vs honesty ethical dilemma', it: 'lealtà onestà dilemma etico' },
  justice:       { en: 'justice ethics moral philosophy', it: 'giustizia etica filosofia morale' },
  freedom:       { en: 'freedom safety trade-off ethics', it: 'libertà sicurezza etica' },
  technology:    { en: 'AI ethics moral dilemma', it: 'etica intelligenza artificiale dilemma' },
  society:       { en: 'social dilemma ethics collective', it: 'dilemma sociale etica collettiva' },
  relationships: { en: 'relationship betrayal moral choice', it: 'relazioni tradimento scelta morale' },
}

export interface BlogTopicSuggestion {
  title:             string
  locale:            'en' | 'it'
  targetKeyword:     string
  relatedDilemmaIds: string[]
  rationale:         string
  category:          string
}

export interface ContentOpportunity {
  dilemmaId:    string
  question:     string
  locale:       string
  category:     string
  totalVotes:   number
  finalScore:   number
  blogTopic:    BlogTopicSuggestion
}

export interface ContentOpportunitiesResponse {
  mostVoted:          ContentOpportunity[]
  categoryGaps:       BlogTopicSuggestion[]
  autopublishStatus:  { enabled: boolean; maxPerRun: number }
  totalApproved:      number
  totalStaticEN:      number
  generatedAt:        string
}

export async function GET() {
  const auth = await requireAdmin()
  if (auth instanceof NextResponse) return auth

  // Load approved dynamic scenarios + static scenarios
  let dynamicApproved = await getDynamicScenarios().catch(() => [])

  // Merge all approved dilemmas: dynamic first (locale-aware), then static EN
  const allDilemmas = [
    ...dynamicApproved,
    ...scenarios.map(s => ({
      ...s,
      locale: 'en',
      generatedAt: '2026-01-01T00:00:00Z',
      trend: s.category,
      status: 'approved' as const,
    })),
  ]

  // Batch vote counts
  const allIds = allDilemmas.map(d => d.id)
  let voteMap = new Map<string, number>()
  try {
    voteMap = await getVotesBatch(allIds)
  } catch {
    // Redis unavailable — show 0 votes
  }

  // Sort by total votes descending
  const ranked = allDilemmas
    .map(d => ({
      dilemmaId:  d.id,
      question:   d.question,
      locale:     d.locale ?? 'en',
      category:   d.category,
      totalVotes: voteMap.get(d.id) ?? 0,
      finalScore: (d as { scores?: { finalScore?: number } }).scores?.finalScore ?? 50,
    }))
    .sort((a, b) => b.totalVotes - a.totalVotes)
    .slice(0, 20)

  // Build blog topic suggestions for top-voted
  const mostVoted: ContentOpportunity[] = ranked.map(d => {
    const locale = (d.locale === 'it' ? 'it' : 'en') as 'en' | 'it'
    const cat = VALID_CATEGORIES.includes(d.category as Category) ? d.category as Category : 'morality'
    return {
      ...d,
      blogTopic: {
        title:             BLOG_TOPIC_TEMPLATES[cat](locale),
        locale,
        targetKeyword:     BLOG_KEYWORDS[cat][locale],
        relatedDilemmaIds: [d.dilemmaId],
        rationale:         `Top-voted ${cat} dilemma (${d.totalVotes.toLocaleString()} votes)`,
        category:          cat,
      },
    }
  })

  // Find category gaps: categories with no blog article yet
  const coveredCategoryKeywords = allPosts.flatMap(p => p.tags)
  const blogLocales = new Set(allPosts.map(p => `${p.locale}:${p.tags.join(',')}`))

  const categoryGaps: BlogTopicSuggestion[] = []
  for (const locale of ['en', 'it'] as const) {
    for (const cat of VALID_CATEGORIES) {
      const keyword = BLOG_KEYWORDS[cat][locale]
      const alreadyCovered = coveredCategoryKeywords.some(k =>
        k.toLowerCase().includes(cat) || keyword.split(' ').some(w => w.length > 4 && k.toLowerCase().includes(w))
      )
      if (!alreadyCovered) {
        // Find the top dilemma in this category for this locale to link
        const topForCat = ranked
          .filter(d => d.category === cat && d.locale === locale)
          .slice(0, 3)
          .map(d => d.dilemmaId)

        categoryGaps.push({
          title:             BLOG_TOPIC_TEMPLATES[cat](locale),
          locale,
          targetKeyword:     keyword,
          relatedDilemmaIds: topForCat,
          rationale:         `No blog article yet for "${cat}" in ${locale.toUpperCase()}`,
          category:          cat,
        })
      }
    }
  }

  const response: ContentOpportunitiesResponse = {
    mostVoted,
    categoryGaps:      categoryGaps.slice(0, 10),
    autopublishStatus: {
      enabled:    process.env.AUTO_PUBLISH_DILEMMAS === 'true',
      maxPerRun:  Math.max(1, parseInt(process.env.AUTO_PUBLISH_DILEMMAS_MAX_PER_RUN ?? '1', 10)),
    },
    totalApproved:  dynamicApproved.length,
    totalStaticEN:  scenarios.length,
    generatedAt:    new Date().toISOString(),
  }

  return NextResponse.json(response)
}
