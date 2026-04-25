import { NextRequest, NextResponse } from 'next/server'
import { incrementVote } from '@/lib/redis'
import { getScenario } from '@/lib/scenarios'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, option } = body

    if (!id || (option !== 'a' && option !== 'b')) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    if (!getScenario(id)) {
      return NextResponse.json({ error: 'Scenario not found' }, { status: 404 })
    }

    await incrementVote(id, option)
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[vote]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
