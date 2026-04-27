import { NextRequest, NextResponse } from 'next/server'
import { sendEmail } from '@/lib/email'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Only @splitvote.io addresses are accepted as test recipients — no open relay.
const ALLOWED_TO = new Set(['hello@splitvote.io', 'support@splitvote.io'])

export async function POST(request: NextRequest) {
  const testKey = process.env.EMAIL_TEST_KEY
  if (!testKey) {
    return NextResponse.json({ error: 'not_configured' }, { status: 503 })
  }

  const headerKey = request.headers.get('x-email-test-key')
  if (!headerKey || headerKey !== testKey) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  let to = 'hello@splitvote.io'
  try {
    const body = await request.json()
    if (typeof body?.to === 'string' && ALLOWED_TO.has(body.to)) {
      to = body.to
    }
  } catch {
    // Invalid or missing body — use default recipient
  }

  const result = await sendEmail({
    to,
    subject: 'SplitVote email test',
    html: '<p>Email delivery test from SplitVote. If you received this, Resend is configured correctly.</p>',
  })

  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 502 })
  }

  return NextResponse.json({ ok: true, id: result.id, to })
}
