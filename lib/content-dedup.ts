import type { ContentItem } from './content-inventory'

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
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

// ── Moral archetype detection ──────────────────────────────────

export const MORAL_ARCHETYPES: Array<{
  id: string
  label: string
  keywords: string[]
  strongKeywords?: string[]
}> = [
  {
    id: 'sacrifice_minority',
    label: 'sacrifice one to save many',
    keywords: [
      'sacrifice', 'organ', 'parachute', 'lifeboat', 'overboard', 'divert',
      'sacrificare', 'organi', 'paracadute', 'scialuppa', 'sacrificio', 'deviare',
    ],
    strongKeywords: ['trolley', 'organ harvest'],
  },
  {
    id: 'loyalty_vs_justice',
    label: 'loyalty vs justice — report or protect',
    keywords: [
      'report', 'police', 'crime', 'cover', 'betray', 'criminal', 'whistleblower', 'arrest',
      'denunciare', 'polizia', 'crimine', 'coprire', 'tradire', 'criminale', 'arrestare',
    ],
  },
  {
    id: 'truth_vs_kindness',
    label: 'truth vs kindness — white lie or confession',
    keywords: [
      'honest', 'deceive', 'cheat', 'affair', 'confess', 'admit',
      'bugia', 'onesta', 'ingannare', 'tradimento', 'confessare', 'ammettere',
    ],
    strongKeywords: ['white lie', 'dire la verita', 'tell the truth'],
  },
  {
    id: 'autonomy_vs_mandate',
    label: 'individual rights vs collective mandate',
    keywords: [
      'mandatory', 'compulsory', 'restrict', 'regulate', 'mandate',
      'obbligatorio', 'obbligatoria', 'coercitivo', 'vietare', 'regolamentare',
    ],
    strongKeywords: ['forced vaccination', 'vaccinazione obbligatoria'],
  },
  {
    id: 'ai_surveillance',
    label: 'AI surveillance or algorithmic control',
    keywords: [
      'algorithm', 'surveillance', 'biometric', 'deepfake', 'automated',
      'algoritmo', 'sorveglianza', 'biometrico', 'automatizzato',
    ],
    strongKeywords: ['facial recognition', 'riconoscimento facciale', 'predictive policing'],
  },
  {
    id: 'end_of_life',
    label: 'end of life — euthanasia or assisted dying',
    keywords: [
      'terminal', 'mercy', 'suffering', 'lethal', 'palliative', 'dying',
      'terminale', 'sofferenza', 'letale', 'palliativo', 'morente',
    ],
    strongKeywords: ['euthanasia', 'eutanasia', 'assisted dying', 'morte assistita'],
  },
  {
    id: 'wealth_inequality',
    label: 'wealth redistribution or taxation',
    keywords: [
      'billionaire', 'wealth', 'inequality', 'redistribute', 'fortune',
      'miliardario', 'ricchezza', 'disuguaglianza', 'redistribuire', 'fortuna',
    ],
    strongKeywords: ['universal basic income', 'reddito universale', 'wealth tax'],
  },
  {
    id: 'love_vs_duty',
    label: 'love vs career or romantic sacrifice',
    keywords: [
      'career', 'relocate', 'relationship', 'caregiver', 'marriage',
      'carriera', 'relazione', 'badante', 'matrimonio', 'rinunciare',
    ],
    strongKeywords: ['give up career', 'rinunciare alla carriera', 'loveless marriage', 'matrimonio senza amore'],
  },
  {
    id: 'identity_modification',
    label: 'consciousness — memory or identity change',
    keywords: [
      'consciousness', 'upload', 'erase', 'simulate', 'clone', 'implant',
      'coscienza', 'caricare', 'cancellare', 'simulare', 'clonare', 'impianto',
    ],
    strongKeywords: ['neural implant', 'chip neurale', 'digital immortality'],
  },
  {
    id: 'resource_scarcity',
    label: 'medical or resource scarcity allocation',
    keywords: [
      'triage', 'transplant', 'allocation', 'shortage',
      'trapianto', 'allocazione', 'carenza', 'scarsita',
    ],
    strongKeywords: ['last vaccine', 'ultimo vaccino', 'organ transplant'],
  },
]

export function detectMoralArchetypes(text: string): string[] {
  const lower = normalize(text)
  const matched: string[] = []
  for (const a of MORAL_ARCHETYPES) {
    const hits = a.keywords.filter(kw => lower.includes(normalize(kw))).length
    const strongHit = (a.strongKeywords ?? []).some(kw => lower.includes(normalize(kw)))
    if (strongHit || hits >= 2) matched.push(a.id)
  }
  return matched
}

export function getArchetypeSaturation(inventory: ContentItem[]): Map<string, number> {
  const counts = new Map<string, number>(MORAL_ARCHETYPES.map(a => [a.id, 0]))
  for (const item of inventory.filter(i => i.type === 'dilemma')) {
    for (const id of detectMoralArchetypes(item.searchableText)) {
      counts.set(id, (counts.get(id) ?? 0) + 1)
    }
  }
  return counts
}
