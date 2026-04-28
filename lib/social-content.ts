/** Social content types — used by the generate:social-content script and future app code. */

export type SocialPlatform = 'instagram' | 'tiktok'
export type SocialLocale = 'en' | 'it'
export type SocialPriority = 'high' | 'medium' | 'low'

export interface SocialContentItem {
  id: string
  sourceScenarioId: string
  locale: SocialLocale
  platform: SocialPlatform
  question: string
  optionA: string
  optionB: string
  category: string
  hook: string
  caption: string
  hashtags: string[]
  /** Clean play URL without UTM — backward compat, same as playUrl. */
  siteUrl: string
  storyCardUrl: string
  suggestedVisual: string
  createdAt: string

  // Phase 2: UTM tracking + operational publishing fields
  /** Direct play URL without UTM (e.g. https://splitvote.io/play/trolley). */
  playUrl?: string
  /** Results URL for the same dilemma (e.g. https://splitvote.io/results/trolley). */
  resultsUrl?: string
  /** Play URL with UTM params — use this for link-in-bio / story swipe-up / story link sticker. */
  utmUrl?: string
  /** UTM source value: 'tiktok' or 'instagram'. */
  utmSource?: string
  /** UTM campaign value, e.g. 'soft_launch'. */
  utmCampaign?: string
  /** Per-platform publishing steps (strings, rendered as checklist in Markdown output). */
  publishChecklist?: string[]
  /** Content priority for scheduling. 'high' = dynamic approved, 'medium' = static evergreen. */
  priority?: SocialPriority
}

export interface SocialContentBatch {
  generatedAt: string
  totalItems: number
  breakdown: {
    tiktok_en: number
    instagram_en: number
    tiktok_it: number
    instagram_it: number
  }
  items: SocialContentItem[]
}
