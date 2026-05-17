import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath, revalidateTag } from 'next/cache'
import { publishBlogDraft, getBlogDrafts } from '@/lib/blog-drafts'
import { requireAdmin } from '@/lib/admin-guard'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const auth = await requireAdmin()
  if (auth instanceof NextResponse) return auth

  const ok = await publishBlogDraft(params.id)
  if (!ok) {
    return NextResponse.json(
      { error: 'Draft not found or not in approved status' },
      { status: 404 },
    )
  }

  const drafts = await getBlogDrafts()
  const draft = drafts.find(d => d.id === params.id)
  const liveUrl = draft
    ? (draft.source.locale === 'it' ? `/it/blog/${draft.source.slug}` : `/blog/${draft.source.slug}`)
    : undefined
  const translationUrl = draft?.translation
    ? (draft.translation.locale === 'it' ? `/it/blog/${draft.translation.slug}` : `/blog/${draft.translation.slug}`)
    : undefined

  revalidateTag('blog-published')
  revalidatePath('/blog')
  revalidatePath('/it/blog')
  if (liveUrl) revalidatePath(liveUrl)
  if (translationUrl) revalidatePath(translationUrl)

  return NextResponse.json({ ok: true, id: params.id, status: 'published', liveUrl, translationUrl })
}
