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
import { buildContentInventory, type ContentItem } from '@/lib/content-inventory'
import { scoreNovelty, detectMoralArchetypes, getArchetypeSaturation, MORAL_ARCHETYPES, type NoveltyResult } from '@/lib/content-dedup'
import { buildDilemmaPrompt, buildLifestyleDilemmaPrompt } from '@/lib/content-generation-prompts'
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
import { getAllContentSeeds, getContentSeedsByPack, CONTENT_SEED_PACKS, type ContentSeed } from '@/lib/content-seed-packs'
import { loadSeedUsageMap, batchUpdateSeedUsage, saveSeedUsageMap, type SeedUsageMap } from '@/lib/content-seed-usage'
import { isSeedExcluded } from '@/lib/content-seed-exclusions'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 300

const MORAL_NOVELTY_THRESHOLD     = 55
const LIFESTYLE_NOVELTY_THRESHOLD = 10
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
  lifestyle:     '🎭',
}

// Lifestyle seed themes — one AI-generated preference question per theme.
// 40 per locale; diverse sub-buckets: nature, food, seasons, daily life,
// entertainment, aesthetics, travel, sport, tech, social.
const LIFESTYLE_SEED_TOPICS: Array<{ locale: 'en' | 'it'; topic: string }> = [
  // ── IT ──────────────────────────────────────────────────────────────────────
  { locale: 'it', topic: 'mare o montagna' },
  { locale: 'it', topic: 'estate o inverno' },
  { locale: 'it', topic: 'caffè o tè' },
  { locale: 'it', topic: 'mattina o sera' },
  { locale: 'it', topic: 'film o serie TV' },
  { locale: 'it', topic: 'cane o gatto' },
  { locale: 'it', topic: 'pizza o pasta' },
  { locale: 'it', topic: 'dolce o salato' },
  { locale: 'it', topic: 'città o campagna' },
  { locale: 'it', topic: 'chiaro o scuro' },
  { locale: 'it', topic: 'bianco o nero' },
  { locale: 'it', topic: 'silenzio o musica di sottofondo' },
  { locale: 'it', topic: 'libro cartaceo o e-book' },
  { locale: 'it', topic: 'spiaggia o piscina' },
  { locale: 'it', topic: 'colazione abbondante o leggera' },
  { locale: 'it', topic: 'nord o sud Italia' },
  { locale: 'it', topic: 'pioggia o sole' },
  { locale: 'it', topic: 'palestra o corsa all\'aperto' },
  { locale: 'it', topic: 'ricordi in foto o video' },
  { locale: 'it', topic: 'aereo o treno' },
  { locale: 'it', topic: 'cinema o divano' },
  { locale: 'it', topic: 'lago o mare' },
  { locale: 'it', topic: 'primavera o autunno' },
  { locale: 'it', topic: 'messaggi o telefonate' },
  { locale: 'it', topic: 'pesce o carne' },
  { locale: 'it', topic: 'viaggiare o stare a casa' },
  { locale: 'it', topic: 'sport di squadra o individuale' },
  { locale: 'it', topic: 'colori vivaci o toni neutri' },
  { locale: 'it', topic: 'cena a casa o al ristorante' },
  { locale: 'it', topic: 'alba o tramonto' },
  { locale: 'it', topic: 'montagna innevata o deserto' },
  { locale: 'it', topic: 'smartphone o computer' },
  { locale: 'it', topic: 'vino o birra' },
  { locale: 'it', topic: 'formale o casual' },
  { locale: 'it', topic: 'grande città o piccolo paese' },
  { locale: 'it', topic: 'nottambulo o mattiniero' },
  { locale: 'it', topic: 'caldo secco o freschezza umida' },
  { locale: 'it', topic: 'musica o podcast' },
  { locale: 'it', topic: 'doccia o bagno' },
  { locale: 'it', topic: 'minimalismo o massimalismo' },
  // ── EN ──────────────────────────────────────────────────────────────────────
  { locale: 'en', topic: 'beach or mountains' },
  { locale: 'en', topic: 'summer or winter' },
  { locale: 'en', topic: 'coffee or tea' },
  { locale: 'en', topic: 'morning or night' },
  { locale: 'en', topic: 'movies or TV series' },
  { locale: 'en', topic: 'dogs or cats' },
  { locale: 'en', topic: 'pizza or pasta' },
  { locale: 'en', topic: 'sweet or savory' },
  { locale: 'en', topic: 'city or countryside' },
  { locale: 'en', topic: 'light or dark' },
  { locale: 'en', topic: 'silence or background music' },
  { locale: 'en', topic: 'physical book or e-book' },
  { locale: 'en', topic: 'ocean or pool' },
  { locale: 'en', topic: 'big breakfast or light breakfast' },
  { locale: 'en', topic: 'rain or sunshine' },
  { locale: 'en', topic: 'gym or outdoor running' },
  { locale: 'en', topic: 'photos or videos for memories' },
  { locale: 'en', topic: 'flight or train' },
  { locale: 'en', topic: 'cinema or couch' },
  { locale: 'en', topic: 'lake or sea' },
  { locale: 'en', topic: 'spring or autumn' },
  { locale: 'en', topic: 'texting or calling' },
  { locale: 'en', topic: 'fish or meat' },
  { locale: 'en', topic: 'traveling or staying home' },
  { locale: 'en', topic: 'team sports or solo sports' },
  { locale: 'en', topic: 'bold colors or neutral tones' },
  { locale: 'en', topic: 'dinner at home or restaurant' },
  { locale: 'en', topic: 'sunrise or sunset' },
  { locale: 'en', topic: 'snowy mountains or desert' },
  { locale: 'en', topic: 'smartphone or computer' },
  { locale: 'en', topic: 'wine or beer' },
  { locale: 'en', topic: 'formal or casual style' },
  { locale: 'en', topic: 'big city or small town' },
  { locale: 'en', topic: 'night owl or early bird' },
  { locale: 'en', topic: 'dry heat or cool humidity' },
  { locale: 'en', topic: 'music or podcasts' },
  { locale: 'en', topic: 'shower or bath' },
  { locale: 'en', topic: 'minimalism or maximalism' },
  { locale: 'en', topic: 'cats or birds as pets' },
  { locale: 'en', topic: 'hiking or swimming' },
]

