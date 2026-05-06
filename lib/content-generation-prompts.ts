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
- Avoid overused AI/automation framings like "AI will eliminate all X jobs" — transform into a specific, personal moral conflict about a concrete decision instead
- Avoid near-duplicate variations of well-known dilemma templates (trolley problem, organ harvest, lifeboat, last vaccine dose) unless the moral structure is demonstrably different from all existing content
- Do not generate the same moral question with different surface nouns, nationalities, numbers, or settings — that is too_similar, not novel
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
- Question: genuine moral conflict, no easy answer, max 180 characters
- Question must be directly votable — do not write a long scenario paragraph in the question field
- Both options represent different values, not good vs evil
- Each option: concise, max 110 characters
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

export function buildLifestyleDilemmaPrompt(
  locale: GenerationLocale,
  topic: string,
  existingQuestions: string[],
): { system: string; prompt: string } {
  const lang = locale === 'it' ? 'Italian' : 'English'
  const fmtExample = locale === 'it' ? '"Mare o Montagna?"' : '"Beach or Mountains?"'

  const system = `You are a playful content writer for SplitVote, a global preference polling app. \
Generate one fun, light-hearted "this or that" preference question in ${lang}. \
No moral framing — pure personal preference. Output ONLY valid JSON — no markdown, no code fences.`

  const dupWarning = existingQuestions.length > 0
    ? `\nAlready generated on this theme (avoid exact duplicates):\n${existingQuestions.map(q => `- "${q}"`).join('\n')}\n`
    : ''

  const prompt = `Generate one fun preference question in ${lang} about the theme: "${topic}"
${dupWarning}
Format like ${fmtExample} — two clear, equally appealing alternatives. No moral tension required.

Requirements:
- question: "${locale === 'it' ? 'X o Y?' : 'X or Y?'}" format — 10 to 80 characters
- optionA: short vivid label — 2 to 50 characters (e.g. "Mare", "Caffè", "Estate")
- optionB: short vivid label — 2 to 50 characters (the clear alternative)
- Both options must feel equally appealing — there is no right or wrong answer
- category: must be exactly "lifestyle"
- seoTitle: 30 to 70 chars, natural and friendly (e.g. "Mare o Montagna: cosa preferisci?")
- seoDescription: 60 to 160 chars, light and engaging
- keywords: 3 to 5 relevant terms

Output this exact JSON (no other text):
{
  "type": "dilemma",
  "locale": "${locale}",
  "question": "...",
  "optionA": "...",
  "optionB": "...",
  "category": "lifestyle",
  "seoTitle": "...",
  "seoDescription": "...",
  "keywords": ["...", "..."],
  "rationale": "One sentence: what makes this preference question interesting",
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
  const sourceLang = source.locale === 'it' ? 'Italian' : 'English'
  const disclaimer = targetLocale === 'it'
    ? 'Contenuto educativo, non consulenza professionale.'
    : 'Educational content, not professional advice.'
  const isCornerstone = articleKind === 'cornerstone'

  const system = `You are a professional bilingual editorial localization editor for SplitVote, a global moral dilemma platform.
Your goal is NOT to translate — it is to produce a ${lang} article that reads as if a native ${lang}-speaking editor wrote it from scratch on the same topic.
Rules:
- Restructure sentences and paragraphs to match ${lang} natural syntax — never mirror ${sourceLang} sentence structure
- Replace idioms, expressions, and rhetorical patterns with ${lang} equivalents — never transliterate them
- Adapt the editorial voice so it resonates naturally with a ${lang}-speaking audience
- Preserve the argumentative logic, educational depth, and structural outline of the source
- SEO fields (title, seoTitle, seoDescription, keywords, slug) must be optimized for how ${lang} speakers actually search, not translated from ${sourceLang} keywords
- CTAs and calls-to-action must feel natural and compelling in ${lang}, not translated
- If the source contains FAQ, rephrase questions the way native ${lang} speakers would ask them
- relatedDilemmaIds and internalLinks are locale-independent — copy them unchanged
- The disclaimer must match the target locale exactly
- Output ONLY valid JSON — no markdown, no code fences, no extra text`

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

  const prompt = `Localize the following blog article into ${lang}. Do not translate — rewrite it as a native ${lang} editorial piece on the same topic.

Source article (${source.locale.toUpperCase()}):
${sourceJson}

Localization requirements:
- Write as a native ${lang} speaker: restructure sentences, not just words
- Avoid calchi: never carry over ${sourceLang} idioms or expressions literally — find ${lang} equivalents
- title and seoTitle: adapt for ${lang} SEO intent — use the phrasing ${lang} speakers search for, not a literal translation
- seoDescription: rewrite to sound native and compelling in ${lang}
- keywords: replace with ${lang} SEO equivalents — terms ${lang} audiences actually use, not keyword-for-keyword translations
- slug: URL-safe kebab-case meaningful in ${lang} (max 60 chars)
- body: rewrite paragraphs and headings to flow naturally in ${lang} — same ideas, native expression
- CTAs ("Vote now", "Try it", etc.): use the most natural ${lang} phrasing
- FAQ questions (if present): rephrase as a native ${lang} speaker would ask, not as a translated question
- Must include this disclaimer verbatim: "${disclaimer}"
- relatedDilemmaIds and internalLinks: copy exactly as-is

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
  "body": "Full localized article text here...",
${cornerstoneFields}
  "relatedDilemmaIds": [...],
  "rationale": "One sentence: what localization choices make this feel native in ${lang}",
  "safetyNotes": []
}`

  return { system, prompt }
}
