import { NextRequest, NextResponse } from 'next/server'
import { approveBlogDraft } from '@/lib/blog-drafts'
import { requireAdmin } from '@/lib/admin-guard'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const auth = await requireAdmin()
  if (auth instanceof NextResponse) return auth

  const ok = await approveBlogDraft(params.id)
  if (!ok) {
    return NextResponse.json({ error: 'Draft not found or not in draft status' }, { status: 404 })
  }
  return NextResponse.json({ ok: true, id: params.id, status: 'approved' })
}
