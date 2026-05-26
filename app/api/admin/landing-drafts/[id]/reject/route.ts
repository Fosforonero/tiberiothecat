import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-guard'
import { rejectLandingDraft } from '@/lib/landing-drafts'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  const auth = await requireAdmin()
  if (auth instanceof NextResponse) return auth

  const ok = await rejectLandingDraft(params.id)
  if (!ok) {
    return NextResponse.json({ error: 'Draft not found or not in draft status' }, { status: 404 })
  }

  return NextResponse.json({ ok: true, id: params.id, status: 'rejected' })
}
