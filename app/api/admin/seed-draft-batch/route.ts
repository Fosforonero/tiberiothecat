/**
 * POST /api/admin/seed-draft-batch
 *
 * Controlled batch seed: generates dilemma drafts using OpenRouter.
 * - Admin-only (Supabase session required)
 * - Novelty guard: skip if noveltyScore < NOVELTY_THRESHOLD
 * - autoPublish: items that pass all quality gates are published directly (max 10 per request)
 * - All other items land in dynamic:drafts for manual admin review
 * - Nothing is published without quality gates — fail-closed by design
 *
 * Body params:
 *   locale?       'en' | 'it' | 'all'  — default 'all' (EN + IT)
 *   count?        number                — default 10, min 1, max 30
 *   dryRun?       boolean               — default false; validates but does not save to Redis
 *   topics?       string[]              — topic override (max 60, requires locale='en'|'it')
 *   autoPublish?  boolean               — default false; publish gate-passing items (max 10, incompatible with dryRun)
 *
 * maxDuration = 300 (Vercel Pro required — ~150-200s for 20 sequential calls)
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-guard'
import { isOpenRouterConfigured, generateWithOpenRouter } from '@/lib/openrouter'
import { buildContentInventory } from '@/lib/content-inventory'
import { scoreNovelty, detectMoralArchetypes, getArchetypeSaturation, MORAL_ARCHETYPES, type NoveltyResult } from '@/lib/content-dedup'
import { buildDilemmaPrompt } from '@/lib/content-generation-prompts'
import { validateGeneratedOutput, slugify, type ValidatedDilemma } from '@/lib/content-generation-validate'
import {
  saveDraftScenarios,
  saveDynamicScenarios,
  type DynamicScenario,
} from '@/lib/dynamic-scenarios'
import { runQualityGates } from '@/lib/content-quality-gates'
import { buildComparisonItems, runSemanticReview, isBlockingVerdict, type SemanticReviewResult } from '@/lib/content-semantic-review'
import { computeSeoScore } from '@/lib/trend-signals'
import type { Category } from '@/lib/scenarios'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 300

const NOVELTY_THRESHOLD = 55
// Hard cap on auto-published items per request, regardless of count.
const AUTO_PUBLISH_CAP = 10

const CATEGORY_EMOJI: Record<string, string> = {
  morality:      '⚖️',
  survival:      '🌊',
  loyalty:       '🤝',
  justice:       '⚖️',
  freedom:       '🕊️',
  technology:    '🤖',
  society:       '🏙️',
  relationships: '❤️',
}

// Curated seed topics — 32 per locale (4 per category × 8 categories), diverse and non-overlapping with static dilemmas.
// Category annotation drives the diversity shuffle in selectDiverseTopics().
const SEED_TOPICS: Array<{ locale: 'en' | 'it'; topic: string; category: Category }> = [
  // ── EN — morality (4) ─────────────────────────────────────────────────────
  { locale: 'en', category: 'morality', topic: 'Is it acceptable to lie to a dementia patient to spare them daily emotional pain?' },
  { locale: 'en', category: 'morality', topic: 'Would you genetically edit your unborn child to eliminate a known fatal hereditary disease?' },
  { locale: 'en', category: 'morality', topic: 'If you discovered your professional success was mostly luck, would you redistribute your wealth?' },
  { locale: 'en', category: 'morality', topic: "Is it ethical to use a deceased person's likeness in an AI-generated film without their family's consent?" },
  // ── EN — survival (4) ────────────────────────────────────────────────────
  { locale: 'en', category: 'survival', topic: 'Would you accept a fulfilling simulated life knowing the real world outside is collapsing?' },
  { locale: 'en', category: 'survival', topic: "You are the only pilot of an evacuation plane with seats for ten — fifteen people are at the gate. Do you take off leaving five behind, or delay until everyone boards and risk losing everyone?" },
  { locale: 'en', category: 'survival', topic: 'Would you sacrifice one crew member to save the rest of your team in a life-or-death mission?' },
  { locale: 'en', category: 'survival', topic: 'In a pandemic with one dose left, do you prioritize the young and healthy or the elderly and vulnerable?' },
  // ── EN — loyalty (4) ─────────────────────────────────────────────────────
  { locale: 'en', category: 'loyalty', topic: 'Would you report a close friend to the police if you discovered they committed a serious crime?' },
  { locale: 'en', category: 'loyalty', topic: "Should you tell your best friend their partner is cheating if the friend has explicitly asked not to know?" },
  { locale: 'en', category: 'loyalty', topic: 'Would you cover for a sibling who caused a car accident that injured someone else?' },
  { locale: 'en', category: 'loyalty', topic: 'Would you give up your dream career opportunity to stay near a family member with a terminal illness?' },
  // ── EN — justice (4) ─────────────────────────────────────────────────────
  { locale: 'en', category: 'justice', topic: 'Should murderers who show proven remorse and rehabilitation receive early release?' },
  { locale: 'en', category: 'justice', topic: 'Is it ethical for governments to pay homeless people to participate in medical trials?' },
  { locale: 'en', category: 'justice', topic: 'Should a wealthy defendant have the right to buy a better legal defense than a poor one?' },
  { locale: 'en', category: 'justice', topic: 'Should a person be punished for a crime they committed as a teenager but have since renounced?' },
  // ── EN — freedom (4) ─────────────────────────────────────────────────────
  { locale: 'en', category: 'freedom', topic: 'Should anonymous whistleblowing be legally protected even when the disclosed information leads to national security breaches?' },
  { locale: 'en', category: 'freedom', topic: 'Should governments be allowed to hack private systems to prevent imminent terrorist attacks?' },
  { locale: 'en', category: 'freedom', topic: 'Should social media companies be legally required to remove posts spreading medical misinformation?' },
  { locale: 'en', category: 'freedom', topic: 'Is mandatory vaccination for school attendance an acceptable limit on parental rights?' },
  // ── EN — technology (4) ──────────────────────────────────────────────────
  { locale: 'en', category: 'technology', topic: 'Should social media companies be held legally liable for algorithmically addictive design that causes measurable harm to users?' },
  { locale: 'en', category: 'technology', topic: 'Should AI-written news articles be legally required to carry a disclosure label, even if they are indistinguishable from human journalism?' },
  { locale: 'en', category: 'technology', topic: 'Would you accept a neural implant that makes you 30% smarter if the manufacturer could read — but never modify — your thoughts at any time?' },
  { locale: 'en', category: 'technology', topic: 'Would you let an AI make your medical diagnosis if it were proven more accurate than human doctors?' },
  // ── EN — society (4) ─────────────────────────────────────────────────────
  { locale: 'en', category: 'society', topic: 'Should billionaires be taxed at 90% above a certain threshold to fund universal basic income?' },
  { locale: 'en', category: 'society', topic: 'Is open-borders immigration a moral obligation for wealthy nations?' },
  { locale: 'en', category: 'society', topic: 'Should recreational drugs be fully legalized and regulated like alcohol?' },
  { locale: 'en', category: 'society', topic: 'Should prison abolition be pursued even knowing some dangerous individuals would remain free?' },
  // ── EN — relationships (4) ───────────────────────────────────────────────
  { locale: 'en', category: 'relationships', topic: 'Would you give up your career to become the sole caregiver for an aging parent?' },
  { locale: 'en', category: 'relationships', topic: 'Is it ethical to stay in a loveless marriage for the sake of young children?' },
  { locale: 'en', category: 'relationships', topic: 'Should you forgive a close friend who betrayed your deepest secret, even if they apologized sincerely?' },
  { locale: 'en', category: 'relationships', topic: 'Would you choose to save your partner or five strangers in an emergency where only one group can survive?' },

  // ── IT — morality (4) ─────────────────────────────────────────────────────
  { locale: 'it', category: 'morality', topic: 'È accettabile mentire a un malato di demenza per risparmiargli il dolore quotidiano della perdita?' },
  { locale: 'it', category: 'morality', topic: 'È eticamente accettabile clonare esseri umani esclusivamente per scopi medici?' },
  { locale: 'it', category: 'morality', topic: 'Confessi un crimine di cui ti sei pentito, sapendo che rovinerai la tua vita e quella della tua famiglia?' },
  { locale: 'it', category: 'morality', topic: "È giusto usare l'immagine di una persona deceduta in un film generato dall'AI senza il consenso dei familiari?" },
  // ── IT — survival (4) ────────────────────────────────────────────────────
  { locale: 'it', category: 'survival', topic: 'Preferiresti vivere 60 anni in perfetta salute oppure 90 anni con qualità di vita ridotta?' },
  { locale: 'it', category: 'survival', topic: 'In guerra, è giustificabile sacrificare civili nemici per salvare i propri soldati?' },
  { locale: 'it', category: 'survival', topic: 'Accetteresti di vivere in una simulazione perfetta sapendo che il mondo reale fuori sta collassando?' },
  { locale: 'it', category: 'survival', topic: "In una pandemia con una sola dose di vaccino rimasta, la daresti al giovane sano o all'anziano vulnerabile?" },
  // ── IT — loyalty (4) ─────────────────────────────────────────────────────
  { locale: 'it', category: 'loyalty', topic: 'Dovresti rivelare a qualcuno che il suo partner lo tradisce, anche se non te lo ha chiesto?' },
  { locale: 'it', category: 'loyalty', topic: 'Copriresti un fratello che ha causato un incidente stradale con un ferito, per proteggerlo dalla giustizia?' },
  { locale: 'it', category: 'loyalty', topic: 'Rinunceresti alla carriera dei tuoi sogni per restare vicino a un familiare con una malattia terminale?' },
  { locale: 'it', category: 'loyalty', topic: 'Denunceresti un tuo caro amico se scoprissi che ha commesso un grave crimine?' },
  // ── IT — justice (4) ─────────────────────────────────────────────────────
  { locale: 'it', category: 'justice', topic: 'Denunceresti un medico che pratica eutanasia su pazienti terminali senza consenso esplicito?' },
  { locale: 'it', category: 'justice', topic: 'È giusto che un imputato ricco possa comprare una difesa legale migliore di quella di un povero?' },
  { locale: 'it', category: 'justice', topic: 'Una persona dovrebbe essere punita per un crimine commesso da adolescente e da cui si è dissociata?' },
  { locale: 'it', category: 'justice', topic: 'È etico pagare persone senza fissa dimora per partecipare a sperimentazioni mediche?' },
  // ── IT — freedom (4) ─────────────────────────────────────────────────────
  { locale: 'it', category: 'freedom', topic: 'È giusto limitare la libertà di parola online per prevenire la radicalizzazione?' },
  { locale: 'it', category: 'freedom', topic: "È giusto che le forze dell'ordine usino il riconoscimento facciale in tempo reale negli spazi pubblici per individuare sospettati ricercati?" },
  { locale: 'it', category: 'freedom', topic: 'Le aziende social dovrebbero essere obbligate per legge a rimuovere i post con disinformazione medica?' },
  { locale: 'it', category: 'freedom', topic: "La vaccinazione obbligatoria per l'accesso scolastico è un limite accettabile ai diritti dei genitori?" },
  // ── IT — technology (4) ──────────────────────────────────────────────────
  { locale: 'it', category: 'technology', topic: 'È etico usare dati di sorveglianza delle città per prevenire crimini prima che accadano?' },
  { locale: 'it', category: 'technology', topic: 'Accetteresti un chip neurale che migliora le tue capacità cognitive del 30% se il produttore potesse leggere — ma non modificare — i tuoi pensieri in qualsiasi momento?' },
  { locale: 'it', category: 'technology', topic: 'Le aziende di intelligenza artificiale dovrebbero essere legalmente responsabili per i danni causati dalle decisioni autonome dei loro algoritmi?' },
  { locale: 'it', category: 'technology', topic: "Affideresti la tua diagnosi medica a un'AI se fosse statisticamente più accurata dei medici umani?" },
  // ── IT — society (4) ─────────────────────────────────────────────────────
  { locale: 'it', category: 'society', topic: "Un'azienda può licenziare un dipendente per i suoi post privati sui social che danneggiano il brand?" },
  { locale: 'it', category: 'society', topic: 'Le droghe ricreative dovrebbero essere completamente legalizzate e regolamentate come l\'alcol?' },
  { locale: 'it', category: 'society', topic: 'I miliardari dovrebbero essere tassati al 90% oltre una certa soglia per finanziare un reddito universale?' },
  { locale: 'it', category: 'society', topic: "L'abolizione del carcere è perseguibile moralmente anche sapendo che alcuni individui pericolosi resterebbero liberi?" },
  // ── IT — relationships (4) ───────────────────────────────────────────────
  { locale: 'it', category: 'relationships', topic: 'Adotteresti un figlio con gravi disabilità cognitive sapendo che cambierà completamente la tua vita?' },
  { locale: 'it', category: 'relationships', topic: 'È etico restare in un matrimonio senza amore per il bene dei figli piccoli?' },
  { locale: 'it', category: 'relationships', topic: 'Perdoneresti un amico intimo che ha tradito il tuo segreto più profondo, anche se si è scusato sinceramente?' },
  { locale: 'it', category: 'relationships', topic: "In un'emergenza in cui puoi salvare solo il tuo partner o cinque sconosciuti, cosa scegli?" },
]

// Selects `count` topics for the given locale with category diversity.
// Shuffles each category bucket independently, then picks round-robin across categories.
// Never hard-fails if a category bucket runs out — simply skips that slot.
function selectDiverseTopics(
  pool: Array<{ locale: 'en' | 'it'; topic: string; category: Category }>,
  locale: 'en' | 'it',
  count: number,
): Array<{ locale: 'en' | 'it'; topic: string; category: Category }> {
  const byCategory = new Map<string, Array<{ locale: 'en' | 'it'; topic: string; category: Category }>>()
  for (const t of pool.filter(t => t.locale === locale)) {
    const bucket = byCategory.get(t.category) ?? []
    bucket.push(t)
    byCategory.set(t.category, bucket)
  }
  // Shuffle each category bucket independently
  for (const [cat, bucket] of byCategory) {
    byCategory.set(cat, bucket.sort(() => Math.random() - 0.5))
  }
  const categories = [...byCategory.keys()]
  const pointers = new Map<string, number>(categories.map(c => [c, 0]))
  const selected: Array<{ locale: 'en' | 'it'; topic: string; category: Category }> = []
  let catIdx = 0
  const maxAttempts = count * categories.length + categories.length
  for (let attempts = 0; selected.length < count && attempts < maxAttempts; attempts++) {
    const cat = categories[catIdx % categories.length]
    catIdx++
    const ptr = pointers.get(cat)!
    const bucket = byCategory.get(cat)!
    if (ptr < bucket.length) {
      selected.push(bucket[ptr])
      pointers.set(cat, ptr + 1)
    }
  }
  return selected
}

// Returns the preflight block reason if a topic is too similar to existing content, null if eligible.
function getPreflightBlock(preCheck: NoveltyResult): 'too_similar_to_existing' | 'too_similar_to_draft' | null {
  if (preCheck.similarItems.some(s => (s.status === 'approved' || s.status === 'static') && s.similarity >= 70)) {
    return 'too_similar_to_existing'
  }
  if (preCheck.similarItems.some(s => s.status === 'draft' && s.similarity >= 80)) {
    return 'too_similar_to_draft'
  }
  return null
}

// Returns the subset of SEED_TOPICS for the given locale that pass the preflight similarity guard.
function getEligibleTopics(
  locale: 'en' | 'it',
  inventory: Parameters<typeof scoreNovelty>[1],
): Array<{ locale: 'en' | 'it'; topic: string; category: Category }> {
  return SEED_TOPICS
    .filter(t => t.locale === locale)
    .filter(t => getPreflightBlock(scoreNovelty({ type: 'dilemma', locale, title: t.topic }, inventory)) === null)
}

function dilemmaToScenario(candidate: ValidatedDilemma, topic: string): DynamicScenario {
  const suffix = Date.now().toString(36).slice(-5)
  const id = `ai-${candidate.locale}-${slugify(candidate.question).slice(0, 22).replace(/-+$/, '')}-${suffix}`

  const noveltyScore  = candidate.noveltyScore
  // viralScore baseline: topics are admin-curated, expected to be more engaging than cron defaults.
  // seoScore: computed from actual generated SEO metadata — auto-publish requires genuinely good metadata.
  // feedbackScore: neutral start (Bayesian prior, no real feedback yet).
  // auto-publish depends on novelty + real SEO quality passing runQualityGates thresholds.
  const viralScore    = 65
  const seoScore      = computeSeoScore(candidate.seoTitle, candidate.seoDescription, candidate.keywords)
  const feedbackScore = 50
  const finalScore    = Math.round(
    viralScore * 0.35 + seoScore * 0.25 + noveltyScore * 0.25 + feedbackScore * 0.15,
  )

  return {
    id,
    question:       candidate.question,
    optionA:        candidate.optionA,
    optionB:        candidate.optionB,
    category:       candidate.category as Category,
    emoji:          CATEGORY_EMOJI[candidate.category] ?? '🤔',
    locale:         candidate.locale,
    trend:          topic,
    trendSource:    'openrouter',
    trendUrl:       process.env.OPENROUTER_MODEL_DRAFT ?? 'openrouter',
    generatedAt:    new Date().toISOString(),
    generatedBy:    'seed_batch',
    status:         'draft',
    seoTitle:       candidate.seoTitle,
    seoDescription: candidate.seoDescription,
    keywords:       candidate.keywords,
    scores: { viralScore, seoScore, noveltyScore, feedbackScore, finalScore },
  }
}

const delay = (ms: number) => new Promise<void>(r => setTimeout(r, ms))

export interface SeedResult {
  index:               number
  locale:              'en' | 'it'
  topic:               string
  status:              'saved' | 'dry_run' | 'auto_published' | 'skipped_novelty' | 'skipped_preflight' | 'error'
  id?:                 string
  category?:           string
  question?:           string
  noveltyScore?:       number
  similarItemsCount?:  number
  similarItems?:       { title: string; similarity: number }[]  // top 3 for admin review
  topKeyword?:         string
  errorCode?:          string
  // Auto-publish metadata
  publishNote?:        string    // 'quality_gate_failed' | 'publish_redis_error'
  qualityGateReasons?: string[]  // gate failure reasons (present when autoPublish was attempted)
  semanticVerdict?:           string
  semanticReason?:            string
  semanticClosestMatchTitle?: string
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin()
  if (auth instanceof NextResponse) return auth

  if (!isOpenRouterConfigured()) {
    return NextResponse.json({ error: 'openrouter_not_configured' }, { status: 503 })
  }

  // ── Parse and validate body params ─────────────────────────────────────────
  const body = await request.json().catch(() => ({}))

  const localeParam = body.locale ?? 'all'
  if (!['en', 'it', 'all'].includes(localeParam)) {
    return NextResponse.json({ error: 'invalid_locale' }, { status: 400 })
  }
  const locale = localeParam as 'en' | 'it' | 'all'

  const rawCount = typeof body.count === 'number' && Number.isFinite(body.count) ? body.count : 10
  const count = Math.min(30, Math.max(1, Math.floor(rawCount)))

  const dryRun      = body.dryRun === true
  const autoPublish = body.autoPublish === true

  if (autoPublish && dryRun) {
    return NextResponse.json(
      { error: 'invalid_request', message: 'autoPublish cannot be combined with dryRun.' },
      { status: 400 },
    )
  }

  // ── Validate topics override ────────────────────────────────────────────────
  const rawTopics: unknown = body.topics
  let customTopics: string[] | undefined

  if (rawTopics !== undefined) {
    if (!Array.isArray(rawTopics) || rawTopics.length > 60) {
      return NextResponse.json({ error: 'invalid_topics' }, { status: 400 })
    }
    for (const t of rawTopics) {
      if (typeof t !== 'string') {
        return NextResponse.json({ error: 'invalid_topics' }, { status: 400 })
      }
      const trimmed = t.trim()
      if (trimmed.length < 3 || trimmed.length > 200 || /[\x00-\x1F\x7F-\x9F]/.test(trimmed)) {
        return NextResponse.json({ error: 'invalid_topics' }, { status: 400 })
      }
    }
    if (locale === 'all') {
      return NextResponse.json(
        { error: 'invalid_request', message: "Specify locale='en' or 'it' when providing custom topics." },
        { status: 400 },
      )
    }
    const rawTopicsArr = rawTopics as string[]
    if (rawTopicsArr.length < count) {
      return NextResponse.json(
        {
          error: 'not_enough_seed_topics',
          message: `Requested ${count} topics but only ${rawTopicsArr.length} provided.`,
          available: { [locale]: rawTopicsArr.length },
          requested: count,
        },
        { status: 400 },
      )
    }
    customTopics = rawTopicsArr.map(t => t.trim()).slice(0, count)
  }

  // ── Build content inventory (needed for preflight pre-filter and all novelty checks) ──────────────
  const inventory = await buildContentInventory()

  const ARCHETYPE_THRESHOLD = 3
  const archetypeSaturation = getArchetypeSaturation(inventory)
  const saturatedArchetypeLabels = MORAL_ARCHETYPES
    .filter(a => (archetypeSaturation.get(a.id) ?? 0) >= ARCHETYPE_THRESHOLD)
    .map(a => a.label)

  // ── Build topic list ────────────────────────────────────────────────────────
  const topicsToProcess: Array<{ locale: 'en' | 'it'; topic: string; category?: Category }> = []

  if (customTopics !== undefined) {
    // Custom topics have no category annotation — targetCategory will be undefined (no hint)
    for (const topic of customTopics) {
      topicsToProcess.push({ locale: locale as 'en' | 'it', topic })
    }
  } else {
    // Default SEED_TOPICS — pre-filter by preflight before selection to avoid wasting OpenRouter calls.
    // Only topics that pass the similarity guard against current inventory enter the selection pool.
    const eligibleEN = getEligibleTopics('en', inventory)
    const eligibleIT = getEligibleTopics('it', inventory)

    if ((locale === 'all' || locale === 'en') && eligibleEN.length < count) {
      return NextResponse.json(
        {
          error: 'not_enough_eligible_seed_topics',
          requested: count,
          eligible: { en: eligibleEN.length, it: eligibleIT.length },
          locale: locale === 'all' ? 'en' : locale,
          message: 'Not enough default seed topics remain after similarity preflight. Use custom topics or lower count.',
        },
        { status: 409 },
      )
    }
    if ((locale === 'all' || locale === 'it') && eligibleIT.length < count) {
      return NextResponse.json(
        {
          error: 'not_enough_eligible_seed_topics',
          requested: count,
          eligible: { en: eligibleEN.length, it: eligibleIT.length },
          locale: locale === 'all' ? 'it' : locale,
          message: 'Not enough default seed topics remain after similarity preflight. Use custom topics or lower count.',
        },
        { status: 409 },
      )
    }

    // Category-diversified selection from eligible pool — shuffles within each category bucket, then round-robins.
    if (locale === 'all' || locale === 'en') topicsToProcess.push(...selectDiverseTopics(eligibleEN, 'en', count))
    if (locale === 'all' || locale === 'it') topicsToProcess.push(...selectDiverseTopics(eligibleIT, 'it', count))
  }

  // ── Run generation ──────────────────────────────────────────────────────────
  const results: SeedResult[] = []
  let savedDrafts        = 0
  let autoPublishedCount = 0
  let dryRunPassed       = 0
  let skipped            = 0
  let skippedPreflight   = 0
  let openRouterCalls    = 0
  let errors             = 0

  for (let i = 0; i < topicsToProcess.length; i++) {
    const { locale: entryLocale, topic } = topicsToProcess[i]

    if (i > 0) await delay(400)

    const preCheck = scoreNovelty(
      { type: 'dilemma', locale: entryLocale, title: topic },
      inventory,
    )

    // Preflight similarity guard — skip OpenRouter call when topic is too close to existing content.
    // Default topics are pre-filtered before selection; this is the safety net for custom topics
    // and for state changes that occurred since the pre-filter ran (e.g. new drafts mid-batch).
    const preflightBlock = getPreflightBlock(preCheck)
    if (preflightBlock !== null) {
      results.push({
        index:             i + 1,
        locale:            entryLocale,
        topic,
        status:            'skipped_preflight',
        noveltyScore:      preCheck.noveltyScore,
        similarItemsCount: preCheck.similarItems.length,
        similarItems:      preCheck.similarItems.slice(0, 3).map(s => ({ title: s.title, similarity: s.similarity })),
        publishNote:       preflightBlock,
      })
      skippedPreflight++
      continue
    }

    const targetCat   = topicsToProcess[i].category
    const localeItems = inventory.filter(x => x.type === 'dilemma' && x.locale === entryLocale)
    const categoryCounts: Record<string, number> = {}
    for (const item of localeItems) {
      if (item.category) categoryCounts[item.category] = (categoryCounts[item.category] ?? 0) + 1
    }
    const existingQuestionsInCategory = targetCat
      ? localeItems.filter(x => x.category === targetCat).map(x => x.title).slice(0, 8)
      : []

    const inventorySummary = {
      totalDilemmas:               inventory.filter(x => x.type === 'dilemma').length,
      totalBlogArticles:           inventory.filter(x => x.type === 'blog_article').length,
      categories:                  [...new Set(inventory.map(x => x.category).filter(Boolean))] as string[],
      recentKeywords:              inventory.flatMap(x => x.keywords).slice(0, 30),
      similarTitles:               preCheck.similarItems.map(x => x.title),
      categoryCounts,
      saturatedArchetypes:         saturatedArchetypeLabels,
      existingQuestionsInCategory,
    }

    const similarWarnings = preCheck.similarItems
      .filter(x => x.similarity >= 50)
      .map(x => {
        const reasonLabel = x.reason.split(';')[0].replace(/_/g, ' ').replace(/:\d+\.?\d*/g, '').trim()
        return `"${x.title}" (${x.similarity}% similar${reasonLabel ? ` — ${reasonLabel}` : ''})`
      })

    const { system, prompt } = buildDilemmaPrompt({
      type:           'dilemma',
      locale:         entryLocale,
      topic,
      targetCategory: topicsToProcess[i].category,
      inventory:      inventorySummary,
      similarContentWarnings: similarWarnings,
    })

    openRouterCalls++
    const generated = await generateWithOpenRouter({ system, prompt })

    if (!generated.ok) {
      results.push({ index: i + 1, locale: entryLocale, topic, status: 'error', errorCode: generated.error })
      errors++
      continue
    }

    const validation = validateGeneratedOutput(generated.text, 'dilemma', entryLocale, inventory)

    if (!validation.ok) {
      results.push({ index: i + 1, locale: entryLocale, topic, status: 'error', errorCode: validation.error })
      errors++
      continue
    }

    const candidate = validation.candidate as ValidatedDilemma

    // Archetype saturation penalty — reduces noveltyScore for archetypes already well-covered.
    // Blocks autoPublish; draft still saved for admin review when noveltyScore passes threshold.
    const candidateText = `${candidate.question} ${candidate.optionA} ${candidate.optionB}`
    const matchedArchetypes = detectMoralArchetypes(candidateText)
    const saturatedMatches = matchedArchetypes.filter(id => (archetypeSaturation.get(id) ?? 0) >= ARCHETYPE_THRESHOLD)
    const hasArchetypeSaturation = saturatedMatches.length > 0
    if (hasArchetypeSaturation) {
      const penalty = Math.min(15, saturatedMatches.length * 8)
      candidate.noveltyScore = Math.max(0, candidate.noveltyScore - penalty)
      for (const id of saturatedMatches) candidate.warnings.push(`archetype_saturation:${id}`)
    }

    if (candidate.noveltyScore < NOVELTY_THRESHOLD) {
      results.push({
        index:             i + 1,
        locale:            entryLocale,
        topic,
        status:            'skipped_novelty',
        noveltyScore:      candidate.noveltyScore,
        similarItemsCount: candidate.similarItems.length,
        similarItems:      candidate.similarItems.slice(0, 3).map(s => ({ title: s.title, similarity: s.similarity })),
        category:          candidate.category,
        question:          candidate.question,
        topKeyword:        candidate.keywords[0],
      })
      skipped++
      continue
    }

    // ── Semantic review ───────────────────────────────────────────────────────
    const comparisonItems = buildComparisonItems(
      entryLocale,
      candidate.category,
      candidate.similarItems.map(s => ({ id: s.id, title: s.title })),
      inventory,
    )

    let semanticResult: SemanticReviewResult | undefined
    let hasSemanticBlock = false

    const reviewOutcome = await runSemanticReview(
      {
        candidate: {
          question: candidate.question,
          optionA:  candidate.optionA,
          optionB:  candidate.optionB,
          category: candidate.category,
          locale:   entryLocale,
        },
        comparisonItems,
      },
      10_000,
    )

    if (!reviewOutcome.ok) {
      candidate.warnings.push('semantic_review_failed')
    } else {
      semanticResult = reviewOutcome.result
      hasSemanticBlock = isBlockingVerdict(semanticResult.verdict)
      if (hasSemanticBlock) candidate.warnings.push(`semantic_review:${semanticResult.verdict}`)
    }

    const scenario = dilemmaToScenario(candidate, topic)
    if (semanticResult) {
      scenario.semanticReview = {
        verdict:           semanticResult.verdict,
        reason:            semanticResult.reason,
        closestMatchId:    semanticResult.closestMatch?.id,
        closestMatchTitle: semanticResult.closestMatch?.title,
      }
    }

    // Always update local inventory so subsequent novelty checks within this request are aware
    inventory.push({
      id:             scenario.id,
      type:           'dilemma',
      locale:         entryLocale,
      title:          scenario.question,
      slug:           scenario.id,
      category:       scenario.category,
      keywords:       scenario.keywords ?? [],
      status:         'draft',
      source:         'ai_generated',
      searchableText: `${scenario.question} ${scenario.optionA} ${scenario.optionB} ${(scenario.keywords ?? []).join(' ')}`,
    })

    if (dryRun) {
      results.push({
        index:             i + 1,
        locale:            entryLocale,
        topic,
        status:            'dry_run',
        id:                scenario.id,
        category:          candidate.category,
        question:          candidate.question,
        noveltyScore:      candidate.noveltyScore,
        similarItemsCount: candidate.similarItems.length,
        similarItems:      candidate.similarItems.slice(0, 3).map(s => ({ title: s.title, similarity: s.similarity })),
        topKeyword:        candidate.keywords[0],
        ...(semanticResult ? {
          semanticVerdict:           semanticResult.verdict,
          semanticReason:            semanticResult.reason,
          semanticClosestMatchTitle: semanticResult.closestMatch?.title,
        } : (!reviewOutcome.ok ? { semanticVerdict: 'review_failed' } : {})),
      })
      dryRunPassed++
    } else {
      // ── Attempt auto-publish when requested and cap not reached ────────────
      let didPublish     = false
      let publishNote:     string   | undefined
      let gateReasons:    string[] | undefined

      if (autoPublish && autoPublishedCount < AUTO_PUBLISH_CAP && !hasArchetypeSaturation && !hasSemanticBlock && reviewOutcome.ok) {
        const gateResult = runQualityGates({
          locale:            entryLocale,
          question:          candidate.question,
          optionA:           candidate.optionA,
          optionB:           candidate.optionB,
          category:          candidate.category,
          seoTitle:          candidate.seoTitle,
          seoDescription:    candidate.seoDescription,
          keywords:          candidate.keywords,
          scores:            scenario.scores,
          similarItemsCount: candidate.similarItems.length,
        })

        if (gateResult.passed) {
          const approvedScenario: DynamicScenario = {
            ...scenario,
            status:             'approved',
            approvedAt:         new Date().toISOString(),
            autoPublished:      true,
            qualityGateScore:   gateResult.score,
            qualityGateReasons: [],
            generatedBy:        'seed_batch',
          }
          try {
            await saveDynamicScenarios([approvedScenario])
            results.push({
              index:             i + 1,
              locale:            entryLocale,
              topic,
              status:            'auto_published',
              id:                scenario.id,
              category:          candidate.category,
              question:          candidate.question,
              noveltyScore:      candidate.noveltyScore,
              similarItemsCount: candidate.similarItems.length,
              similarItems:      candidate.similarItems.slice(0, 3).map(s => ({ title: s.title, similarity: s.similarity })),
              topKeyword:        candidate.keywords[0],
              qualityGateReasons: [],
              ...(semanticResult ? {
                semanticVerdict:           semanticResult.verdict,
                semanticReason:            semanticResult.reason,
                semanticClosestMatchTitle: semanticResult.closestMatch?.title,
              } : {}),
            })
            autoPublishedCount++
            didPublish = true
          } catch {
            publishNote = 'publish_redis_error'
          }
        } else {
          publishNote = 'quality_gate_failed'
          gateReasons = gateResult.reasons
        }
      }

      if (!didPublish) {
        // Covers: autoPublish=false, cap reached, gate failed, redis error fallback
        try {
          await saveDraftScenarios([scenario])
          results.push({
            index:             i + 1,
            locale:            entryLocale,
            topic,
            status:            'saved',
            id:                scenario.id,
            category:          candidate.category,
            question:          candidate.question,
            noveltyScore:      candidate.noveltyScore,
            similarItemsCount: candidate.similarItems.length,
            similarItems:      candidate.similarItems.slice(0, 3).map(s => ({ title: s.title, similarity: s.similarity })),
            topKeyword:        candidate.keywords[0],
            ...(publishNote  ? { publishNote }          : {}),
            ...(gateReasons  ? { qualityGateReasons: gateReasons } : {}),
            ...(semanticResult ? {
              semanticVerdict:           semanticResult.verdict,
              semanticReason:            semanticResult.reason,
              semanticClosestMatchTitle: semanticResult.closestMatch?.title,
            } : (!reviewOutcome.ok ? { semanticVerdict: 'review_failed' } : {})),
          })
          savedDrafts++
        } catch {
          results.push({ index: i + 1, locale: entryLocale, topic, status: 'error', errorCode: 'redis_save_failed' })
          errors++
        }
      }
    }
  }

  // ── Category breakdown (saved + dry_run + auto_published) ───────────────────
  const categoryBreakdown: Record<string, number> = {}
  for (const r of results) {
    if ((r.status === 'saved' || r.status === 'dry_run' || r.status === 'auto_published') && r.category) {
      categoryBreakdown[r.category] = (categoryBreakdown[r.category] ?? 0) + 1
    }
  }

  return NextResponse.json({
    summary: {
      total:             topicsToProcess.length,
      savedDrafts,
      autoPublished:     autoPublishedCount,
      ...(dryRun ? { dryRunPassed } : {}),
      skipped_novelty:   skipped,
      skipped_preflight: skippedPreflight,
      openRouterCalls,
      errors,
    },
    dryRun,
    autoPublish,
    noveltyThreshold: NOVELTY_THRESHOLD,
    estimatedCost: {
      calls:     topicsToProcess.length,
      modelName: process.env.OPENROUTER_MODEL_DRAFT ?? 'openrouter',
      note:      `Approx. ${topicsToProcess.length} OpenRouter calls — actual billing depends on provider pricing.`,
    },
    categoryBreakdown,
    results,
  })
}
