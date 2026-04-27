import type { Category } from './scenarios'
import type { TrendSource } from './dynamic-scenarios'

export type DraftStatus = 'draft' | 'approved' | 'rejected'
export type DraftType = 'dilemma' | 'blog_article' | 'quest'
export type DraftLocale = 'en' | 'it'

export interface DraftScores {
  viralScore: number
  seoScore: number
  noveltyScore: number
  feedbackScore: number
  finalScore: number
}

export interface ContentDraft {
  id: string
  type: DraftType
  locale: DraftLocale
  status: DraftStatus
  title: string
  seoTitle: string
  seoDescription: string
  keywords: string[]
  category: string
  generatedAt: string
  sourceTrend?: string
  trendSource?: TrendSource
  scores?: Partial<DraftScores>
  warnings?: string[]
  relatedContent?: string[]
  reviewedAt?: string
  reviewedBy?: string
  rejectionReason?: string
}

export interface DilemmaDraft extends ContentDraft {
  type: 'dilemma'
  question: string
  optionA: string
  optionB: string
  emoji: string
  dilemmaCategory: Category
  trendUrl?: string
}

export interface BlogArticleDraft extends ContentDraft {
  type: 'blog_article'
  description: string
  slug: string
  readingTime?: number
  tags: string[]
  relatedDilemmaIds: string[]
  // Section headings only — full body generated only after admin approves outline
  contentOutline?: string[]
}

// Quest publication rules (enforced before any public route is added):
// - dilemmaIds.length >= 3
// - All dilemmaIds must resolve to static or dynamic:approved dilemmas
// - Only admin-approved QuestDraft entries appear in sitemap
// - Rewards / achievements handled in a future store sprint
export interface QuestDraft extends ContentDraft {
  type: 'quest'
  description: string
  theme: string
  dilemmaIds: string[]
  targetCount: number
  rewardSuggestion?: string
  shareText?: string
  completionText?: string
}
