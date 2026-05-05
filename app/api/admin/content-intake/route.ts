/**
 * POST /api/admin/content-intake
 *
 * Phase 0 — Validation only. Accepts structured content signals
 * (trends, news, facts, sources) from Picoclaw or manual admin input.
 * Validates, normalises, and risk-flags each item. Returns a dry-run
 * report with suggested transformations.
 * No AI calls, no Redis/Supabase writes, dryRun always enforced.
 *
 * Auth (dual path — token checked first):
 *   1. CONTENT_INTAKE_TOKEN Bearer token — scoped to this endpoint only;
 *      distinct from AI_REQA_TOKEN; enabled when env var is set with ≥32 chars;
 *      verified with crypto.timingSafeEqual
 *   2. requireAdmin() Supabase session fallback
 *
 * Body: { source, locale, items[] }
 *   dryRun body field is ignored — always hardcoded true in Phase 0.
 *   Blocked fields (fullText, body, articleText, content) cause 422.
 */

import { NextRequest, NextResponse } from 'next/server'
import { timingSafeEqual } from 'crypto'
import { requireAdmin } from '@/lib/admin-guard'
import { validateIntakePayload } from '@/lib/content-intake-validate'

export const runtime     = 'nodejs'
export const dynamic     = 'force-dynamic'
export const maxDuration = 30

const BLOCKED_BODY_FIELDS = ['fullText', 'body', 'articleText', 'content'] as const

// ── Token auth ────────────────────────────────────────────────────────────────

function verifyToken(provided: string, expected: string): boolean {
  try {
    const a = Buffer.from(provided)
    const b = Buffer.from(expected)
    if (a.length !== b.length) return false
    return timingSafeEqual(a, b)
  } catch {
    return false
  }
}

async function authorize(request: NextRequest): Promise<{ ok: true } | NextResponse> {
  const envToken     = process.env.CONTENT_INTAKE_TOKEN
  const bearerActive = !!envToken && envToken.length >= 32
  const authHeader   = request.headers.get('authorization')

  if (bearerActive && authHeader?.startsWith('Bearer ')) {
    const provided = authHeader.slice(7)
    if (verifyToken(provided, envToken!)) return { ok: true }
    return NextResponse.json({ error: 'invalid_token' }, { status: 401 })
  }

  const admin = await requireAdmin()
  if (admin instanceof NextResponse) return admin
  return { ok: true }
}

// ── Handler ───────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const auth = await authorize(request)
  if (auth instanceof NextResponse) return auth

  let body: Record<string, unknown>
  try {
    const parsed = await request.json()
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      return NextResponse.json(
        { error: 'invalid_body', message: 'body must be a JSON object' },
        { status: 400 },
      )
    }
    body = parsed as Record<string, unknown>
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }

  for (const field of BLOCKED_BODY_FIELDS) {
    if (field in body) {
      return NextResponse.json(
        { error: 'blocked_field', field, message: `Field "${field}" is not accepted. Submit a summary only.` },
        { status: 422 },
      )
    }
  }

  const { source, locale, items } = body

  if (!['picoclaw', 'manual', 'other'].includes(source as string)) {
    return NextResponse.json(
      { error: 'invalid_source', valid: ['picoclaw', 'manual', 'other'] },
      { status: 422 },
    )
  }
  if (!['en', 'it'].includes(locale as string)) {
    return NextResponse.json(
      { error: 'invalid_locale', valid: ['en', 'it'] },
      { status: 422 },
    )
  }
  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json(
      { error: 'items_required', message: 'items must be a non-empty array' },
      { status: 422 },
    )
  }
  if (items.length > 20) {
    return NextResponse.json(
      { error: 'items_limit_exceeded', max: 20, received: items.length },
      { status: 422 },
    )
  }

  const { accepted, rejected } = validateIntakePayload(items)
  const flagged = accepted.filter(a => a.riskFlags.length > 0)

  return NextResponse.json({
    dryRunEnforced: true,
    source,
    locale,
    summary: {
      received: items.length,
      accepted: accepted.length,
      rejected: rejected.length,
      flagged:  flagged.length,
    },
    accepted: accepted.map(a => ({
      index:                   a.index,
      type:                    a.type,
      title:                   a.title,
      riskFlags:               a.riskFlags,
      suggestedTransformation: a.suggestedTransformation,
    })),
    rejected,
    flagged: flagged.map(a => ({
      index:     a.index,
      title:     a.title,
      riskFlags: a.riskFlags,
    })),
    meta: {
      aiUsed:            false,
      writtenToRedis:    false,
      writtenToSupabase: false,
      phasedMode:        'validation_only',
    },
  })
}
