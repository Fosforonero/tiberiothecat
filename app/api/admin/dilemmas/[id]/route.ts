/**
 * PATCH /api/admin/dilemmas/[id]
 * Patch text fields on an approved dynamic scenario in Redis. Admin-only.
 * Allowed fields: question, optionA, optionB, seoTitle, seoDescription
 */

import { NextRequest, NextResponse } from 'next/server'
import { patchApprovedScenario } from '@/lib/dynamic-scenarios'
import { requireAdmin } from '@/lib/admin-guard'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const ID_PATTERN = /^[a-z0-9-]{1,120}$/
const CONTROL_CHAR_RE = /[\x00-\x1f\x7f]/

const FIELD_LIMITS: Record<string, number> = {
  question:       500,
  optionA:        220,
  optionB:        220,
  seoTitle:        80,
  seoDescription: 180,
}
const PATCHABLE = new Set(Object.keys(FIELD_LIMITS))

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  if (!ID_PATTERN.test(params.id)) {
    return NextResponse.json({ error: 'Invalid scenario id' }, { status: 400 })
  }

  const auth = await requireAdmin()
  if (auth instanceof NextResponse) return auth

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const patch: Record<string, string> = {}
  for (const [key, val] of Object.entries(body)) {
    if (!PATCHABLE.has(key)) continue
    if (typeof val !== 'string') continue
    const trimmed = val.trim()
    if (trimmed.length === 0) continue
    if (CONTROL_CHAR_RE.test(trimmed)) {
      return NextResponse.json({ error: `Field '${key}' contains control characters` }, { status: 400 })
    }
    const max = FIELD_LIMITS[key]!
    if (trimmed.length > max) {
      return NextResponse.json({ error: `Field '${key}' exceeds ${max} characters` }, { status: 400 })
    }
    patch[key] = trimmed
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: 'No valid patchable fields provided' }, { status: 400 })
  }

  const ok = await patchApprovedScenario(params.id, patch as Parameters<typeof patchApprovedScenario>[1])
  if (!ok) {
    return NextResponse.json({ error: 'Scenario not found in approved pool' }, { status: 404 })
  }

  return NextResponse.json({ ok: true, id: params.id, patched: Object.keys(patch) })
}
