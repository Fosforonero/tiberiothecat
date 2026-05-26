import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-guard'
import { getLandingDrafts, saveLandingDraft, validateLandingDraftInput } from '@/lib/landing-drafts'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const auth = await requireAdmin()
  if (auth instanceof NextResponse) return auth

  const drafts = await getLandingDrafts()
  return NextResponse.json({ drafts })
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin()
  if (auth instanceof NextResponse) return auth

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'invalid_json_body' }, { status: 400 })
  }

  const input = validateLandingDraftInput(body)
  if (!input) {
    return NextResponse.json({ error: 'invalid_landing_draft' }, { status: 400 })
  }

  try {
    const id = await saveLandingDraft(input)
    return NextResponse.json({ ok: true, id })
  } catch {
    return NextResponse.json({ error: 'save_failed' }, { status: 500 })
  }
}
