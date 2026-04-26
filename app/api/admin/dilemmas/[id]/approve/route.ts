import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { approveDraftScenario } from '@/lib/dynamic-scenarios'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const ADMIN_EMAILS = ['mat.pizzi@gmail.com']

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email || !ADMIN_EMAILS.includes(user.email)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const ok = await approveDraftScenario(params.id)
  if (!ok) {
    return NextResponse.json({ error: 'Draft not found' }, { status: 404 })
  }
  return NextResponse.json({ ok: true, id: params.id, status: 'approved' })
}
