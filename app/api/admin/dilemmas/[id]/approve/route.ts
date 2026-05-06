import { NextRequest, NextResponse } from 'next/server'
import { approveDraftScenario } from '@/lib/dynamic-scenarios'
import { requireAdmin } from '@/lib/admin-guard'
import { revalidateTag, revalidatePath } from 'next/cache'

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

  revalidateTag('dynamic-scenarios')
  revalidateTag('dynamic-scenarios-by-locale')
  revalidatePath('/')
  revalidatePath('/it')
  revalidatePath('/trending')
  revalidatePath('/it/trending')

  return NextResponse.json({ ok: true, id: params.id, status: 'approved' })
}
