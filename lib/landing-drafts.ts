import { redis } from './redis'

const LANDING_DRAFTS_KEY = 'landing:drafts'
const MAX_LANDING_DRAFTS = 50

export type LandingDraftStatus = 'draft' | 'approved' | 'rejected'
export type LandingDraftRisk = 'low' | 'medium' | 'high'
export type LandingLocale = 'en' | 'it'

export interface LandingDraftTextPair {
  en: string
  it: string
}

export interface LandingDraftListPair {
  en: string[]
  it: string[]
}

export interface LandingDraftFaqPair {
  en: Array<{ q: string; a: string }>
  it: Array<{ q: string; a: string }>
}

export interface LandingDraftInput {
  slug: LandingDraftTextPair
  title: LandingDraftTextPair
  seoTitle: LandingDraftTextPair
  seoDescription: LandingDraftTextPair
  intro: LandingDraftTextPair
  keywords: LandingDraftListPair
  faq: LandingDraftFaqPair
  relatedDilemmaIds: string[]
  internalLinks: string[]
  risk: LandingDraftRisk
  notes: string[]
}

export interface LandingDraft extends LandingDraftInput {
  id: string
  status: LandingDraftStatus
  generatedAt: string
  approvedAt?: string
  rejectedAt?: string
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

function hasLocaleStrings(value: unknown): value is LandingDraftTextPair {
  if (!value || typeof value !== 'object') return false
  const v = value as Record<string, unknown>
  return isNonEmptyString(v.en) && isNonEmptyString(v.it)
}

function hasLocaleStringLists(value: unknown): value is LandingDraftListPair {
  if (!value || typeof value !== 'object') return false
  const v = value as Record<string, unknown>
  return Array.isArray(v.en) && v.en.every(isNonEmptyString)
    && Array.isArray(v.it) && v.it.every(isNonEmptyString)
}

function hasLocaleFaq(value: unknown): value is LandingDraftFaqPair {
  if (!value || typeof value !== 'object') return false
  const v = value as Record<string, unknown>
  return (['en', 'it'] as LandingLocale[]).every(locale =>
    Array.isArray(v[locale]) && (v[locale] as unknown[]).every(item => {
      if (!item || typeof item !== 'object') return false
      const row = item as Record<string, unknown>
      return isNonEmptyString(row.q) && isNonEmptyString(row.a)
    }),
  )
}

export function validateLandingDraftInput(value: unknown): LandingDraftInput | null {
  if (!value || typeof value !== 'object') return null
  const v = value as Record<string, unknown>

  if (!hasLocaleStrings(v.slug)
    || !hasLocaleStrings(v.title)
    || !hasLocaleStrings(v.seoTitle)
    || !hasLocaleStrings(v.seoDescription)
    || !hasLocaleStrings(v.intro)
    || !hasLocaleStringLists(v.keywords)
    || !hasLocaleFaq(v.faq)) {
    return null
  }

  if (!Array.isArray(v.relatedDilemmaIds) || !v.relatedDilemmaIds.every(isNonEmptyString)) return null
  if (!Array.isArray(v.internalLinks) || !v.internalLinks.every(isNonEmptyString)) return null
  if (!['low', 'medium', 'high'].includes(String(v.risk))) return null
  if (!Array.isArray(v.notes) || !v.notes.every(isNonEmptyString)) return null

  return {
    slug: v.slug,
    title: v.title,
    seoTitle: v.seoTitle,
    seoDescription: v.seoDescription,
    intro: v.intro,
    keywords: v.keywords,
    faq: v.faq,
    relatedDilemmaIds: v.relatedDilemmaIds,
    internalLinks: v.internalLinks,
    risk: v.risk as LandingDraftRisk,
    notes: v.notes,
  }
}

export async function getLandingDrafts(): Promise<LandingDraft[]> {
  try {
    const raw = await redis.get<LandingDraft[]>(LANDING_DRAFTS_KEY)
    return Array.isArray(raw) ? raw : []
  } catch {
    return []
  }
}

export async function saveLandingDraft(input: LandingDraftInput): Promise<string> {
  const suffix = Date.now().toString(36).slice(-5)
  const id = `landing-${input.slug.en.slice(0, 24).replace(/-+$/, '')}-${suffix}`

  const newDraft: LandingDraft = {
    ...input,
    id,
    status: 'draft',
    generatedAt: new Date().toISOString(),
  }

  const existing = await getLandingDrafts()
  const filtered = existing.filter(
    draft => !(draft.slug.en === input.slug.en && draft.status === 'draft'),
  )
  await redis.set(LANDING_DRAFTS_KEY, [newDraft, ...filtered].slice(0, MAX_LANDING_DRAFTS))
  return id
}

export async function approveLandingDraft(id: string): Promise<boolean> {
  const drafts = await getLandingDrafts()
  const idx = drafts.findIndex(draft => draft.id === id)
  if (idx === -1 || drafts[idx].status !== 'draft') return false
  drafts[idx] = { ...drafts[idx], status: 'approved', approvedAt: new Date().toISOString() }
  await redis.set(LANDING_DRAFTS_KEY, drafts)
  return true
}

export async function rejectLandingDraft(id: string): Promise<boolean> {
  const drafts = await getLandingDrafts()
  const idx = drafts.findIndex(draft => draft.id === id)
  if (idx === -1 || drafts[idx].status !== 'draft') return false
  drafts[idx] = { ...drafts[idx], status: 'rejected', rejectedAt: new Date().toISOString() }
  await redis.set(LANDING_DRAFTS_KEY, drafts)
  return true
}
