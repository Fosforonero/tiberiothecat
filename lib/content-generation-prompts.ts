export type GenerationType = 'dilemma' | 'blog_article'
export type GenerationLocale = 'en' | 'it'
export type ArticleKind = 'standard' | 'cornerstone'

export interface InventorySummary {
  totalDilemmas: number
  totalBlogArticles: number
  categories: string[]
  recentKeywords: string[]
  similarTitles: string[]
  categoryCounts: Record<string, number>
  saturatedArchetypes: string[]
  existingQuestionsInCategory: string[]
}

export interface PromptInput {
  type: GenerationType
  locale: GenerationLocale
  topic: string
  targetCategory?: string
  inventory: InventorySummary
  similarContentWarnings: string[]
  articleKind?: ArticleKind
  angle?: string
  notes?: string
}

/** Minimal article shape needed to build a translation prompt — avoids cross-file import. */
export interface ArticleSourceForTranslation {
  locale: 'en' | 'it'
  title: string
  seoTitle: string
  seoDescription: string
  keywords: string[]
  outline: string[]
  body: string
  relatedDilemmaIds: string[]
  faq?: Array<{ q: string; a: string }>
  conclusion?: string
  internalLinks?: string[]
}

const SAFETY_RULES = `
Safety and quality rules (strictly enforced — output will be rejected if violated):
- No medical, legal, financial, or psychological advice
- No hate speech, explicit sexual content, or content involving minors
- No real people names (living or dead), no personal data, no company names as villains
- No dangerous instructions (weapons, drugs, self-harm triggers)
- No extreme clickbait or sensationalism
- No keyword stuffing — max 6 keywords, all topically relevant
- Both dilemma options must be morally nuanced — never "good vs evil"
- If topic touches psychology, ethics, or health: add a brief disclaimer in safetyNotes
- Content must be suitable for a general audience aged 16+
- No unverified factual claims about specific recent or ongoing events
- If based on a current events topic: abstract it into a universal moral dilemma — do not name specific people, cities, or incidents; mark as "inspired by topic", never "based on specific event"
- Output ONLY valid JSON — no markdown fences, no explanation text
`

