/**
 * First-party proxy for GA4 measurement endpoint
 * GA4 sends hits to {transport_url}/g/collect — we forward to Google transparently.
 * Route: /api/_g/g/collect
 */
import { NextRequest } from 'next/server'

export const runtime = 'edge'

async function proxyCollect(request: NextRequest) {
  const target = new URL('https://www.google-analytics.com/g/collect')

  // Forward all query params (tid, cid, en, etc.)
  request.nextUrl.searchParams.forEach((v, k) => target.searchParams.set(k, v))

  const headers: Record<string, string> = {
    'User-Agent': request.headers.get('user-agent') || 'Mozilla/5.0',
    'Content-Type': 'application/x-www-form-urlencoded',
  }

  // Forward real IP so GA4 geo/session data stays accurate
  const ip =
    request.headers.get('x-real-ip') ||
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
  if (ip) headers['X-Forwarded-For'] = ip

  try {
    const body =
      request.method === 'POST' ? await request.text() : undefined

    const res = await fetch(target.toString(), {
      method: request.method,
      headers,
      body,
    })

    // GA4 collect always returns 204 — mirror that
    return new Response(null, { status: res.status })
  } catch {
    return new Response(null, { status: 204 })
  }
}

export const GET = proxyCollect
export const POST = proxyCollect
