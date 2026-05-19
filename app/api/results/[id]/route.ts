import { NextRequest, NextResponse } from 'next/server'
import { getVotes } from '@/lib/redis'
import { getScenario } from '@/lib/scenarios'

// Aggregate vote counts only — no per-user data, no cookies, no auth.
// Vercel/CDN can safely serve a short-lived shared cache, with SWR to keep
// p95 latency steady through Redis blips. 15 s shared TTL is finer than
// human perception of "live" splits and matches the results-page ISR window.
const CACHE_CONTROL = 'public, s-maxage=15, stale-while-revalidate=45'

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    if (!getScenario(params.id)) {
      return NextResponse.json({ error: 'Scenario not found' }, { status: 404 })
    }
    const votes = await getVotes(params.id)
    const total = votes.a + votes.b
    const pctA = total > 0 ? Math.round((votes.a / total) * 100) : 50
    const pctB = total > 0 ? Math.round((votes.b / total) * 100) : 50
    return NextResponse.json(
      { votes, total, pctA, pctB },
      { headers: { 'Cache-Control': CACHE_CONTROL } },
    )
  } catch (err) {
    console.error('[results]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
