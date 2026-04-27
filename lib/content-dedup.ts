import type { ContentItem } from './content-inventory'

function normalize(text: string): string {
  return text.toLowerCase().replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim()
}

function tokenize(text: string): Set<string> {
  return new Set(normalize(text).split(' ').filter(w => w.length > 3))
}

function jaccardSimilarity(a: string, b: string): number {
  const sa = tokenize(a)
  const sb = tokenize(b)
  const intersection = [...sa].filter(x => sb.has(x)).length
  const union = new Set([...sa, ...sb]).size
  return union === 0 ? 0 : intersection / union
}

export interface SimilarItem {
  id: string
  title: string
  type: ContentItem['type']
  locale: ContentItem['locale']
  status: ContentItem['status']
  similarity: number
  reason: string
}

export interface NoveltyResult {
  noveltyScore: number
  similarItems: SimilarItem[]
  warnings: string[]
}

export interface ContentCandidate {
  id?: string
  type: ContentItem['type']
  locale: ContentItem['locale']
  title: string
  category?: string
  keywords?: string[]
  searchableText?: string
}

const TEXT_SIMILARITY_THRESHOLD = 0.4
const KEYWORD_OVERLAP_THRESHOLD = 0.5

export function findSimilarContent(
  candidate: ContentCandidate,
  inventory: ContentItem[],
): SimilarItem[] {
  const similar: SimilarItem[] = []
  const candidateText = candidate.searchableText ?? candidate.title

  for (const item of inventory) {
    if (candidate.id && item.id === candidate.id) continue

    const reasons: string[] = []

    const titleSim = jaccardSimilarity(candidate.title, item.title)
    if (titleSim >= TEXT_SIMILARITY_THRESHOLD) {
      reasons.push(`title_similarity:${titleSim.toFixed(2)}`)
    }

    const textSim = jaccardSimilarity(candidateText, item.searchableText)
    if (textSim >= TEXT_SIMILARITY_THRESHOLD) {
      reasons.push(`text_similarity:${textSim.toFixed(2)}`)
    }

    if (candidate.category && item.category === candidate.category && candidate.keywords?.length) {
      const kwSim = jaccardSimilarity(candidate.keywords.join(' '), item.keywords.join(' '))
      if (kwSim >= KEYWORD_OVERLAP_THRESHOLD) {
        reasons.push(`keyword_overlap:${kwSim.toFixed(2)}`)
      }
    }

    if (reasons.length > 0) {
      similar.push({
        id: item.id,
        title: item.title,
        type: item.type,
        locale: item.locale,
        status: item.status,
        similarity: Math.round(Math.max(titleSim, textSim) * 100),
        reason: reasons.join('; '),
      })
    }
  }

  return similar.sort((a, b) => b.similarity - a.similarity)
}

export function scoreNovelty(
  candidate: ContentCandidate,
  inventory: ContentItem[],
): NoveltyResult {
  const similarItems = findSimilarContent(candidate, inventory)
  const warnings: string[] = []

  const maxSimilarity = similarItems[0]?.similarity ?? 0
  let noveltyScore = 100 - maxSimilarity

  const idDuplicate = candidate.id != null && inventory.some(i => i.id === candidate.id)
  if (idDuplicate) {
    noveltyScore = 0
    warnings.push('id_already_exists')
  }

  const nearDuplicates = similarItems.filter(s => s.similarity >= 70)
  if (nearDuplicates.length > 0) {
    warnings.push(`near_duplicate_found:${nearDuplicates.length}`)
  }

  const sameLocaleConflicts = similarItems.filter(s => s.locale === candidate.locale && s.similarity >= 50)
  if (sameLocaleConflicts.length >= 3) {
    warnings.push('category_saturation')
    noveltyScore = Math.max(0, noveltyScore - 10)
  }

  return {
    noveltyScore: Math.max(0, Math.min(100, Math.round(noveltyScore))),
    similarItems: similarItems.slice(0, 5),
    warnings,
  }
}
