import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-guard'
import { getBlogDrafts, saveBlogDraft } from '@/lib/blog-drafts'
import type { ValidatedBlogArticle } from '@/lib/content-generation-validate'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const auth = await requireAdmin()
  if (auth instanceof NextResponse) return auth

  const drafts = await getBlogDrafts()
  return NextResponse.json({ drafts })
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin()
  if (auth instanceof NextResponse) return auth

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'invalid_json_body' }, { status: 400 })
  }

  const { source, translation, topic, translationFailed } = body as Record<string, unknown>

  if (!source || typeof source !== 'object') {
    return NextResponse.json({ error: 'missing_source' }, { status: 400 })
  }
  const src = source as ValidatedBlogArticle
  if (!src.slug || !src.title || !src.body) {
    return NextResponse.json({ error: 'invalid_source_article' }, { status: 400 })
  }
  if (typeof topic !== 'string' || topic.trim().length < 3) {
    return NextResponse.json({ error: 'invalid_topic' }, { status: 400 })
  }

  try {
    const id = await saveBlogDraft({
      topic: topic.trim(),
      source: src,
      translation: (translation as ValidatedBlogArticle | null) ?? null,
      translationFailed: translationFailed === true,
    })
    return NextResponse.json({ ok: true, id })
  } catch {
    return NextResponse.json({ error: 'save_failed' }, { status: 500 })
  }
}
