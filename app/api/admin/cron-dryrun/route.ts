/**
 * /api/admin/cron-dryrun — Admin-only endpoint for triggering a cron dry-run.
 * Requires logged-in admin. Calls /api/cron/generate-dilemmas?dry=1 server-side
 * with the CRON_SECRET so the key never reaches the client.
 *
 * Usage: GET /api/admin/cron-dryrun?locale=en|it
 * Returns: JSON with generated dilemmas (not saved to Redis)
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { isAdminEmail } from '@/lib/admin-auth'

export async function GET(request: NextRequest) {
  // 1. Verify admin session
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || !isAdminEmail(user.email)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 2. Read locale param
  const locale = request.nextUrl.searchParams.get('locale') ?? 'en'
  if (!['en', 'it'].includes(locale)) {
    return NextResponse.json({ error: 'locale must be en or it' }, { status: 400 })
  }

  // 3. Call cron endpoint server-side with the secret (never exposed to client)
  const cronSecret = process.env.CRON_SECRET
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://splitvote.io'
  const cronUrl = `${baseUrl}/api/cron/generate-dilemmas?locale=${locale}&dry=1`

  try {
    const res = await fetch(cronUrl, {
      headers: cronSecret
        ? { 'x-cron-secret': cronSecret, authorization: `Bearer ${cronSecret}` }
        : {},
      cache: 'no-store',
    })

    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch (err) {
    return NextResponse.json({ error: `Fetch failed: ${String(err)}` }, { status: 500 })
  }
}
