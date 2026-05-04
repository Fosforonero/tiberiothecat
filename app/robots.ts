import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/api/cron/',
          '/admin/',
          '/dashboard',
          '/profile',
          '/submit-poll',
          '/reset-password',
          '/offline',
          '/u/',
        ],
      },
    ],
    sitemap: 'https://splitvote.io/sitemap.xml',
    host: 'https://splitvote.io',
  }
}
