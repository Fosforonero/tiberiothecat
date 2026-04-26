import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const ADMIN_EMAILS = ['mat.pizzi@gmail.com']

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || !ADMIN_EMAILS.includes(user.email ?? '')) {
    return NextResponse.redirect(new URL('/', _req.url))
  }

  const admin = createAdminClient()
  await admin.from('user_polls').update({ status: 'rejected' }).eq('id', params.id)

  return NextResponse.redirect(new URL('/admin', _req.url))
}
