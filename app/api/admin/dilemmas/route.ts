/**
 * GET /api/admin/dilemmas
 * Lists AI-generated dilemmas from Redis. Admin-only.
 *
 * Query params:
 *   ?status=approved|draft|all  (default: all)
 *   ?locale=en|it               (default: all)
 *   ?limit=N                    (default: 30, max: 60)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getDynamicScenarios, getDraftScenarios } from '@/lib/dynamic-scenarios'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { isAdminEmail } from '@/lib/admin-auth'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email || !isAdminEmail(user.email)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const statusParam = request.nextUrl.searchParams.get('status') ?? 'all'
  const locale      = request.nextUrl.searchParams.get('locale') as 'en' | 'it' | null
  const limitParam  = parseInt(request.nextUrl.searchParams.get('limit') ?? '30', 10)
  const limit       = Math.min(Math.max(1, isNaN(limitParam) ? 30 : limitParam), 60)

  try {
    const [approved, drafts] = await Promise.all([
      getDynamicScenarios(),
      getDraftScenarios(),
    ])

    let scenarios = statusParam === 'draft'
      ? drafts
      : statusParam === 'approved'
        ? approved
        : [...drafts, ...approved]

    if (locale) scenarios = scenarios.filter(s => s.locale === locale)

    const results = scenarios.slice(0, limit).map(s => ({
      id:             s.id,
      locale:         s.locale,
      status:         s.status ?? 'approved',
      generatedAt:    s.generatedAt,
      trend:          s.trend,
      trendSource:    s.trendSource ?? null,
      question:       s.question,
      optionA:        s.optionA,
      optionB:        s.optionB,
      emoji:          s.emoji,
      category:       s.category,
      seoTitle:          s.seoTitle ?? null,
      seoDescription:    s.seoDescription ?? null,
      keywords:          s.keywords ?? [],
      noveltyScore:      s.scores?.noveltyScore,
      autoPublished:     s.autoPublished ?? false,
      qualityGateScore:  s.qualityGateScore,
      generatedBy:       s.generatedBy ?? null,
    }))

    return NextResponse.json({
      total:    scenarios.length,
      showing:  results.length,
      approved: approved.length,
      drafts:   drafts.length,
      locale:   locale ?? 'all',
      results,
    })
  } catch (err) {
    console.error('[admin/dilemmas]', err)
    return NextResponse.json({ error: 'Failed to fetch dilemmas' }, { status: 500 })
  }
}
