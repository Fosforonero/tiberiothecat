import { redis } from './redis'
import type { ValidatedBlogArticle } from './content-generation-validate'

const BLOG_DRAFTS_KEY = 'blog:drafts'
const MAX_BLOG_DRAFTS = 50

export type BlogDraftStatus = 'draft' | 'approved' | 'rejected'

export interface BlogDraft {
  id: string
  status: BlogDraftStatus
  generatedAt: string
  approvedAt?: string
  rejectedAt?: string
  topic: string
  source: ValidatedBlogArticle
  translation: ValidatedBlogArticle | null
  translationFailed: boolean
}

export async function getBlogDrafts(): Promise<BlogDraft[]> {
  try {
    const raw = await redis.get<BlogDraft[]>(BLOG_DRAFTS_KEY)
    return Array.isArray(raw) ? raw : []
  } catch {
    return []
  }
}

export async function saveBlogDraft(
  input: Pick<BlogDraft, 'topic' | 'source' | 'translation' | 'translationFailed'>,
): Promise<string> {
  const { source } = input
  const suffix = Date.now().toString(36).slice(-5)
  const id = `blog-${source.locale}-${source.slug.slice(0, 20).replace(/-+$/, '')}-${suffix}`

  const newDraft: BlogDraft = {
    ...input,
    id,
    status: 'draft',
    generatedAt: new Date().toISOString(),
  }

  const existing = await getBlogDrafts()
  // Replace if the same slug already exists as draft (retry dedup)
  const filtered = existing.filter(
    d => !(d.source.slug === source.slug && d.status === 'draft'),
  )
  await redis.set(BLOG_DRAFTS_KEY, [newDraft, ...filtered].slice(0, MAX_BLOG_DRAFTS))
  return id
}

export async function approveBlogDraft(id: string): Promise<boolean> {
  const drafts = await getBlogDrafts()
  const idx = drafts.findIndex(d => d.id === id)
  if (idx === -1 || drafts[idx].status !== 'draft') return false
  drafts[idx] = { ...drafts[idx], status: 'approved', approvedAt: new Date().toISOString() }
  await redis.set(BLOG_DRAFTS_KEY, drafts)
  return true
}

export async function rejectBlogDraft(id: string): Promise<boolean> {
  const drafts = await getBlogDrafts()
  const idx = drafts.findIndex(d => d.id === id)
  if (idx === -1 || drafts[idx].status !== 'draft') return false
  drafts[idx] = { ...drafts[idx], status: 'rejected', rejectedAt: new Date().toISOString() }
  await redis.set(BLOG_DRAFTS_KEY, drafts)
  return true
}
