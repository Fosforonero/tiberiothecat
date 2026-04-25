import { NextRequest, NextResponse } from 'next/server'
import { getVotes } from '@/lib/redis'
import { getScenario } from '@/lib/scenarios'

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
    return NextResponse.json({ votes, total, pctA, pctB })
  } catch (err) {
    console.error('[results]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