// Curated seed topics — 32 per locale (4 per category × 8 categories), diverse and non-overlapping with static dilemmas.
// EN and IT topics cover different moral angles within each category — no direct translations between locales.
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
  { locale: 'en', category: 'relationships', topic: 'Would you agree to have a child with a partner you deeply love, if you genuinely do not want to be a parent?' },

  // ── IT — morality (4) ─────────────────────────────────────────────────────
  { locale: 'it', category: 'morality', topic: 'Un artista riceve una commissione molto remunerativa da un committente con valori etici opposti ai suoi: accetta il lavoro o lo rifiuta?' },
  { locale: 'it', category: 'morality', topic: 'È eticamente accettabile clonare esseri umani esclusivamente per scopi medici?' },
  { locale: 'it', category: 'morality', topic: 'Confessi un crimine di cui ti sei pentito, sapendo che rovinerai la tua vita e quella della tua famiglia?' },
  { locale: 'it', category: 'morality', topic: 'Scopri che un collega ha falsificato i dati di una ricerca che ha già salvato migliaia di vite: lo denunci rischiando di invalidare i trattamenti in corso?' },
  // ── IT — survival (4) ────────────────────────────────────────────────────
  { locale: 'it', category: 'survival', topic: 'Preferiresti vivere 60 anni in perfetta salute oppure 90 anni con qualità di vita ridotta?' },
  { locale: 'it', category: 'survival', topic: 'In guerra, è giustificabile sacrificare civili nemici per salvare i propri soldati?' },
  { locale: 'it', category: 'survival', topic: "Sei l'unico medico in una zona isolata con farmaci sufficienti per 20 dei 35 feriti gravi: decidi tu chi curare o aspetti istruzioni che non arriveranno?" },
  { locale: 'it', category: 'survival', topic: 'Nel tuo rifugio con altri 8 sopravvissuti le riserve di cibo bastano per sei mesi: decidi di razionare e aspettare i soccorsi, o rischi di uscire a cercarne altri?' },
  // ── IT — loyalty (4) ─────────────────────────────────────────────────────
  { locale: 'it', category: 'loyalty', topic: "Il tuo migliore amico ti confida di evadere le tasse da anni: lo incoraggi a smettere, taci per non rovinare l'amicizia, o lo segnali?" },
  { locale: 'it', category: 'loyalty', topic: 'Il tuo capo si prende pubblicamente il merito del tuo progetto migliore e in cambio ti promette una promozione: protesti o accetti il compromesso?' },
  { locale: 'it', category: 'loyalty', topic: 'Il tuo partner ti chiede di mantenere segreto ai suoi familiari un grave problema di salute: rispetti il segreto anche se sei convinto che dovrebbero saperlo?' },
  { locale: 'it', category: 'loyalty', topic: "La tua squadra ha vinto un torneo grazie a un errore arbitrale che nessuno ha contestato: chiedi tu l'annullamento del risultato, rovinando la festa a tutti?" },
  // ── IT — justice (4) ─────────────────────────────────────────────────────
  { locale: 'it', category: 'justice', topic: 'Denunceresti un medico che pratica eutanasia su pazienti terminali senza consenso esplicito?' },
  { locale: 'it', category: 'justice', topic: "Un giudice è convinto della colpevolezza dell'imputato, ma la condanna prevista dalla legge gli sembra sproporzionata: segue la legge o la sua coscienza?" },
  { locale: 'it', category: 'justice', topic: 'Una piccola comunità vuole vietare il ritorno di un ex detenuto che ha scontato interamente la pena: è una difesa legittima o una punizione aggiuntiva?' },
  { locale: 'it', category: 'justice', topic: 'Denunci un\'azienda che inquina illegalmente sapendo che la tua segnalazione farà perdere il lavoro a 200 lavoratori locali?' },
  // ── IT — freedom (4) ─────────────────────────────────────────────────────
  { locale: 'it', category: 'freedom', topic: 'È giusto limitare la libertà di parola online per prevenire la radicalizzazione?' },
  { locale: 'it', category: 'freedom', topic: "È giusto che le forze dell'ordine usino il riconoscimento facciale in tempo reale negli spazi pubblici per individuare sospettati ricercati?" },
  { locale: 'it', category: 'freedom', topic: 'Un governo ha il diritto di bloccare internet durante una grande protesta di piazza per prevenire la diffusione di notizie false?' },
  { locale: 'it', category: 'freedom', topic: 'È giusto imporre un coprifuoco notturno ai minorenni per ridurre la criminalità giovanile, anche se penalizza chi non ha mai commesso reati?' },
  // ── IT — technology (4) ──────────────────────────────────────────────────
  { locale: 'it', category: 'technology', topic: 'È etico usare dati di sorveglianza delle città per prevenire crimini prima che accadano?' },
  { locale: 'it', category: 'technology', topic: 'Useresti un\'app in grado di analizzare la voce del tuo partner per capire quando mente, senza dirglielo?' },
  { locale: 'it', category: 'technology', topic: 'Le aziende di intelligenza artificiale dovrebbero essere legalmente responsabili per i danni causati dalle decisioni autonome dei loro algoritmi?' },
  { locale: 'it', category: 'technology', topic: "La tua azienda offre ai lavoratori più anziani un bonus per formarsi sull'AI o uscire con una buona liquidazione: è adattamento pragmatico o discriminazione?" },
  // ── IT — society (4) ─────────────────────────────────────────────────────
  { locale: 'it', category: 'society', topic: "Un'azienda può licenziare un dipendente per i suoi post privati sui social che danneggiano il brand?" },
  { locale: 'it', category: 'society', topic: "Una scuola pubblica ha il diritto di vietare i simboli religiosi nell'abbigliamento per garantire la neutralità laica, anche se esclude alcune famiglie?" },
  { locale: 'it', category: 'society', topic: 'È giusto che i cittadini di un paese ricco paghino tasse più alte per accogliere un numero elevato di rifugiati, anche se la maggioranza degli elettori si oppone?' },
  { locale: 'it', category: 'society', topic: 'È etico visitare paesi governati da regimi autoritari se la tua spesa turistica contribuisce economicamente alla popolazione locale?' },
  // ── IT — relationships (4) ───────────────────────────────────────────────
  { locale: 'it', category: 'relationships', topic: 'Adotteresti un figlio con gravi disabilità cognitive sapendo che cambierà completamente la tua vita?' },
  { locale: 'it', category: 'relationships', topic: 'Scopri che il tuo genitore anziano vuole spendere tutti i risparmi per un viaggio rischioso che è il suo sogno di una vita: lo assecondo o mi oppongo per proteggerlo?' },
  { locale: 'it', category: 'relationships', topic: "Il tuo partner di lunga data ti chiede di lasciare il tuo paese per seguirlo definitivamente all'estero: scegli l'amore o le tue radici e la tua famiglia?" },
  { locale: 'it', category: 'relationships', topic: 'Stai per sposarti e scopri che il tuo partner ti ha tenuto nascosto di avere figli da una relazione precedente: continui il percorso verso il matrimonio o ti fermi?' },
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

