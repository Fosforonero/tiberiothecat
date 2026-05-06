import { NextRequest, NextResponse } from 'next/server'
import { approveDraftScenario, ApproveLockError } from '@/lib/dynamic-scenarios'
import type { DynamicScenario } from '@/lib/dynamic-scenarios'
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

  let scenario: DynamicScenario | null
  try {
    scenario = await approveDraftScenario(params.id)
  } catch (err) {
    if (err instanceof ApproveLockError) {
      return NextResponse.json(
        { error: 'approve_in_progress', retryable: true, message: 'Another approval is in progress. Retry in a few seconds.' },
        { status: 503 },
      )
    }
    console.error('[approve/route] Unexpected error during approveDraftScenario:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }

  if (!scenario) {
    return NextResponse.json({ error: 'Draft not found' }, { status: 404 })
  }

  revalidateTag('dynamic-scenarios')
  revalidateTag('dynamic-scenarios-by-locale')
  revalidatePath('/')
  revalidatePath('/it')
  revalidatePath('/trending')
  revalidatePath('/it/trending')
  revalidatePath(`/category/${scenario.category}`)
  revalidatePath(`/it/category/${scenario.category}`)

  return NextResponse.json({ ok: true, id: params.id, status: 'approved' })
}
