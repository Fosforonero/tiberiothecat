import { scenarios } from './scenarios'
import { IT_SCENARIO_TRANSLATIONS } from './scenarios-it'
import { getDynamicScenarios, getDraftScenarios } from './dynamic-scenarios'
import { getBlogDrafts } from './blog-drafts'
import { allPosts } from './blog'

export type ContentItemType = 'dilemma' | 'blog_article'
export type ContentItemStatus = 'static' | 'approved' | 'draft'
export type ContentLocale = 'en' | 'it'

export interface ContentItem {
  id: string
  type: ContentItemType
  locale: ContentLocale
  title: string
  slug: string
  category: string
  keywords: string[]
  status: ContentItemStatus
  source: string
  searchableText: string
}

export async function buildContentInventory(): Promise<ContentItem[]> {
  const items: ContentItem[] = []

  for (const s of scenarios) {
    items.push({
      id: s.id,
      type: 'dilemma',
      locale: 'en',
      title: s.question,
      slug: `/play/${s.id}`,
      category: s.category,
      keywords: [],
      status: 'static',
      source: 'static',
      searchableText: `${s.question} ${s.optionA} ${s.optionB}`.toLowerCase(),
    })
  }

  for (const [id, tr] of Object.entries(IT_SCENARIO_TRANSLATIONS)) {
    const base = scenarios.find(s => s.id === id)
    if (!base) continue
    items.push({
      id: `${id}:it`,
      type: 'dilemma',
      locale: 'it',
      title: tr.question,
      slug: `/it/play/${id}`,
      category: base.category,
      keywords: [],
      status: 'static',
      source: 'static',
      searchableText: `${tr.question} ${tr.optionA} ${tr.optionB}`.toLowerCase(),
    })
  }

  try {
    const [approved, drafts] = await Promise.all([
      getDynamicScenarios(),
      getDraftScenarios(),
    ])
    for (const s of approved) {
      items.push({
        id: s.id,
        type: 'dilemma',
        locale: s.locale === 'it' ? 'it' : 'en',
        title: s.question,
        slug: s.locale === 'it' ? `/it/play/${s.id}` : `/play/${s.id}`,
        category: s.category,
        keywords: s.keywords ?? [],
        status: 'approved',
        source: 'dynamic:approved',
        searchableText: [s.question, s.optionA, s.optionB, ...(s.keywords ?? []), s.seoTitle ?? ''].join(' ').toLowerCase(),
      })
    }
    for (const s of drafts) {
      items.push({
        id: s.id,
        type: 'dilemma',
        locale: s.locale === 'it' ? 'it' : 'en',
        title: s.question,
        slug: s.locale === 'it' ? `/it/play/${s.id}` : `/play/${s.id}`,
        category: s.category,
        keywords: s.keywords ?? [],
        status: 'draft',
        source: 'dynamic:draft',
        searchableText: [s.question, s.optionA, s.optionB, ...(s.keywords ?? []), s.seoTitle ?? ''].join(' ').toLowerCase(),
      })
    }
  } catch {
    // Redis unavailable — inventory continues with static content only
  }

  for (const post of allPosts) {
    items.push({
      id: `blog:${post.locale}:${post.slug}`,
      type: 'blog_article',
      locale: post.locale,
      title: post.title,
      slug: post.locale === 'it' ? `/it/blog/${post.slug}` : `/blog/${post.slug}`,
      category: 'blog',
      keywords: post.tags,
      status: 'static',
      source: `blog:${post.locale}`,
      searchableText: `${post.title} ${post.description} ${post.tags.join(' ')}`.toLowerCase(),
    })
  }

  try {
    const blogDrafts = await getBlogDrafts()
    for (const d of blogDrafts) {
      for (const article of [d.source, d.translation].filter(Boolean)) {
        if (!article) continue
        items.push({
          id: `blog:draft:${d.id}:${article.locale}`,
          type: 'blog_article',
          locale: article.locale,
          title: article.title,
          slug: article.locale === 'it' ? `/it/blog/${article.slug}` : `/blog/${article.slug}`,
          category: 'blog',
          keywords: article.keywords,
          status: d.status === 'approved' ? 'approved' : 'draft',
          source: 'blog:draft',
          searchableText: `${article.title} ${article.seoDescription} ${article.keywords.join(' ')}`.toLowerCase(),
        })
      }
    }
  } catch {
    // Redis unavailable — inventory continues without blog drafts
  }

  return items
}
