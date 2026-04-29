import { NextResponse } from 'next/server'
import { buildContentInventory, type ContentItem } from '@/lib/content-inventory'
import { scoreNovelty } from '@/lib/content-dedup'
import { requireAdmin } from '@/lib/admin-guard'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const auth = await requireAdmin()
  if (auth instanceof NextResponse) return auth

  const inventory = await buildContentInventory()

  const counts = {
    total: inventory.length,
    byType: countBy(inventory, 'type'),
    byLocale: countBy(inventory, 'locale'),
    byStatus: countBy(inventory, 'status'),
    bySource: countBy(inventory, 'source'),
  }

  const draftItems = inventory.filter(item => item.status === 'draft')
  const sampleDuplicates = draftItems
    .map(draft => {
      const others = inventory.filter(i => i.id !== draft.id)
      const result = scoreNovelty(
        {
          id: draft.id,
          type: draft.type,
          locale: draft.locale,
          title: draft.title,
          category: draft.category,
          keywords: draft.keywords,
          searchableText: draft.searchableText,
        },
        others,
      )
      return { id: draft.id, title: draft.title.slice(0, 80), ...result }
    })
    .filter(r => r.noveltyScore < 70 || r.warnings.length > 0)
    .slice(0, 10)

  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    counts,
    sampleDuplicates,
  })
}

function countBy<K extends keyof ContentItem>(
  arr: ContentItem[],
  key: K,
): Record<string, number> {
  const result: Record<string, number> = {}
  for (const item of arr) {
    const val = String(item[key])
    result[val] = (result[val] ?? 0) + 1
  }
  return result
}
