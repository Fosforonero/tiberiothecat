import { MetadataRoute } from 'next'
import { scenarios, CATEGORIES } from '@/lib/scenarios'
import { getDynamicScenarios } from '@/lib/dynamic-scenarios'
import { allPosts } from '@/lib/blog'
import { getIndexableTopics } from '@/lib/seo-topics'

const BASE = 'https://splitvote.io'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()

  // Fetch only APPROVED AI-generated dilemmas (drafts are never indexed)
  let dynamicScenarios: Array<{ id: string; lastModified: Date; locale: string }> = []
  try {
    const dynamic = await getDynamicScenarios()
    dynamicScenarios = dynamic
      .filter((s) => s.status === 'approved' || s.status === undefined)
      .map((s) => ({
        id:           s.id,
        lastModified: s.approvedAt ? new Date(s.approvedAt) : new Date(s.generatedAt),
        locale:       s.locale,
      }))
  } catch {
    // Redis unavailable — sitemap falls back to static only
  }

  // Static scenario pages
  const scenarioRoutes = scenarios.flatMap((s) => [
    {
      url: `${BASE}/play/${s.id}`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    },
    {
      url: `${BASE}/results/${s.id}`,
      lastModified: now,
      changeFrequency: 'daily' as const,
      priority: 0.9,
    },
    {
      url: `${BASE}/it/play/${s.id}`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.72,
    },
    {
      url: `${BASE}/it/results/${s.id}`,
      lastModified: now,
      changeFrequency: 'daily' as const,
      priority: 0.82,
    },
  ])

  // AI-generated scenario pages — locale-aware URLs, approvedAt timestamp
  const dynamicRoutes = dynamicScenarios.flatMap(({ id, lastModified, locale }) => {
    const lastMod = lastModified ?? now
    const isIT = locale === 'it'
    const playUrl    = isIT ? `${BASE}/it/play/${id}`    : `${BASE}/play/${id}`
    const resultsUrl = isIT ? `${BASE}/it/results/${id}` : `${BASE}/results/${id}`
    return [
      {
        url: playUrl,
        lastModified: lastMod,
        changeFrequency: 'weekly' as const,
        priority: isIT ? 0.72 : 0.75,
      },
      {
        url: resultsUrl,
        lastModified: lastMod,
        changeFrequency: 'daily' as const,
        priority: isIT ? 0.82 : 0.85,
      },
    ]
  })

  // Programmatic SEO topic landing pages (published + not noindex-gated + ≥3 related)
  const topicRoutes = getIndexableTopics().map((t) => ({
    url: `${BASE}/${t.slug}`,
    lastModified: now,
    changeFrequency: 'monthly' as const,
    priority: 0.80,
  }))

  // Category pages (EN + IT)
  const categoryRoutes = CATEGORIES.filter((c) => c.value !== 'all').flatMap((c) => [
    {
      url: `${BASE}/category/${c.value}`,
      lastModified: now,
      changeFrequency: 'daily' as const,
      priority: 0.85,
    },
    {
      url: `${BASE}/it/category/${c.value}`,
      lastModified: now,
      changeFrequency: 'daily' as const,
      priority: 0.80,
    },
  ])

  return [
    // Core pages
    {
      url: BASE,
      lastModified: now,
      changeFrequency: 'hourly' as const,
      priority: 1,
    },
    {
      url: `${BASE}/trending`,
      lastModified: now,
      changeFrequency: 'daily' as const,
      priority: 0.9,
    },
    {
      url: `${BASE}/personality`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    },
    // Italian locale hub pages
    {
      url: `${BASE}/it`,
      lastModified: now,
      changeFrequency: 'daily' as const,
      priority: 0.85,
    },
    {
      url: `${BASE}/it/trending`,
      lastModified: now,
      changeFrequency: 'daily' as const,
      priority: 0.8,
    },
    {
      url: `${BASE}/it/personality`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.65,
    },
    {
      url: `${BASE}/about`,
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    },
    {
      url: `${BASE}/it/about`,
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: 0.55,
    },
    {
      url: `${BASE}/it/faq`,
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    },
    {
      url: `${BASE}/it/privacy`,
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: 0.3,
    },
    {
      url: `${BASE}/it/terms`,
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: 0.3,
    },
    // SEO landing pages
    {
      url: `${BASE}/would-you-rather-questions`,
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: 0.85,
    },
    {
      url: `${BASE}/moral-dilemmas`,
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: 0.85,
    },
    {
      url: `${BASE}/it/domande-would-you-rather`,
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: 0.80,
    },
    {
      url: `${BASE}/it/dilemmi-morali`,
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: 0.80,
    },
    // Static pages
    {
      url: `${BASE}/faq`,
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    },
    // Legal
    {
      url: `${BASE}/privacy`,
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: 0.3,
    },
    {
      url: `${BASE}/terms`,
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: 0.3,
    },
    // Blog index pages
    {
      url: `${BASE}/blog`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.75,
    },
    {
      url: `${BASE}/it/blog`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.70,
    },
    // Blog articles
    ...allPosts.map((post) => ({
      url: post.locale === 'it'
        ? `${BASE}/it/blog/${post.slug}`
        : `${BASE}/blog/${post.slug}`,
      lastModified: new Date(post.date),
      changeFrequency: 'monthly' as const,
      priority: post.locale === 'it' ? 0.65 : 0.70,
    })),
    // SEO topic landing pages
    ...topicRoutes,
    // Category hubs
    ...categoryRoutes,
    // Static dilemmas
    ...scenarioRoutes,
    // AI-generated dilemmas (updates daily, real timestamps)
    ...dynamicRoutes,
  ]
}
