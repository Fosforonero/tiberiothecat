/**
 * First-party proxy for adsbygoogle.js
 * Serves the AdSense script from our domain → bypasses URL-based adblock rules
 * Route: /api/_g/ads?client=ca-pub-XXXXXXX
 */
import { NextRequest } from 'next/server'

export const runtime = 'edge'

export async function GET(request: NextRequest) {
  const client =
    request.nextUrl.searchParams.get('client') || 'ca-pub-5232020244793649'

  try {
    const res = await fetch(
      `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${client}`,
      {
        headers: {
          'User-Agent': request.headers.get('user-agent') || 'Mozilla/5.0',
          'Referer': 'https://splitvote.io/',
        },
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
