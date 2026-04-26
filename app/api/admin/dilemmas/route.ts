/**
 * GET /api/admin/dilemmas
 * Debug endpoint — lists AI-generated dilemmas stored in Redis.
 * Admin-only (same ADMIN_EMAILS whitelist as admin page).
 *
 * Query params:
 *   ?locale=en|it   — filter by locale (default: all)
 *   ?limit=N        — max results (default: 30, max: 60)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getDynamicScenarios, getDynamicScenariosByLocale } from '@/lib/dynamic-scenarios'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const ADMIN_EMAILS = ['mat.pizzi@gmail.com']

export async function GET(request: NextRequest) {
  // Auth check
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user?.email || !ADMIN_EMAILS.includes(user.email)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const locale = request.nextUrl.searchParams.get('locale') as 'en' | 'it' | null
  const limitParam = parseInt(request.nextUrl.searchParams.get('limit') ?? '30', 10)
  const limit = Math.min(Math.max(1, isNaN(limitParam) ? 30 : limitParam), 60)

  try {
    const scenarios = locale
      ? await getDynamicScenariosByLocale(locale)
      : await getDynamicScenarios()

    const results = scenarios.slice(0, limit).map((s) => ({
      id:             s.id,
      locale:         s.locale,
      generatedAt:    s.generatedAt,
      trend:          s.trend,
      question:       s.question,
      optionA:        s.optionA,
      optionB:        s.optionB,
      emoji:          s.emoji,
      category:       s.category,
      seoTitle:       s.seoTitle ?? null,
      seoDescription: s.seoDescription ?? null,
      keywords:       s.keywords ?? [],
    }))

    return NextResponse.json({
      total:   scenarios.length,
      showing: results.length,
      locale:  locale ?? 'all',
      results,
    })
  } catch (err) {
    console.error('[admin/dilemmas]', err)
    return NextResponse.json({ error: 'Failed to fetch dilemmas' }, { status: 500 })
  }
}
