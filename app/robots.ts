import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/api/cron/'],
      },
    ],
    sitemap: 'https://splitvote.io/sitemap.xml',
    host: 'https://splitvote.io',
  }
}
