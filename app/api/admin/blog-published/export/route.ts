import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-guard'
import { getPublishedBlogDrafts } from '@/lib/blog-published'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const auth = await requireAdmin()
  if (auth instanceof NextResponse) return auth

  const drafts = await getPublishedBlogDrafts()

  const payload = {
    exportedAt: new Date().toISOString(),
    count: drafts.length,
    drafts,
  }

  return new NextResponse(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="blog-published-${new Date().toISOString().slice(0, 10)}.json"`,
    },
  })
}