// Selects `count` seeds from the pool sorted by ascending usage count (least-used first).
// Secondary sort by id for deterministic ordering when counts are equal.
function selectSeedPackTopics(
  seeds: ContentSeed[],
  usageMap: SeedUsageMap,
  count: number,
): ContentSeed[] {
  return [...seeds]
    .sort((a, b) => {
      const ua = usageMap[a.id]?.generatedCount ?? 0
      const ub = usageMap[b.id]?.generatedCount ?? 0
      return ua !== ub ? ua - ub : (a.id < b.id ? -1 : 1)
    })
    .slice(0, count)
}

// Filters a seed pool to seeds that are eligible for generation in the given locale.
// Applies three criteria in order: manual exclusion, usage suppression, inventory similarity.
// Lifestyle seeds skip the inventory similarity check (consistent with post-generation behaviour).
function getEligibleSeeds(
  seeds:    ContentSeed[],
  usageMap: SeedUsageMap,
  locale:   'en' | 'it',
  inventory: ContentItem[],
  style:    'moral' | 'lifestyle',
): { eligible: ContentSeed[]; excluded: Array<{ seedId: string; reason: string }> } {
  const eligible: ContentSeed[] = []
  const excluded: Array<{ seedId: string; reason: string }> = []

  for (const seed of seeds) {
    // 1. Manual exclusion / cooldown
    const manualCheck = isSeedExcluded(seed.id, locale)
    if (manualCheck.excluded) {
      excluded.push({ seedId: seed.id, reason: `${manualCheck.status}:${manualCheck.reason}` })
      continue
    }

    // 2. Usage suppression: repeatedly rejected with no successful saves
    const usage = usageMap[seed.id]
    if (usage && usage.rejectedCount >= 2 && usage.savedDraftCount === 0) {
      excluded.push({ seedId: seed.id, reason: `high_rejection:${usage.rejectedCount}_rejected_0_saved` })
      continue
    }

    // 3. Inventory similarity (moral only — lifestyle preference topics are inherently non-novel)
    if (style === 'moral') {
      const preCheck = scoreNovelty({ type: 'dilemma', locale, title: seed.topic }, inventory)
      const block = getPreflightBlock(preCheck)
      if (block !== null) {
        const closest = preCheck.similarItems[0]
        const label = closest
          ? `"${closest.title.slice(0, 48)}" (${closest.similarity}%)`
          : 'unknown'
        excluded.push({ seedId: seed.id, reason: `inventory_similar:${block}:${label}` })
        continue
      }
    }

    eligible.push(seed)
  }

  return { eligible, excluded }
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
  similarItems?:       { title: string; similarity: number; source?: string; locale?: string }[]
  topKeyword?:         string
  errorCode?:          string
  // Human-readable rejection reason (skipped_preflight / skipped_novelty only)
  rejectionReason?:    string
  // Auto-publish metadata
  publishNote?:        string    // 'quality_gate_failed' | 'publish_redis_error'
  qualityGateReasons?: string[]  // gate failure reasons (present when autoPublish was attempted)
  semanticVerdict?:           string
  semanticReason?:            string
  semanticClosestMatchTitle?: string
  // Seed pack metadata — present only in seedPack mode
  seedId?:                    string
  seedPackId?:                string
  usageCountBefore?:          number
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

  const seedPackMode = body.seedPackMode === true
  const rawSeedPackId: unknown = body.seedPackId
  if (seedPackMode && rawSeedPackId !== undefined) {
    if (typeof rawSeedPackId !== 'string' || !CONTENT_SEED_PACKS.some(p => p.id === (rawSeedPackId as string).trim())) {
      return NextResponse.json({ error: 'invalid_seed_pack_id' }, { status: 400 })
    }
  }
  const seedPackId = seedPackMode && typeof rawSeedPackId === 'string' ? rawSeedPackId.trim() : undefined
  const seedPackStyleFilter: 'moral' | 'lifestyle' =
    body.seedPackStyleFilter === 'lifestyle' ? 'lifestyle' : 'moral'

  const style: 'moral' | 'lifestyle' = body.style === 'lifestyle' ? 'lifestyle' : 'moral'
  const NOVELTY_THRESHOLD = style === 'lifestyle' ? LIFESTYLE_NOVELTY_THRESHOLD : MORAL_NOVELTY_THRESHOLD

  if (autoPublish && dryRun) {
    return NextResponse.json(
      { error: 'invalid_request', message: 'autoPublish cannot be combined with dryRun.' },
      { status: 400 },
    )
  }

  // ── Validate manualSeed ────────────────────────────────────────────────────
  const rawManualSeed: unknown = body.manualSeed
  let manualSeed: { topic: string; title?: string; angle?: string; notes?: string } | undefined

  if (rawManualSeed !== undefined) {
    if (typeof rawManualSeed !== 'object' || rawManualSeed === null) {
      return NextResponse.json({ error: 'invalid_manual_seed' }, { status: 400 })
    }
    const ms = rawManualSeed as Record<string, unknown>
    if (typeof ms.topic !== 'string' || ms.topic.trim().length < 3 || ms.topic.trim().length > 200) {
      return NextResponse.json({ error: 'invalid_manual_seed_topic' }, { status: 400 })
    }
    if (ms.title !== undefined && (typeof ms.title !== 'string' || ms.title.trim().length > 120)) {
      return NextResponse.json({ error: 'invalid_manual_seed_title' }, { status: 400 })
    }
    if (ms.angle !== undefined && (typeof ms.angle !== 'string' || ms.angle.trim().length > 240)) {
      return NextResponse.json({ error: 'invalid_manual_seed_angle' }, { status: 400 })
    }
    if (ms.notes !== undefined && (typeof ms.notes !== 'string' || ms.notes.trim().length > 600)) {
      return NextResponse.json({ error: 'invalid_manual_seed_notes' }, { status: 400 })
    }
    manualSeed = {
      topic: (ms.topic as string).trim(),
      ...(ms.title ? { title: (ms.title as string).trim() } : {}),
      ...(ms.angle ? { angle: (ms.angle as string).trim() } : {}),
      ...(ms.notes ? { notes: (ms.notes as string).trim() } : {}),
    }
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

  // manualSeed and customTopics are mutually exclusive
  if (manualSeed !== undefined && customTopics !== undefined) {
    return NextResponse.json(
      { error: 'invalid_request', message: 'Cannot combine manualSeed with topics override.' },
      { status: 400 },
    )
  }
  if (seedPackMode && (manualSeed !== undefined || customTopics !== undefined)) {
    return NextResponse.json(
      { error: 'invalid_request', message: 'Cannot combine seedPackMode with manualSeed or topics override.' },
      { status: 400 },
    )
  }

  // Load seed usage map once before topic selection (fail-open empty map when not in seedPack mode).
  const seedUsageMap: SeedUsageMap = seedPackMode ? await loadSeedUsageMap() : {}

  // ── Build topic list ────────────────────────────────────────────────────────
  // Populated in seedPack mode only; undefined otherwise (excluded from response).
  let seedEligibilitySummary: {
    seedPoolCount:      number
    eligibilityByLocale: Record<string, { eligible: number; excluded: number }>
    exclusionReasons:   Record<string, number>
  } | undefined = undefined

  const topicsToProcess: Array<{ locale: 'en' | 'it'; topic: string; category?: Category; angle?: string; notes?: string; seedId?: string; seedPackId?: string }> = []

  if (!seedPackMode && style === 'lifestyle' && manualSeed === undefined && customTopics === undefined) {
    // Lifestyle mode: random sample from LIFESTYLE_SEED_TOPICS (no category diversity needed)
    const lifestylePool = (locale === 'all' ? ['en', 'it'] : [locale as 'en' | 'it']) as Array<'en' | 'it'>
    for (const l of lifestylePool) {
      const pool = LIFESTYLE_SEED_TOPICS.filter(t => t.locale === l).sort(() => Math.random() - 0.5)
      const selected = pool.slice(0, count)
      for (const t of selected) topicsToProcess.push({ locale: l, topic: t.topic })
    }
  } else if (manualSeed !== undefined) {
    // Manual seed: same topic repeated `count` times per locale, with optional angle/notes hint.
    // Preflight and novelty guards still run per-entry.
    const effectiveTopic = manualSeed.title
      ? `${manualSeed.title} — ${manualSeed.topic}`
      : manualSeed.topic
    const locales: Array<'en' | 'it'> = locale === 'all' ? ['en', 'it'] : [locale as 'en' | 'it']
    for (const l of locales) {
      for (let j = 0; j < count; j++) {
        topicsToProcess.push({
          locale:  l,
          topic:   effectiveTopic,
          angle:   manualSeed.angle,
          notes:   manualSeed.notes,
        })
      }
    }
  } else if (customTopics !== undefined) {
    // Custom topics have no category annotation — targetCategory will be undefined (no hint)
    for (const topic of customTopics) {
      topicsToProcess.push({ locale: locale as 'en' | 'it', topic })
    }
  } else if (seedPackMode) {
    let seedPool = seedPackId ? getContentSeedsByPack(seedPackId) : getAllContentSeeds()
    seedPool = seedPool.filter(s => s.style === seedPackStyleFilter)

    const locales: Array<'en' | 'it'> = locale === 'all' ? ['en', 'it'] : [locale as 'en' | 'it']
    const eligibilityByLocale: Record<string, { eligible: number; excluded: number }> = {}
    const exclusionReasonCounts: Record<string, number> = {}

    for (const l of locales) {
      const { eligible, excluded } = getEligibleSeeds(seedPool, seedUsageMap, l, inventory, seedPackStyleFilter)
      eligibilityByLocale[l] = { eligible: eligible.length, excluded: excluded.length }
      for (const { reason } of excluded) {
        const category = reason.split(':')[0]
        exclusionReasonCounts[category] = (exclusionReasonCounts[category] ?? 0) + 1
      }

      const selectedSeeds = selectSeedPackTopics(eligible, seedUsageMap, count)
      if (selectedSeeds.length < count) {
        return NextResponse.json(
          {
            error: 'not_enough_eligible_seed_pack_topics',
            requested: count,
            availableAfterFilter: eligible.length,
            locale: l,
            seedPoolCount: seedPool.length,
            excludedCount: excluded.length,
            exclusionReasons: exclusionReasonCounts,
            message: `Not enough eligible seeds for locale '${l}' after eligibility filter. ${eligible.length} of ${seedPool.length} in pool eligible. Lower count, change pack, or review exclusion rules.`,
          },
          { status: 409 },
        )
      }

      for (const seed of selectedSeeds) {
        topicsToProcess.push({
          locale:     l,
          topic:      seed.topic,
          category:   seed.category,
          angle:      seed.angle,
          notes:      seed.notes,
          seedId:     seed.id,
          seedPackId: seed.packId,
        })
      }
    }

    seedEligibilitySummary = {
      seedPoolCount:      seedPool.length,
      eligibilityByLocale,
      exclusionReasons:   exclusionReasonCounts,
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
    const seedMeta: Partial<Pick<SeedResult, 'seedId' | 'seedPackId' | 'usageCountBefore'>> =
      topicsToProcess[i].seedId
        ? {
            seedId:           topicsToProcess[i].seedId!,
            seedPackId:       topicsToProcess[i].seedPackId,
            usageCountBefore: seedUsageMap[topicsToProcess[i].seedId!]?.generatedCount ?? 0,
          }
        : {}

    if (i > 0) await delay(400)

    const preCheck = scoreNovelty(
      { type: 'dilemma', locale: entryLocale, title: topic },
      inventory,
    )

    // Preflight similarity guard — skipped for lifestyle (preference topics are inherently similar).
    // Default topics are pre-filtered before selection; this is the safety net for custom topics
    // and for state changes that occurred since the pre-filter ran (e.g. new drafts mid-batch).
    const preflightBlock = style === 'lifestyle' ? null : getPreflightBlock(preCheck)
    if (preflightBlock !== null) {
      const closestPre = preCheck.similarItems[0]
      const rejectionReason = closestPre
        ? `Too similar to ${preflightBlock === 'too_similar_to_draft' ? 'draft' : closestPre.status} [${closestPre.locale?.toUpperCase() ?? '?'}]: "${closestPre.title.slice(0, 48)}" (${closestPre.similarity}%)`
        : preflightBlock === 'too_similar_to_draft' ? 'Too similar to existing draft' : 'Too similar to existing content'
      results.push({
        index:             i + 1,
        locale:            entryLocale,
        topic,
        status:            'skipped_preflight',
        noveltyScore:      preCheck.noveltyScore,
        similarItemsCount: preCheck.similarItems.length,
        similarItems:      preCheck.similarItems.slice(0, 3).map(s => ({ title: s.title, similarity: s.similarity, source: s.status, locale: s.locale })),
        rejectionReason,
        publishNote:       preflightBlock,
        ...seedMeta,
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

    const existingLifestyleQs = style === 'lifestyle'
      ? inventory.filter(x => x.type === 'dilemma' && x.category === 'lifestyle' && x.locale === entryLocale).map(x => x.title).slice(0, 6)
      : []
    const { system, prompt } = style === 'lifestyle'
      ? buildLifestyleDilemmaPrompt(entryLocale, topic, existingLifestyleQs)
      : buildDilemmaPrompt({
          type:           'dilemma',
          locale:         entryLocale,
          topic,
          targetCategory: topicsToProcess[i].category,
          inventory:      inventorySummary,
          similarContentWarnings: similarWarnings,
          angle:          topicsToProcess[i].angle,
          notes:          topicsToProcess[i].notes,
        })

    openRouterCalls++
    const generated = await generateWithOpenRouter({ system, prompt })

    if (!generated.ok) {
      results.push({ index: i + 1, locale: entryLocale, topic, status: 'error', ...seedMeta, errorCode: generated.error })
      errors++
      continue
    }

    const validation = validateGeneratedOutput(generated.text, 'dilemma', entryLocale, inventory)

    if (!validation.ok) {
      results.push({ index: i + 1, locale: entryLocale, topic, status: 'error', ...seedMeta, errorCode: validation.error })
      errors++
      continue
    }

    const candidate = validation.candidate as ValidatedDilemma

    // Archetype saturation penalty — skipped for lifestyle (no moral archetypes to detect).
    const hasArchetypeSaturation = style === 'lifestyle' ? false : (() => {
      const candidateText = `${candidate.question} ${candidate.optionA} ${candidate.optionB}`
      const matchedArchetypes = detectMoralArchetypes(candidateText)
      const saturatedMatches = matchedArchetypes.filter(id => (archetypeSaturation.get(id) ?? 0) >= ARCHETYPE_THRESHOLD)
      if (saturatedMatches.length > 0) {
        const penalty = Math.min(15, saturatedMatches.length * 8)
        candidate.noveltyScore = Math.max(0, candidate.noveltyScore - penalty)
        for (const id of saturatedMatches) candidate.warnings.push(`archetype_saturation:${id}`)
      }
      return saturatedMatches.length > 0
    })()

    if (candidate.noveltyScore < NOVELTY_THRESHOLD) {
      const closestNov = candidate.similarItems[0]
      const rejectionReason = closestNov
        ? `Novelty ${candidate.noveltyScore}/100 — similar to ${closestNov.status} [${(closestNov.locale ?? '?').toUpperCase()}]: "${closestNov.title.slice(0, 40)}" (${closestNov.similarity}%)`
        : `Novelty score ${candidate.noveltyScore}/100 below threshold ${NOVELTY_THRESHOLD}`
      results.push({
        index:             i + 1,
        locale:            entryLocale,
        topic,
        status:            'skipped_novelty',
        noveltyScore:      candidate.noveltyScore,
        similarItemsCount: candidate.similarItems.length,
        similarItems:      candidate.similarItems.slice(0, 3).map(s => ({ title: s.title, similarity: s.similarity, source: s.status, locale: s.locale })),
        rejectionReason,
        category:          candidate.category,
        question:          candidate.question,
        topKeyword:        candidate.keywords[0],
        ...seedMeta,
      })
      skipped++
      continue
    }

    // ── Semantic review (skipped for lifestyle — preference Q's are inherently similar) ──
    let semanticResult: SemanticReviewResult | undefined
    let hasSemanticBlock = false
    let reviewOutcome: Awaited<ReturnType<typeof runSemanticReview>> = { ok: false as const, error: 'skipped' }

    if (style !== 'lifestyle') {
      const comparisonItems = buildComparisonItems(
        entryLocale,
        candidate.category,
        candidate.similarItems.map(s => ({ id: s.id, title: s.title })),
        inventory,
      )
      reviewOutcome = await runSemanticReview(
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
    }

    const scenario = dilemmaToScenario(candidate, topic)
    if (style === 'lifestyle') scenario.dilemmaStyle = 'lifestyle'
    if (semanticResult) {
      scenario.semanticReview = {
        verdict:           semanticResult.verdict,
        reason:            semanticResult.reason,
        closestMatchId:    semanticResult.closestMatch?.id,
        closestMatchTitle: semanticResult.closestMatch?.title,
      }
    }

    if (hasSemanticBlock && semanticResult) {
      const rejectionReason = semanticResult.closestMatch
        ? `Semantic ${semanticResult.verdict} — closest match: "${semanticResult.closestMatch.title.slice(0, 56)}"`
        : `Semantic ${semanticResult.verdict} — ${semanticResult.reason}`
      results.push({
        index:                     i + 1,
        locale:                    entryLocale,
        topic,
        status:                    'skipped_novelty',
        category:                  candidate.category,
        question:                  candidate.question,
        noveltyScore:              candidate.noveltyScore,
        similarItemsCount:         candidate.similarItems.length,
        similarItems:              candidate.similarItems.slice(0, 3).map(s => ({ title: s.title, similarity: s.similarity, source: s.status, locale: s.locale })),
        topKeyword:                candidate.keywords[0],
        rejectionReason,
        semanticVerdict:           semanticResult.verdict,
        semanticReason:            semanticResult.reason,
        semanticClosestMatchTitle: semanticResult.closestMatch?.title,
        ...seedMeta,
      })
      skipped++
      continue
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
        similarItems:      candidate.similarItems.slice(0, 3).map(s => ({ title: s.title, similarity: s.similarity, source: s.status, locale: s.locale })),
        topKeyword:        candidate.keywords[0],
        ...(semanticResult ? {
          semanticVerdict:           semanticResult.verdict,
          semanticReason:            semanticResult.reason,
          semanticClosestMatchTitle: semanticResult.closestMatch?.title,
        } : (!reviewOutcome.ok ? { semanticVerdict: 'review_failed' } : {})),
        ...seedMeta,
      })
      dryRunPassed++
    } else {
      // ── Attempt auto-publish when requested and cap not reached ────────────
      let didPublish     = false
      let publishNote:     string   | undefined
      let gateReasons:    string[] | undefined

      const lifestyleAutoPublishEligible = style === 'lifestyle' && !hasSemanticBlock
      const moralAutoPublishEligible     = style !== 'lifestyle' && !hasArchetypeSaturation && !hasSemanticBlock && reviewOutcome.ok
      if (autoPublish && autoPublishedCount < AUTO_PUBLISH_CAP && (lifestyleAutoPublishEligible || moralAutoPublishEligible)) {
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
          dilemmaStyle:      style,
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
              similarItems:      candidate.similarItems.slice(0, 3).map(s => ({ title: s.title, similarity: s.similarity, source: s.status, locale: s.locale })),
              topKeyword:        candidate.keywords[0],
              qualityGateReasons: [],
              ...(semanticResult ? {
                semanticVerdict:           semanticResult.verdict,
                semanticReason:            semanticResult.reason,
                semanticClosestMatchTitle: semanticResult.closestMatch?.title,
              } : {}),
              ...seedMeta,
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
            similarItems:      candidate.similarItems.slice(0, 3).map(s => ({ title: s.title, similarity: s.similarity, source: s.status, locale: s.locale })),
            topKeyword:        candidate.keywords[0],
            ...(publishNote  ? { publishNote }          : {}),
            ...(gateReasons  ? { qualityGateReasons: gateReasons } : {}),
            ...(semanticResult ? {
              semanticVerdict:           semanticResult.verdict,
              semanticReason:            semanticResult.reason,
              semanticClosestMatchTitle: semanticResult.closestMatch?.title,
            } : (!reviewOutcome.ok ? { semanticVerdict: 'review_failed' } : {})),
            ...seedMeta,
          })
          savedDrafts++
        } catch {
          results.push({ index: i + 1, locale: entryLocale, topic, status: 'error', ...seedMeta, errorCode: 'redis_save_failed' })
          errors++
        }
      }
    }
  }

  // ── Persist seed usage (fail-open, seedPack mode only) ─────────────────────
  if (seedPackMode) {
    const usageUpdates = results.filter(r => r.seedId).map(r => ({ seedId: r.seedId!, status: r.status }))
    if (usageUpdates.length > 0) {
      await saveSeedUsageMap(batchUpdateSeedUsage(usageUpdates, seedUsageMap))
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
      ...(seedEligibilitySummary ? { seedEligibility: seedEligibilitySummary } : {}),
    },
    dryRun,
    autoPublish,
    style,
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
