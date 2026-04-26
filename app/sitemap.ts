import { MetadataRoute } from 'next'
import { scenarios, CATEGORIES } from '@/lib/scenarios'
import { getDynamicScenarios } from '@/lib/dynamic-scenarios'

const BASE = 'https://splitvote.io'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()

  // Fetch AI-generated dilemmas from Redis (cron job generates these daily)
  let dynamicIds: string[] = []
  try {
    const dynamic = await getDynamicScenarios()
    dynamicIds = dynamic.map((s) => s.id)
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
  ])

  // AI-generated scenario pages (new ones added daily)
  const dynamicRoutes = dynamicIds.flatMap((id) => [
    {
      url: `${BASE}/play/${id}`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.75,
    },
    {
      url: `${BASE}/results/${id}`,
      lastModified: now,
      changeFrequency: 'daily' as const,
      priority: 0.85,
    },
  ])

  // Category pages
  const categoryRoutes = CATEGORIES.filter((c) => c.value !== 'all').map((c) => ({
    url: `${BASE}/category/${c.value}`,
    lastModified: now,
    changeFrequency: 'daily' as const,
    priority: 0.85,
  }))

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
      url: `${BASE}/login`,
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
    // Category hubs
    ...categoryRoutes,
    // Static dilemmas
    ...scenarioRoutes,
    // AI-generated dilemmas (updates daily)
    ...dynamicRoutes,
  ]
}
