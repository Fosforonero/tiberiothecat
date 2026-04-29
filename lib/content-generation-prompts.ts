export type GenerationType = 'dilemma' | 'blog_article'
export type GenerationLocale = 'en' | 'it'

export interface InventorySummary {
  totalDilemmas: number
  totalBlogArticles: number
  categories: string[]
  recentKeywords: string[]
  similarTitles: string[]
}

export interface PromptInput {
  type: GenerationType
  locale: GenerationLocale
  topic: string
  targetCategory?: string
  inventory: InventorySummary
  similarContentWarnings: string[]
}

const SAFETY_RULES = `
Safety and quality rules (strictly enforced — output will be rejected if violated):
- No medical, legal, financial, or psychological advice
- No hate speech, explicit sexual content, or content involving minors
- No real people names (living or dead), no personal data
- No dangerous instructions (weapons, drugs, self-harm triggers)
- No extreme clickbait or sensationalism
- No keyword stuffing — max 6 keywords, all topically relevant
- Both dilemma options must be morally nuanced — never "good vs evil"
- If topic touches psychology, ethics, or health: add a brief disclaimer in safetyNotes
- Content must be suitable for a general audience aged 16+
- Output ONLY valid JSON — no markdown fences, no explanation text
`

export function buildDilemmaPrompt(input: PromptInput): { system: string; prompt: string } {
  const { locale, topic, targetCategory, inventory, similarContentWarnings } = input
  const lang = locale === 'it' ? 'Italian' : 'English'

  const system = `You are a creative writer for SplitVote, a global platform for moral dilemma voting. \
Generate a single moral dilemma in ${lang} based on a given topic. \
Output ONLY valid JSON — no markdown, no code fences, no extra text.
${SAFETY_RULES}`

  const simWarning = similarContentWarnings.length > 0
    ? `\n⚠️ Similar content already exists — choose a different angle:\n${similarContentWarnings.map(w => `- ${w}`).join('\n')}\n`
    : ''

  const prompt = `Generate one moral dilemma in ${lang} about: "${topic}"
${simWarning}
Context:
- Existing categories: ${inventory.categories.join(', ')}
- Keywords already used (avoid duplicating): ${inventory.recentKeywords.slice(0, 15).join(', ')}
- Total existing dilemmas: ${inventory.totalDilemmas}

Requirements:
- Question: genuine moral conflict, no easy answer, max 2 sentences
- Both options represent different values, not good vs evil
- Each option: concise, max 1 sentence
- Novel angle — different from existing content
- Preferred category: ${targetCategory ?? 'any of the 8 listed'} (soft preference — use a different category if it fits the topic better)
- Category must be one of: morality, survival, loyalty, justice, freedom, technology, society, relationships

Output this exact JSON object (no other text):
{
  "type": "dilemma",
  "locale": "${locale}",
  "question": "...",
  "optionA": "...",
  "optionB": "...",
  "category": "morality|survival|loyalty|justice|freedom|technology|society|relationships",
  "seoTitle": "...",
  "seoDescription": "...",
  "keywords": ["...", "..."],
  "rationale": "One sentence: why this dilemma is novel and engaging",
  "safetyNotes": []
}`

  return { system, prompt }
}

export function buildBlogArticlePrompt(input: PromptInput): { system: string; prompt: string } {
  const { locale, topic, inventory, similarContentWarnings } = input
  const lang = locale === 'it' ? 'Italian' : 'English'
  const disclaimer = locale === 'it'
    ? 'Contenuto educativo, non consulenza professionale.'
    : 'Educational content, not professional advice.'

  const system = `You are a content writer for SplitVote, a global platform for moral dilemma voting. \
Write a short SEO blog article in ${lang} about the given topic. \
The article must be educational, engaging, and reference playable moral dilemmas. \
Output ONLY valid JSON — no markdown, no code fences, no extra text.
${SAFETY_RULES}`

  const simWarning = similarContentWarnings.length > 0
    ? `\n⚠️ Similar content already exists — do not duplicate:\n${similarContentWarnings.map(w => `- ${w}`).join('\n')}\n`
    : ''

  const commonDilemmaIds = 'trolley, organ-harvest, cure-secret, memory-erase, steal-medicine, mercy-kill, whistleblower, robot-judge, self-driving-crash, brain-upload'

  const prompt = `Write a short SEO blog article in ${lang} about: "${topic}"
${simWarning}
Context:
- Existing blog articles (do not duplicate): ${inventory.similarTitles.slice(0, 8).join('; ')}
- Total existing blog articles: ${inventory.totalBlogArticles}
- Common playable dilemma IDs to reference: ${commonDilemmaIds}

Requirements:
- 400–700 words, educational tone
- Must include this disclaimer verbatim: "${disclaimer}"
- No first-person ("I"), no generic filler, no AI-generated feel
- Slug: URL-safe kebab-case, descriptive, max 60 chars
- Reference 2–4 related dilemma IDs from the list above

Output this exact JSON object (no other text):
{
  "type": "blog_article",
  "locale": "${locale}",
  "slug": "...",
  "title": "...",
  "seoTitle": "...",
  "seoDescription": "...",
  "keywords": ["...", "..."],
  "outline": ["Section heading 1", "..."],
  "body": "Full article text here...",
  "relatedDilemmaIds": ["trolley", "..."],
  "rationale": "One sentence: why this article is useful and novel",
  "safetyNotes": []
}`

  return { system, prompt }
}
