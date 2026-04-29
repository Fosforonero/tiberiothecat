import { NextRequest, NextResponse } from 'next/server'
import { approveDraftScenario } from '@/lib/dynamic-scenarios'
import { requireAdmin } from '@/lib/admin-guard'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const auth = await requireAdmin()
  if (auth instanceof NextResponse) return auth

  const ok = await approveDraftScenario(params.id)
  if (!ok) {
    return NextResponse.json({ error: 'Draft not found' }, { status: 404 })
  }
  return NextResponse.json({ ok: true, id: params.id, status: 'approved' })
}