export function buildDilemmaPrompt(input: PromptInput): { system: string; prompt: string } {
  const { locale, topic, targetCategory, inventory, similarContentWarnings, angle, notes } = input
  const lang = locale === 'it' ? 'Italian' : 'English'

  const system = `You are a creative writer for SplitVote, a global platform for moral dilemma voting. \
Generate a single moral dilemma in ${lang} based on a given topic. \
Output ONLY valid JSON — no markdown, no code fences, no extra text.
${SAFETY_RULES}`

  const simWarning = similarContentWarnings.length > 0
    ? `\n⚠️ Similar content already exists — choose a different angle:\n${similarContentWarnings.map(w => `- ${w}`).join('\n')}\n`
    : ''

  const catCountStr = Object.entries(inventory.categoryCounts)
    .map(([c, n]) => `${c}:${n}`)
    .join(', ')

  const satWarning = inventory.saturatedArchetypes.length > 0
    ? `\n- ⚠️ Saturated moral archetypes — avoid reusing: ${inventory.saturatedArchetypes.join('; ')}`
    : ''

  const qInCategory = inventory.existingQuestionsInCategory.length > 0
    ? `\n- Existing ${targetCategory ?? ''} questions (do not reuse same moral structure):\n${inventory.existingQuestionsInCategory.map(q => `  · "${q}"`).join('\n')}`
    : ''

  const angleHint = angle ? `\n- Preferred angle / perspective: ${angle}` : ''
  const notesHint = notes ? `\n- Context / notes: ${notes}` : ''

  const prompt = `Generate one moral dilemma in ${lang} about: "${topic}"${angleHint}${notesHint}
${simWarning}
Context:
- Dilemmas per category (${lang}): ${catCountStr}${satWarning}${qInCategory}
- Keywords already used (avoid duplicating): ${inventory.recentKeywords.slice(0, 15).join(', ')}
- Total existing dilemmas: ${inventory.totalDilemmas}

Requirements:
- Question: genuine moral conflict, no easy answer, max 2 sentences
- Both options represent different values, not good vs evil
- Each option: concise, max 1 sentence
- Novel angle — different from existing content
- Do not reproduce the same moral structure with different nouns or setting
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
  const { locale, topic, inventory, similarContentWarnings, articleKind = 'standard' } = input
  const isCornerstone = articleKind === 'cornerstone'
  const lang = locale === 'it' ? 'Italian' : 'English'
  const disclaimer = locale === 'it'
    ? 'Contenuto educativo, non consulenza professionale.'
    : 'Educational content, not professional advice.'

  const wordRange = isCornerstone ? '1200–1500 words' : '500–750 words'
  const kindLabel = isCornerstone ? 'comprehensive pillar' : 'concise SEO'

  const system = `You are a content writer for SplitVote, a global platform for moral dilemma voting. \
Write a ${kindLabel} blog article in ${lang} about the given topic. \
The article must be educational, engaging, and reference playable moral dilemmas. \
Output ONLY valid JSON — no markdown, no code fences, no extra text.
${SAFETY_RULES}`

  const simWarning = similarContentWarnings.length > 0
    ? `\n⚠️ Similar content already exists — do not duplicate:\n${similarContentWarnings.map(w => `- ${w}`).join('\n')}\n`
    : ''

  const commonDilemmaIds = 'trolley, organ-harvest, cure-secret, memory-erase, steal-medicine, mercy-kill, whistleblower, robot-judge, self-driving-crash, brain-upload'

  const outlineSpec = isCornerstone ? '5–8 section headings' : '3–5 section headings'
  const relatedSpec = isCornerstone ? '4–8 IDs' : '2–4 IDs'

  const cornerstoneFields = isCornerstone
    ? `  "faq": [{"q": "...", "a": "..."}, ...],
  "conclusion": "...",
  "internalLinks": ["/category/morality", "/play/trolley", ...],`
    : ''

  const cornerstoneReqs = isCornerstone
    ? `- Include a FAQ section with 3–5 questions and answers (faq field)
- Include a strong standalone conclusion paragraph (conclusion field)
- Suggest 2–4 internal links to SplitVote category/dilemma pages (internalLinks field, e.g. "/category/morality")
- keywords: up to 8 topically relevant terms`
    : `- keywords: max 6 topically relevant terms`

  const prompt = `Write a ${wordRange} ${isCornerstone ? 'cornerstone (pillar SEO, evergreen)' : 'standard (topic-specific, agile)'} blog article in ${lang} about: "${topic}"
${simWarning}
Context:
- Existing blog articles (do not duplicate): ${inventory.similarTitles.slice(0, 8).join('; ')}
- Total existing blog articles: ${inventory.totalBlogArticles}
- Common playable dilemma IDs to reference: ${commonDilemmaIds}

Requirements:
- ${wordRange}, educational tone
- Must include this disclaimer verbatim: "${disclaimer}"
- No first-person ("I"), no generic filler, no AI-generated feel
- Slug: URL-safe kebab-case, descriptive, max 60 chars
- outline: ${outlineSpec}
- relatedDilemmaIds: ${relatedSpec} from the list above
${cornerstoneReqs}

Output this exact JSON object (no other text):
{
  "type": "blog_article",
  "locale": "${locale}",
  "slug": "...",
  "title": "...",
  "seoTitle": "...",
  "seoDescription": "...",
  "keywords": ["...", "..."],
  "outline": [...],
  "body": "Full article text here...",
${cornerstoneFields}
  "relatedDilemmaIds": ["trolley", "..."],
  "rationale": "One sentence: why this article is useful and novel",
  "safetyNotes": []
}`

  return { system, prompt }
}

export function buildTranslationPrompt(
  source: ArticleSourceForTranslation,
  targetLocale: 'en' | 'it',
  articleKind: ArticleKind = 'standard',
): { system: string; prompt: string } {
  const lang = targetLocale === 'it' ? 'Italian' : 'English'
  const disclaimer = targetLocale === 'it'
    ? 'Contenuto educativo, non consulenza professionale.'
    : 'Educational content, not professional advice.'
  const isCornerstone = articleKind === 'cornerstone'

  const system = `You are a bilingual localization editor for SplitVote, a global moral dilemma platform. \
Translate and culturally adapt a blog article into ${lang}. \
Preserve SEO intent, educational tone, and structural outline. \
Keep relatedDilemmaIds unchanged — they are locale-independent. \
The disclaimer must match the target locale exactly. \
Output ONLY valid JSON — no markdown, no code fences, no extra text.`

  const sourceJson = JSON.stringify({
    title:             source.title,
    seoTitle:          source.seoTitle,
    seoDescription:    source.seoDescription,
    keywords:          source.keywords,
    outline:           source.outline,
    body:              source.body,
    relatedDilemmaIds: source.relatedDilemmaIds,
    ...(source.faq          ? { faq:           source.faq }          : {}),
    ...(source.conclusion   ? { conclusion:    source.conclusion }   : {}),
    ...(source.internalLinks ? { internalLinks: source.internalLinks } : {}),
  }, null, 2)

  const cornerstoneFields = isCornerstone
    ? `  "faq": [{"q": "...", "a": "..."}, ...],
  "conclusion": "...",
  "internalLinks": [...],`
    : ''

  const prompt = `Translate and adapt the following blog article into ${lang}.

Source article (${source.locale.toUpperCase()}):
${sourceJson}

Requirements:
- Translate meaning-equivalently and fluently — not word-for-word
- New slug: URL-safe kebab-case appropriate for ${lang} content (max 60 chars)
- Must include this disclaimer verbatim: "${disclaimer}"
- keywords: translate/adapt to ${lang} SEO equivalents
- relatedDilemmaIds and internalLinks: keep exactly as-is

Output this exact JSON object (no other text):
{
  "type": "blog_article",
  "locale": "${targetLocale}",
  "slug": "...",
  "title": "...",
  "seoTitle": "...",
  "seoDescription": "...",
  "keywords": ["...", "..."],
  "outline": [...],
  "body": "Full translated article text here...",
${cornerstoneFields}
  "relatedDilemmaIds": [...],
  "rationale": "One sentence: why this translation serves the ${lang} audience",
  "safetyNotes": []
}`

  return { system, prompt }
}
