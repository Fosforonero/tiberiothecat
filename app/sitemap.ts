import { MetadataRoute } from 'next'
import { scenarios, CATEGORIES } from '@/lib/scenarios'

const BASE = 'https://splitvote.io'

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()

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

  const categoryRoutes = CATEGORIES.filter((c) => c.value !== 'all').map((c) => ({
    url: `${BASE}/category/${c.value}`,
    lastModified: now,
    changeFrequency: 'daily' as const,
    priority: 0.85,
  }))

  return [
    {
      url: BASE,
      lastModified: now,
      changeFrequency: 'daily' as const,
      priority: 1,
    },
    ...categoryRoutes,
    ...scenarioRoutes,
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
  ]
}
