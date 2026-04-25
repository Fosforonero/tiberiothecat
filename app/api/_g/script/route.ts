/**
 * First-party proxy for gtag.js
 * Serves the Google Analytics script from our own domain → bypasses adblock URL filters
 * Route: /api/_g/script?id=G-XXXXXXX
 */
import { NextRequest } from 'next/server'

export const runtime = 'edge'

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get('id') || 'G-5MPQ8PW0CE'

  try {
    const res = await fetch(
      `https://www.googletagmanager.com/gtag/js?id=${id}`,
      {
        headers: {
          'User-Agent': request.headers.get('user-agent') || 'Mozilla/5.0',
          'Accept-Encoding': 'gzip, deflate, br',
        },
        // Edge cache 1h
        // @ts-expect-error next.revalidate is Edge-specific
        next: { revalidate: 3600 },
      }
    )

    if (!res.ok) return new Response('', { status: 204 })

    const body = await res.text()

    return new Response(body, {
      headers: {
        'Content-Type': 'application/javascript; charset=UTF-8',
        'Cache-Control': 'public, max-age=3600, stale-while-revalidate=7200',
        'X-Content-Type-Options': 'nosniff',
      },
    })
  } catch {
    return new Response('', { status: 204 })
  }
}
