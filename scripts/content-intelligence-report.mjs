#!/usr/bin/env node
/**
 * content-intelligence-report.mjs — Content Intelligence Agent v1
 *
 * Run:   npm run content:intelligence
 * Output:
 *   content-output/content-intelligence-report-YYYY-MM-DD.json
 *   content-output/content-intelligence-report-YYYY-MM-DD.md
 *
 * SAFE_AUTONOMOUS — read-only. Reads Redis (approved + drafts + seed usage).
 * No writes, no AI calls, no auto-publish, no draft creation, no OpenRouter.
 * Falls back to static-only mode when .env.local is missing or Redis is down.
 *
 * Sections:
 *   1.  Inventory summary            — static + dynamic, by locale × category
 *   2.  Semantic duplicate pairs     — approved dynamic cross-compare (Jaccard)
 *   3.  Moral archetype saturation   — which archetypes are overrepresented
 *   4.  Category distribution        — gaps, surplus, and balance per locale
 *   5.  Active seed exclusions       — manual cooldown/block list
 *   6.  Burned / suppressed seeds    — high rejection rate, 0 saves
 *   7.  Seed pack conversion ratios  — per-pack generated → saved stats
 *   8.  Seeds to expand              — low usage, high conversion potential
 *   9.  Seeds to avoid               — overused archetypes, saturation risk
 *  10.  Cooldown recommendations     — new candidates not yet excluded
 *  11.  Content gaps & opportunities — underrepresented themes
 *  12.  Landing page candidates      — categories with volume but no SEO page
 *  13.  Locale balance               — EN vs IT approved count
 *  14.  Picoclaw intake placeholder  — format for future trend data intake
 */

import fs   from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT      = path.resolve(__dirname, '..')

// ── Load .env.local (graceful — static-only when missing) ─────────────────────

function loadEnvFile() {
  try {
    const content = fs.readFileSync(path.join(ROOT, '.env.local'), 'utf8')
    for (const line of content.split('\n')) {
      const t = line.trim()
      if (!t || t.startsWith('#')) continue
      const eq  = t.indexOf('=')
      if (eq === -1) continue
      const key = t.slice(0, eq).trim()
      const val = t.slice(eq + 1).trim().replace(/^["']|["']$/g, '')
      if (!process.env[key]) process.env[key] = val
    }
  } catch { /* .env.local absent — Redis will be skipped */ }
}
loadEnvFile()

// ── Upstash REST helper ───────────────────────────────────────────────────────

const UPSTASH_URL   = process.env.KV_REST_API_URL   ?? process.env.UPSTASH_REDIS_REST_URL   ?? ''
const UPSTASH_TOKEN = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN ?? ''
const REDIS_OK      = Boolean(UPSTASH_URL && UPSTASH_TOKEN)

async function redisGet(key) {
  if (!REDIS_OK) return null
  try {
    const r = await fetch(`${UPSTASH_URL}/get/${encodeURIComponent(key)}`, {
      headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` },
    })
    if (!r.ok) return null
    const j = await r.json()
    if (j.result == null) return null
    return typeof j.result === 'string' ? JSON.parse(j.result) : j.result
  } catch { return null }
}

// ── Text similarity (Jaccard on 4+ char tokens) ───────────────────────────────

function norm(t) {
  return t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'')
    .replace(/[^\w\s]/g,' ').replace(/\s+/g,' ').trim()
}
function tokens(t) { return new Set(norm(t).split(' ').filter(w => w.length > 3)) }
function jaccard(a, b) {
  const sa = tokens(a), sb = tokens(b)
  const inter = [...sa].filter(x => sb.has(x)).length
  const union = new Set([...sa, ...sb]).size
  return union === 0 ? 0 : inter / union
}

// ── Moral archetypes (mirror of lib/content-dedup.ts) ─────────────────────────

const ARCHETYPES = [
  { id: 'sacrifice_minority',   label: 'sacrifice one to save many',
    kw: ['sacrifice','organ','parachute','lifeboat','overboard','divert','sacrificare','organi','scialuppa','sacrificio'],
    sk: ['trolley','organ harvest'] },
  { id: 'loyalty_vs_justice',  label: 'loyalty vs justice — report or protect',
    kw: ['report','police','crime','cover','betray','criminal','whistleblower','arrest','denunciare','polizia','crimine','coprire','tradire','criminale'] },
  { id: 'truth_vs_kindness',   label: 'truth vs kindness — white lie',
    kw: ['honest','deceive','cheat','affair','confess','admit','bugia','onesta','ingannare','tradimento','confessare'],
    sk: ['white lie','tell the truth','dire la verita'] },
  { id: 'autonomy_vs_mandate', label: 'individual rights vs collective mandate',
    kw: ['mandatory','compulsory','restrict','regulate','mandate','obbligatorio','obbligatoria','coercitivo','vietare'],
    sk: ['forced vaccination','vaccinazione obbligatoria'] },
  { id: 'ai_surveillance',     label: 'AI surveillance / algorithmic control',
    kw: ['algorithm','surveillance','biometric','deepfake','automated','algoritmo','sorveglianza','biometrico'],
    sk: ['facial recognition','riconoscimento facciale','predictive policing'] },
  { id: 'end_of_life',         label: 'end of life — euthanasia / assisted dying',
    kw: ['terminal','mercy','suffering','lethal','palliative','dying','terminale','sofferenza','letale','morente'],
    sk: ['euthanasia','eutanasia','assisted dying','morte assistita'] },
  { id: 'wealth_inequality',   label: 'wealth redistribution / taxation',
    kw: ['billionaire','wealth','inequality','redistribute','fortune','miliardario','ricchezza','disuguaglianza'],
    sk: ['universal basic income','reddito universale','wealth tax'] },
  { id: 'love_vs_duty',        label: 'love vs career / romantic sacrifice',
    kw: ['career','relocate','relationship','caregiver','marriage','carriera','relazione','badante','matrimonio'],
    sk: ['give up career','loveless marriage','rinunciare alla carriera'] },
  { id: 'identity_modification', label: 'consciousness — memory / identity change',
    kw: ['consciousness','upload','erase','simulate','clone','implant','coscienza','cancellare','simulare','clonare'],
    sk: ['neural implant','chip neurale','digital immortality'] },
  { id: 'resource_scarcity',   label: 'medical / resource scarcity allocation',
    kw: ['triage','transplant','allocation','shortage','trapianto','allocazione','carenza'],
    sk: ['last vaccine','ultimo vaccino','organ transplant'] },
]

function detectArchetypes(text) {
  const lo = norm(text)
  return ARCHETYPES.filter(a => {
    const hits = a.kw.filter(k => lo.includes(norm(k))).length
    const strong = (a.sk ?? []).some(k => lo.includes(norm(k)))
    return strong || hits >= 2
  }).map(a => a.id)
}

// ── Seed catalog: full seedId → packId mapping ────────────────────────────────
// Source: lib/content-seed-packs.ts (manually synced — update when packs change)

const SEED_PACK_INDEX = {
  // work-career (15)
  'salary-transparency-coworkers':'work-career','remote-work-office-fairness':'work-career',
  'firing-underperforming-friend':'work-career','ai-replacing-junior-employees':'work-career',
  'burnout-leave-overloaded-team':'work-career','refusing-unpaid-overtime':'work-career',
  'reporting-toxic-manager':'work-career','taking-credit-for-team-work':'work-career',
  'higher-pay-while-others-struggle':'work-career','culture-fit-vs-skill':'work-career',
  'workplace-productivity-surveillance':'work-career','return-office-company-culture':'work-career',
  'quitting-without-notice':'work-career','exposing-pay-discrimination':'work-career',
  'automating-colleague-job':'work-career',
  // couples-dating (15)
  'financial-secrecy-relationship':'couples-dating','reading-partner-messages':'couples-dating',
  'forgiving-cheating-once':'couples-dating','staying-together-for-children':'couples-dating',
  'open-relationship-ultimatum':'couples-dating','moving-abroad-for-partner-career':'couples-dating',
  'hiding-past-relationships':'couples-dating','splitting-rent-by-income':'couples-dating',
  'family-disapproval-partner':'couples-dating','sharing-location-permanently':'couples-dating',
  'prenuptial-agreement-fairness':'couples-dating','emotional-vs-physical-cheating':'couples-dating',
  'breaking-up-by-text':'couples-dating','dating-friend-ex':'couples-dating',
  'backup-plan-relationship':'couples-dating',
  // family-parents (15)
  'tracking-teen-phone':'family-parents','posting-children-photos-online':'family-parents',
  'inheritance-help-one-child':'family-parents','elderly-parent-care-vs-career':'family-parents',
  'forcing-child-apologize':'family-parents','private-school-one-child':'family-parents',
  'hiding-family-debt':'family-parents','cutting-off-toxic-relative':'family-parents',
  'disciplining-another-child':'family-parents','painful-family-truth':'family-parents',
  'embryo-selection-family':'family-parents','caring-for-absent-parents':'family-parents',
  'moving-away-family-obligations':'family-parents','grandparents-override-rules':'family-parents',
  'siblings-inheritance-conflict':'family-parents',
  // friends-loyalty (15)
  'friend-drunk-driving':'friends-loyalty','friend-cheating-secret':'friends-loyalty',
  'lending-money-friend':'friends-loyalty','excluding-friend-trip':'friends-loyalty',
  'racist-jokes-friend-group':'friends-loyalty','friend-bad-partner':'friends-loyalty',
  'choosing-between-friends':'friends-loyalty','sharing-private-screenshots':'friends-loyalty',
  'ghosting-draining-friend':'friends-loyalty','friend-resume-lie':'friends-loyalty',
  'standing-by-cancelled-friend':'friends-loyalty','friend-addiction-family':'friends-loyalty',
  'refusing-wedding-role':'friends-loyalty','friendship-over-politics':'friends-loyalty',
  'defending-wrong-friend':'friends-loyalty',
  // money-class-fairness (15)
  'wealth-tax-billionaires':'money-class-fairness','student-debt-forgiveness':'money-class-fairness',
  'tipping-fatigue':'money-class-fairness','luxury-spending-during-crisis':'money-class-fairness',
  'inheritance-tax-fairness':'money-class-fairness','rent-control-landlord-rights':'money-class-fairness',
  'universal-basic-income':'money-class-fairness','unpaid-internships':'money-class-fairness',
  'charity-with-strings':'money-class-fairness','returning-found-cash':'money-class-fairness',
  'price-gouging-shortages':'money-class-fairness','family-connections-job':'money-class-fairness',
  'influencer-exposure-payment':'money-class-fairness','split-bills-income':'money-class-fairness',
  'lottery-family-obligations':'money-class-fairness',
  // technology-ai (15)
  'deepfake-evidence-guilty':'technology-ai','ai-judges-minor-cases':'technology-ai',
  'ai-therapist-replacement':'technology-ai','autonomous-car-passenger-pedestrian':'technology-ai',
  'ai-art-living-artists':'technology-ai','workplace-ai-monitoring':'technology-ai',
  'facial-recognition-schools':'technology-ai','children-smartphone-ban':'technology-ai',
  'neural-implants-productivity':'technology-ai','algorithmic-hiring-fairness':'technology-ai',
  'robot-caregivers-elderly':'technology-ai','ai-news-anchors':'technology-ai',
  'cloning-dead-loved-one-voice':'technology-ai','predictive-policing':'technology-ai',
  'mandatory-digital-id':'technology-ai',
  // social-media-internet (15)
  'public-shaming-old-posts':'social-media-internet','creator-private-behavior':'social-media-internet',
  'delete-social-media-mental-health':'social-media-internet','exposing-anonymous-trolls':'social-media-internet',
  'filming-strangers-public':'social-media-internet','influencer-bad-advice':'social-media-internet',
  'parents-monetizing-children':'social-media-internet','dating-app-background-checks':'social-media-internet',
  'beauty-filter-ad-ban':'social-media-internet','paying-for-verification':'social-media-internet',
  'doomscrolling-limits-law':'social-media-internet','anonymous-confession-pages':'social-media-internet',
  'viral-charity-videos':'social-media-internet','posting-during-tragedy':'social-media-internet',
  'leaking-private-group-chats':'social-media-internet',
  // society-civic-life (15)
  'protest-blocking-emergency-traffic':'society-civic-life','mandatory-voting':'society-civic-life',
  'jury-duty-refusal':'society-civic-life','whistleblowing-national-secrets':'society-civic-life',
  'climate-flight-restrictions':'society-civic-life','ban-cars-city-centers':'society-civic-life',
  'street-surveillance-cameras':'society-civic-life','school-vaccine-mandates':'society-civic-life',
  'controversial-art-public-funding':'society-civic-life','citizens-vs-migrants-priority':'society-civic-life',
  'prison-punishment-rehabilitation':'society-civic-life','criminal-second-chance':'society-civic-life',
  'hate-speech-ban':'society-civic-life','military-draft-crisis':'society-civic-life',
  'civil-disobedience-unjust-laws':'society-civic-life',
  // education-school (15)
  'ai-homework':'education-school','grading-effort-vs-results':'education-school',
  'reporting-friend-cheating':'education-school','school-uniforms':'education-school',
  'phones-banned-classrooms':'education-school','elite-schools-equal-funding':'education-school',
  'teachers-monitor-social-media':'education-school','parents-pressure-teachers-grades':'education-school',
  'public-student-ranking':'education-school','expelling-bullies':'education-school',
  'zero-tolerance-discipline':'education-school','homework-family-hardship':'education-school',
  'paying-students-good-grades':'education-school','hiding-bad-grades':'education-school',
  'legacy-college-admissions':'education-school',
  // health-bioethics (15)
  'organ-donation-opt-out':'health-bioethics','refusing-treatment-religious':'health-bioethics',
  'scarce-icu-bed-allocation':'health-bioethics','genetic-embryo-selection':'health-bioethics',
  'assisted-dying':'health-bioethics','vaccine-refusal-public-spaces':'health-bioethics',
  'teen-cosmetic-surgery':'health-bioethics','weight-loss-drugs-appearance':'health-bioethics',
  'selling-kidney':'health-bioethics','mental-health-days-work':'health-bioethics',
  'prioritizing-younger-patients':'health-bioethics','experimental-drugs-without-approval':'health-bioethics',
  'insurance-penalties-lifestyle':'health-bioethics','dna-databases-crime':'health-bioethics',
  'cloning-extinct-animals':'health-bioethics',
  // environment-climate (15)
  'ban-short-flights':'environment-climate','meat-tax':'environment-climate',
  'climate-protests-property-damage':'environment-climate','personal-carbon-limits':'environment-climate',
  'nuclear-power-expansion':'environment-climate','geoengineering-atmosphere':'environment-climate',
  'corporate-emissions-disclosure':'environment-climate','fast-fashion-ban':'environment-climate',
  'relocating-climate-risk-communities':'environment-climate','polluting-industry-jobs':'environment-climate',
  'water-rationing':'environment-climate','rewilding-farmland':'environment-climate',
  'eco-sabotage':'environment-climate','carbon-credits-rich':'environment-climate',
  'synthetic-meat-schools':'environment-climate',
  // lifestyle-identity (15)
  'city-vs-countryside':'lifestyle-identity','career-vs-free-time':'lifestyle-identity',
  'rent-free-travel-life':'lifestyle-identity','minimalist-life-vs-comfort':'lifestyle-identity',
  'synthetic-food-vs-traditional':'lifestyle-identity','no-alcohol-lifestyle-pressure':'lifestyle-identity',
  'four-day-week-less-pay':'lifestyle-identity','deleting-dating-apps':'lifestyle-identity',
  'living-with-parents-save-money':'lifestyle-identity','choosing-no-children':'lifestyle-identity',
  'moving-quality-of-life':'lifestyle-identity','luxury-convenience-environment':'lifestyle-identity',
  'experiences-vs-savings':'lifestyle-identity','public-gym-filming':'lifestyle-identity',
  'household-chores-time-income':'lifestyle-identity',
  // consumer-brand-safe (15)
  'trying-lab-grown-food':'consumer-brand-safe','ethical-products-pay-more':'consumer-brand-safe',
  'brand-boycott-scandal':'consumer-brand-safe','subscription-fatigue':'consumer-brand-safe',
  'buying-refurbished-tech':'consumer-brand-safe','returning-worn-clothing':'consumer-brand-safe',
  'buy-now-pay-later':'consumer-brand-safe','paying-for-ad-free-apps':'consumer-brand-safe',
  'privacy-over-convenience':'consumer-brand-safe','fast-delivery-worker-conditions':'consumer-brand-safe',
  'dynamic-pricing-fairness':'consumer-brand-safe','loyalty-program-tracking':'consumer-brand-safe',
  'renting-instead-owning':'consumer-brand-safe','fake-scarcity-marketing':'consumer-brand-safe',
  'influencer-product-disclosure':'consumer-brand-safe',
  // current-events-evergreen (15)
  'artist-artwork-scandal':'current-events-evergreen','public-figures-private-speech':'current-events-evergreen',
  'tech-founders-public-platforms':'current-events-evergreen','athletes-national-event-protest':'current-events-evergreen',
  'companies-political-positions':'current-events-evergreen','foreign-owned-app-ban':'current-events-evergreen',
  'billionaires-public-projects':'current-events-evergreen','social-media-viral-trials':'current-events-evergreen',
  'misinformation-emergencies':'current-events-evergreen','classified-leaks-whistleblowers':'current-events-evergreen',
  'private-jets-celebrities':'current-events-evergreen','strikes-disrupt-public-services':'current-events-evergreen',
  'ai-public-data-training':'current-events-evergreen','schools-culture-war-debates':'current-events-evergreen',
  'public-apologies-backlash':'current-events-evergreen',
  // fun-low-stakes-viral (15)
  'truth-or-believed':'fun-low-stakes-viral','no-phone-or-no-travel':'fun-low-stakes-viral',
  'free-rent-or-dream-job':'fun-low-stakes-viral','public-life-or-private-life':'fun-low-stakes-viral',
  'restart-life-or-continue-money':'fun-low-stakes-viral','loved-by-everyone-or-known-by-few':'fun-low-stakes-viral',
  'never-lie-or-never-lied-to':'fun-low-stakes-viral','read-minds-or-hide-thoughts':'fun-low-stakes-viral',
  'health-or-money':'fun-low-stakes-viral','fame-one-year-or-comfort':'fun-low-stakes-viral',
  'know-when-or-how-you-die':'fun-low-stakes-viral','undo-mistake-or-future-success':'fun-low-stakes-viral',
  'always-early-or-calm':'fun-low-stakes-viral','lose-social-or-streaming':'fun-low-stakes-viral',
  'past-wealth-or-future-uncertainty':'fun-low-stakes-viral',
  // hard-compromise-dilemmas (15)
  'save-innocent-or-expose-many':'hard-compromise-dilemmas','family-crime-or-public-safety':'hard-compromise-dilemmas',
  'truth-that-destroys-recovery':'hard-compromise-dilemmas','sacrifice-whistleblower-source':'hard-compromise-dilemmas',
  'deny-treatment-unfair-queue':'hard-compromise-dilemmas','protect-child-or-respect-parent':'hard-compromise-dilemmas',
  'hire-desperate-liar-or-honest-candidate':'hard-compromise-dilemmas','evict-one-family-or-risk-building':'hard-compromise-dilemmas',
  'algorithm-saves-more-but-discriminates':'hard-compromise-dilemmas','public-shame-dangerous-person':'hard-compromise-dilemmas',
  'lie-to-keep-peace-after-death':'hard-compromise-dilemmas','accept-dirty-money-for-good':'hard-compromise-dilemmas',
  'choose-least-unfair-layoffs':'hard-compromise-dilemmas','protect-privacy-or-prevent-suicide-risk':'hard-compromise-dilemmas',
  'refuse-refuge-to-protect-your-group':'hard-compromise-dilemmas',
  // psychological-pressure-tests (15)
  'loss-aversion-sure-loss-vs-risk':'psychological-pressure-tests','authority-order-harms-someone':'psychological-pressure-tests',
  'conformity-group-wrong-answer':'psychological-pressure-tests','bystander-effect-private-action':'psychological-pressure-tests',
  'ultimatum-fairness-or-money':'psychological-pressure-tests','delay-gratification-family-pressure':'psychological-pressure-tests',
  'moral-foundations-loyalty-fairness':'psychological-pressure-tests','purity-disgust-useful-benefit':'psychological-pressure-tests',
  'identity-threat-changing-mind':'psychological-pressure-tests','scarcity-mindset-sharing':'psychological-pressure-tests',
  'status-competition-help-rival':'psychological-pressure-tests','honesty-humility-hidden-advantage':'psychological-pressure-tests',
  'agreeableness-boundary-guilt':'psychological-pressure-tests','conscientiousness-rule-mercy':'psychological-pressure-tests',
  'risk-tolerance-warning-future':'psychological-pressure-tests',
}

const SEED_PACKS_META = [
  { id:'work-career',               label:'Work / Career',                   targetShare:0.12 },
  { id:'couples-dating',            label:'Couples / Dating',                targetShare:0.10 },
  { id:'family-parents',            label:'Family / Parents',                targetShare:0.10 },
  { id:'friends-loyalty',           label:'Friends / Loyalty',               targetShare:0.08 },
  { id:'money-class-fairness',      label:'Money / Class / Fairness',        targetShare:0.08 },
  { id:'technology-ai',             label:'Technology / AI',                 targetShare:0.10 },
  { id:'social-media-internet',     label:'Social Media / Internet',         targetShare:0.08 },
  { id:'society-civic-life',        label:'Society / Civic Life',            targetShare:0.08 },
  { id:'education-school',          label:'Education / School',              targetShare:0.06 },
  { id:'health-bioethics',          label:'Health / Bioethics',              targetShare:0.07 },
  { id:'environment-climate',       label:'Environment / Climate',           targetShare:0.06 },
  { id:'lifestyle-identity',        label:'Lifestyle / Identity',            targetShare:0.08 },
  { id:'consumer-brand-safe',       label:'Consumer / Brand',                targetShare:0.05 },
  { id:'current-events-evergreen',  label:'Current-events Evergreen',        targetShare:0.07 },
  { id:'fun-low-stakes-viral',      label:'Fun / Low-stakes Viral',          targetShare:0.05 },
  { id:'hard-compromise-dilemmas',  label:'Hard Compromise Dilemmas',        targetShare:0.08 },
  { id:'psychological-pressure-tests', label:'Psychological Pressure Tests', targetShare:0.08 },
]

// ── Active seed exclusions (mirror of lib/content-seed-exclusions.ts) ─────────

const SEED_EXCLUSIONS = [
  { seedId:'know-when-or-how-you-die',          status:'cooldown', reason:'×10 semantic duplicates in last batch; mortality saturation' },
  { seedId:'loved-by-everyone-or-known-by-few', status:'cooldown', reason:'×10 semantic duplicates; fame/intimacy angle saturated' },
  { seedId:'never-lie-or-never-lied-to',        status:'cooldown', reason:'×9 semantic duplicates; honesty/deception already covered' },
]
const EXCLUDED_SET = new Set(SEED_EXCLUSIONS.map(e => e.seedId))

// ── Known SEO landing page categories ─────────────────────────────────────────

const HAS_LANDING_PAGE = new Set(['morality','survival','loyalty','justice','freedom','technology','society','relationships'])

// ── Static scenario counts (from lib/scenarios.ts — update if scenarios change) ─

const STATIC_BY_CATEGORY = {
  en: { morality:6, survival:4, loyalty:4, justice:4, freedom:4, technology:4, society:4, relationships:4 },
  it: { morality:4, survival:4, loyalty:4, justice:4, freedom:4, technology:4, society:4, relationships:4 },
}
const STATIC_TOTAL = { en:34, it:32 }

// ── Output paths ──────────────────────────────────────────────────────────────

const today   = new Date().toISOString().slice(0,10)
const outDir  = path.join(ROOT, 'content-output')
const outJson = path.join(outDir, `content-intelligence-report-${today}.json`)
const outMd   = path.join(outDir, `content-intelligence-report-${today}.md`)

if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true })

// ── Console helpers ───────────────────────────────────────────────────────────

function section(n, title) {
  console.log(`\n${'─'.repeat(56)}`)
  console.log(`  ${n}. ${title}`)
  console.log('─'.repeat(56))
}

// ═════════════════════════════════════════════════════════════
//   MAIN
// ═════════════════════════════════════════════════════════════

console.log('\n══════════════════════════════════════════════════════════')
console.log('  SplitVote — Content Intelligence Agent v1')
console.log(`  ${new Date().toISOString()}`)
console.log('══════════════════════════════════════════════════════════')
if (!REDIS_OK) {
  console.log('  ⚠  Redis credentials not found — static-only mode')
} else {
  console.log('  ✓ Redis connected')
}

// ── Fetch from Redis ──────────────────────────────────────────────────────────

const [approvedRaw, draftsRaw, seedUsageRaw] = await Promise.all([
  redisGet('dynamic:scenarios'),
  redisGet('dynamic:drafts'),
  redisGet('content:seed-usage:v1'),
])

const approved  = Array.isArray(approvedRaw)  ? approvedRaw  : []
const drafts    = Array.isArray(draftsRaw)    ? draftsRaw    : []
const usageMap  = (seedUsageRaw && typeof seedUsageRaw === 'object') ? seedUsageRaw : {}

// ── §1 Inventory Summary ──────────────────────────────────────────────────────

section(1, 'Inventory Summary')

const inv = {
  approved:  { en:0, it:0, cat:{ en:{}, it:{} } },
  drafts:    { en:0, it:0, cat:{ en:{}, it:{} } },
  static:    { en:STATIC_TOTAL.en, it:STATIC_TOTAL.it },
  published: { en:0, it:0 },
}

for (const s of approved) {
  const l = s.locale === 'it' ? 'it' : 'en'
  inv.approved[l]++
  inv.approved.cat[l][s.category] = (inv.approved.cat[l][s.category] ?? 0) + 1
}
for (const s of drafts) {
  const l = s.locale === 'it' ? 'it' : 'en'
  inv.drafts[l]++
  inv.drafts.cat[l][s.category] = (inv.drafts.cat[l][s.category] ?? 0) + 1
}
inv.published.en = STATIC_TOTAL.en + inv.approved.en
inv.published.it = STATIC_TOTAL.it + inv.approved.it

console.log(`  Static    EN: ${inv.static.en}   IT: ${inv.static.it}`)
console.log(`  Approved  EN: ${inv.approved.en}   IT: ${inv.approved.it}`)
console.log(`  Drafts    EN: ${inv.drafts.en}   IT: ${inv.drafts.it}`)
console.log(`  Published EN: ${inv.published.en}   IT: ${inv.published.it}  (static+approved)`)

// ── §2 Semantic Duplicate Pairs ───────────────────────────────────────────────

section(2, 'Semantic Duplicate Pairs — approved dynamic (Jaccard ≥ 60%)')

const DUPE_THRESH = 60
const dupePairs   = []

for (const locale of ['en','it']) {
  const pool = approved.filter(s => (locale==='it' ? s.locale==='it' : s.locale!=='it'))
  for (let i = 0; i < pool.length; i++) {
    for (let j = i+1; j < pool.length; j++) {
      const sim = Math.round(jaccard(pool[i].question, pool[j].question) * 100)
      if (sim >= DUPE_THRESH) {
        dupePairs.push({ locale, similarity:sim,
          a:{ id:pool[i].id, q:pool[i].question.slice(0,80) },
          b:{ id:pool[j].id, q:pool[j].question.slice(0,80) },
        })
      }
    }
  }
}
dupePairs.sort((a,b) => b.similarity - a.similarity)
const TOP_DUPES = 25
const topDupes  = dupePairs.slice(0, TOP_DUPES)

console.log(`  Found ${dupePairs.length} pair(s) with similarity ≥ ${DUPE_THRESH}%`)
for (const p of topDupes.slice(0,5)) {
  console.log(`  [${p.locale.toUpperCase()}] ${p.similarity}%  "${p.a.q.slice(0,46)}" ↔ "${p.b.q.slice(0,46)}"`)
}
if (dupePairs.length > 5) console.log(`  … ${dupePairs.length - 5} more in JSON output`)

// ── §3 Moral Archetype Saturation ────────────────────────────────────────────

section(3, 'Moral Archetype Saturation (approved dynamic)')

const arcCounts = Object.fromEntries(ARCHETYPES.map(a => [a.id, 0]))
for (const s of approved) {
  const text = `${s.question} ${s.optionA} ${s.optionB}`
  for (const id of detectArchetypes(text)) {
    arcCounts[id] = (arcCounts[id] ?? 0) + 1
  }
}

const ARC_SAT_THRESH = 3
const arcReport = ARCHETYPES
  .map(a => ({ ...a, count: arcCounts[a.id] ?? 0 }))
  .sort((a,b) => b.count - a.count)

const saturatedArcIds = new Set(arcReport.filter(a => a.count >= ARC_SAT_THRESH).map(a => a.id))

for (const a of arcReport) {
  const flag = a.count >= ARC_SAT_THRESH ? '🔴 SATURATED' : a.count >= 2 ? '🟡 watch' : '🟢 ok'
  console.log(`  ${flag.padEnd(14)} ${a.label}: ${a.count}`)
}

// Seeds that map strongly to saturated archetypes — "avoid topic" signals
const ARCHETYPE_SEED_SIGNALS = {
  'sacrifice_minority':   ['save-innocent-or-expose-many','deny-treatment-unfair-queue','refuse-refuge-to-protect-your-group','evict-one-family-or-risk-building'],
  'loyalty_vs_justice':   ['family-crime-or-public-safety','sacrifice-whistleblower-source','whistleblowing-national-secrets','friend-drunk-driving'],
  'truth_vs_kindness':    ['truth-that-destroys-recovery','lie-to-keep-peace-after-death','painful-family-truth','friend-cheating-secret'],
  'autonomy_vs_mandate':  ['school-vaccine-mandates','vaccine-refusal-public-spaces','mandatory-voting'],
  'ai_surveillance':      ['predictive-policing','facial-recognition-schools','street-surveillance-cameras','workplace-ai-monitoring'],
  'end_of_life':          ['assisted-dying','organ-donation-opt-out','scarce-icu-bed-allocation'],
  'wealth_inequality':    ['wealth-tax-billionaires','universal-basic-income','student-debt-forgiveness'],
  'love_vs_duty':         ['moving-abroad-for-partner-career','elderly-parent-care-vs-career'],
  'identity_modification':['cloning-dead-loved-one-voice','neural-implants-productivity','genetic-embryo-selection'],
  'resource_scarcity':    ['scarce-icu-bed-allocation','prioritizing-younger-patients'],
}

const avoidTopicSeeds = []
for (const [arcId, seedIds] of Object.entries(ARCHETYPE_SEED_SIGNALS)) {
  if (saturatedArcIds.has(arcId)) {
    for (const seedId of seedIds) {
      if (!EXCLUDED_SET.has(seedId)) {
        avoidTopicSeeds.push({ seedId, packId: SEED_PACK_INDEX[seedId] ?? 'unknown', reason: `archetype_saturation:${arcId}` })
      }
    }
  }
}

// ── §4 Category Distribution ──────────────────────────────────────────────────

section(4, 'Category Distribution (static + approved, per locale)')

const ALL_CATS = ['morality','survival','loyalty','justice','freedom','technology','society','relationships','lifestyle']
const catDist  = { en:{}, it:{}, gaps:[], surplus:[] }

for (const cat of ALL_CATS) {
  for (const loc of ['en','it']) {
    const appr   = inv.approved.cat[loc][cat] ?? 0
    const stat   = STATIC_BY_CATEGORY[loc]?.[cat] ?? 0
    const total  = appr + stat
    catDist[loc][cat] = { approved:appr, static:stat, total }
    if (total < 5)  catDist.gaps.push({ locale:loc, category:cat, total })
    if (total > 25) catDist.surplus.push({ locale:loc, category:cat, total })
  }
}

console.log('  Gaps (< 5 items):')
catDist.gaps.length === 0 ? console.log('    None') : catDist.gaps.forEach(g => console.log(`    [${g.locale.toUpperCase()}] ${g.category}: ${g.total}`))
console.log('  Surplus (> 25 items):')
catDist.surplus.length === 0 ? console.log('    None') : catDist.surplus.forEach(s => console.log(`    [${s.locale.toUpperCase()}] ${s.category}: ${s.total}`))

// ── §5 Active Seed Exclusions ─────────────────────────────────────────────────

section(5, 'Active Seed Exclusions')

for (const e of SEED_EXCLUSIONS) {
  console.log(`  [${e.status.toUpperCase()}] ${e.seedId}`)
  console.log(`           ${e.reason}`)
}

// ── §6 Burned / Suppressed Seeds ─────────────────────────────────────────────

section(6, 'Burned & Suppressed Seeds (from usage map)')

const HIGH_REJ = 2
const burned   = []
const cooldownCandidates = []

for (const [seedId, u] of Object.entries(usageMap)) {
  const excluded  = EXCLUDED_SET.has(seedId)
  const highRej   = u.rejectedCount >= HIGH_REJ && u.savedDraftCount === 0
  const noConv    = u.generatedCount >= 5 && u.savedDraftCount === 0
  const flags     = [
    ...(excluded ? ['manually_excluded'] : []),
    ...(highRej  ? ['high_rejection']    : []),
    ...(noConv   ? ['no_conversion']     : []),
  ]
  if (flags.length > 0) {
    burned.push({ seedId, packId: SEED_PACK_INDEX[seedId] ?? 'unknown',
      generatedCount:u.generatedCount, savedDraftCount:u.savedDraftCount,
      rejectedCount:u.rejectedCount, dryRunCount:u.dryRunCount ?? 0,
      lastStatus:u.lastStatus, lastUsedAt:u.lastUsedAt, flags })
    if (!excluded && highRej) {
      cooldownCandidates.push({ seedId, packId: SEED_PACK_INDEX[seedId] ?? 'unknown',
        rejectedCount:u.rejectedCount, savedDraftCount:u.savedDraftCount })
    }
  }
}

console.log(`  Currently excluded (manual):  ${SEED_EXCLUSIONS.length}`)
console.log(`  High rejection (≥${HIGH_REJ} rej, 0 saved): ${burned.filter(b=>b.flags.includes('high_rejection')).length}`)
console.log(`  No conversion  (≥5 gen, 0 saved):  ${burned.filter(b=>b.flags.includes('no_conversion')).length}`)
if (cooldownCandidates.length > 0) {
  console.log('  ⚠  New cooldown candidates:')
  for (const c of cooldownCandidates) {
    console.log(`     → ${c.seedId} [${c.packId}] (rej:${c.rejectedCount} saved:${c.savedDraftCount})`)
  }
} else {
  console.log('  ✓ No new cooldown candidates beyond current exclusions')
}

// ── §7 Seed Pack Conversion Ratios ───────────────────────────────────────────

section(7, 'Seed Pack Conversion Ratios')

const packStats = {}
for (const p of SEED_PACKS_META) {
  packStats[p.id] = { label:p.label, targetShare:p.targetShare,
    generated:0, saved:0, rejected:0, dryRun:0, seedsTracked:0 }
}

for (const [seedId, u] of Object.entries(usageMap)) {
  const packId = SEED_PACK_INDEX[seedId] ?? 'unknown'
  if (!packStats[packId]) continue
  packStats[packId].generated   += u.generatedCount
  packStats[packId].saved       += u.savedDraftCount
  packStats[packId].rejected    += u.rejectedCount
  packStats[packId].dryRun      += u.dryRunCount ?? 0
  packStats[packId].seedsTracked++
}

const overallGen  = Object.values(usageMap).reduce((s,u) => s + u.generatedCount, 0)
const overallSaved= Object.values(usageMap).reduce((s,u) => s + u.savedDraftCount, 0)
const overallRej  = Object.values(usageMap).reduce((s,u) => s + u.rejectedCount, 0)
const overallRate = overallGen > 0 ? Math.round(overallSaved / overallGen * 100) : 0

console.log(`  Overall: ${overallGen} generated → ${overallSaved} saved (${overallRate}% conversion, ${overallRej} rejected)`)
console.log(`  Seeds tracked in usage map: ${Object.keys(usageMap).length}`)
console.log('')

const packList = Object.entries(packStats)
  .filter(([,s]) => s.generated > 0)
  .sort(([,a],[,b]) => {
    const ra = a.generated > 0 ? a.saved/a.generated : 1
    const rb = b.generated > 0 ? b.saved/b.generated : 1
    return ra - rb  // worst first
  })

for (const [packId, s] of packList) {
  const rate = s.generated > 0 ? Math.round(s.saved/s.generated*100) : 0
  const flag = rate < 50 ? '⚠ ' : rate < 75 ? '  ' : '✓ '
  console.log(`  ${flag}${s.label.padEnd(34)} ${String(s.saved).padStart(3)}/${String(s.generated).padEnd(3)} (${rate}%)  seeds tracked:${s.seedsTracked}`)
}

// ── §8 Seeds to Expand ────────────────────────────────────────────────────────

section(8, 'Seeds to Expand (low usage + high potential)')

// Seeds with 0 generated and in packs with high targetShare
const totalSeeds = Object.keys(SEED_PACK_INDEX).length
const unusedSeeds = Object.entries(SEED_PACK_INDEX)
  .filter(([seedId]) => !usageMap[seedId] && !EXCLUDED_SET.has(seedId))
  .map(([seedId, packId]) => {
    const pack = SEED_PACKS_META.find(p => p.id === packId)
    return { seedId, packId, packLabel: pack?.label ?? packId, targetShare: pack?.targetShare ?? 0 }
  })
  .sort((a,b) => b.targetShare - a.targetShare)

console.log(`  Total seeds in catalog: ${totalSeeds}`)
console.log(`  Seeds never used: ${unusedSeeds.length}`)
console.log('')
console.log('  Top unused seeds by pack targetShare:')
for (const s of unusedSeeds.slice(0, 12)) {
  console.log(`    ${s.seedId.padEnd(44)} [${s.packId}]`)
}
if (unusedSeeds.length > 12) console.log(`    … ${unusedSeeds.length - 12} more in JSON`)

// ── §9 Seeds to Avoid ─────────────────────────────────────────────────────────

section(9, 'Seeds to Avoid (archetype saturation signals)')

if (avoidTopicSeeds.length === 0) {
  console.log('  No avoidance signals from archetype saturation')
} else {
  console.log(`  ${avoidTopicSeeds.length} seed(s) map to saturated archetypes:`)
  for (const s of avoidTopicSeeds.slice(0, 10)) {
    console.log(`    ${s.seedId.padEnd(44)} reason: ${s.reason}`)
  }
  if (avoidTopicSeeds.length > 10) console.log(`    … ${avoidTopicSeeds.length - 10} more in JSON`)
}

// ── §10 Cooldown Recommendations ─────────────────────────────────────────────

section(10, 'Cooldown Recommendations')

if (cooldownCandidates.length === 0 && avoidTopicSeeds.length === 0) {
  console.log('  ✓ No new cooldowns needed — current list is up to date')
} else {
  if (cooldownCandidates.length > 0) {
    console.log('  Usage-based (add to SEED_EXCLUSIONS immediately):')
    for (const c of cooldownCandidates) {
      console.log(`    → ${c.seedId}  reason: high_rejection (${c.rejectedCount} rejected, 0 saved)`)
    }
  }
  if (avoidTopicSeeds.length > 0) {
    console.log('  Archetype-based (consider deprioritizing):')
    for (const s of avoidTopicSeeds.slice(0,5)) {
      console.log(`    → ${s.seedId}  reason: ${s.reason}`)
    }
  }
}

// ── §11 Content Gaps & Opportunities ─────────────────────────────────────────

section(11, 'Content Gaps & Opportunities')

// Packs with 0 seeds ever used
const unusedPacks = SEED_PACKS_META
  .filter(p => !Object.keys(packStats).includes(p.id) || packStats[p.id].generated === 0)
const lowConvPacks = Object.entries(packStats)
  .filter(([,s]) => s.generated > 0 && s.saved / s.generated < 0.5)
  .map(([packId, s]) => ({ packId, label:s.label, rate: Math.round(s.saved/s.generated*100) }))

console.log('  Packs with 0 generations ever:')
if (unusedPacks.length === 0) {
  console.log('    None — all packs have been used')
} else {
  for (const p of unusedPacks) console.log(`    ${p.id}  (target: ${Math.round(p.targetShare*100)}%)`)
}

console.log('  Packs with < 50% conversion rate:')
if (lowConvPacks.length === 0) {
  console.log('    None — all used packs are performing well')
} else {
  for (const p of lowConvPacks) console.log(`    ${p.label}  (${p.rate}%)`)
}

// Category gaps: good targets for next batch
const catGapRecs = catDist.gaps.filter(g => g.total < 10)
if (catGapRecs.length > 0) {
  console.log('  Category gap opportunities (< 10 items — good next batch target):')
  for (const g of catGapRecs) console.log(`    [${g.locale.toUpperCase()}] ${g.category}: ${g.total} items`)
}

// ── §12 Landing Page Candidates ───────────────────────────────────────────────

section(12, 'Landing Page Candidates')

const landingCandidates = ALL_CATS
  .filter(cat => !HAS_LANDING_PAGE.has(cat))
  .map(cat => ({
    category: cat,
    enTotal:  catDist.en[cat]?.total ?? 0,
    itTotal:  catDist.it[cat]?.total ?? 0,
  }))
  .filter(c => c.enTotal >= 5 || c.itTotal >= 5)
  .sort((a,b) => (b.enTotal+b.itTotal) - (a.enTotal+a.itTotal))

if (landingCandidates.length === 0) {
  console.log('  All high-volume categories already have landing pages')
} else {
  for (const c of landingCandidates) {
    console.log(`  ${c.category.padEnd(16)} EN: ${c.enTotal}  IT: ${c.itTotal}  → candidate for SEO page`)
  }
}

// ── §13 Locale Balance ────────────────────────────────────────────────────────

section(13, 'Locale Balance')

const enApp = inv.approved.en, itApp = inv.approved.it
const imbal = Math.abs(enApp - itApp)
const ratio = itApp > 0 ? (enApp / itApp).toFixed(2) : 'N/A'
console.log(`  Approved EN: ${enApp}  IT: ${itApp}  ratio: ${ratio}  imbalance: ${imbal}`)
if (imbal > 10) {
  const target = enApp > itApp ? 'IT' : 'EN'
  console.log(`  ⚠  Significant imbalance — prefer ${target} locale in next batch`)
} else {
  console.log('  ✓ Locales are balanced')
}

// ── §14 Picoclaw Intake Placeholder ──────────────────────────────────────────

section(14, 'Picoclaw Intake Placeholder (no integration — format only)')

// Seeds with low usage and no archetype saturation — good Picoclaw targets
const picoclaWSeeds = unusedSeeds
  .filter(s => !avoidTopicSeeds.some(a => a.seedId === s.seedId))
  .slice(0, 8)

const picoclaw = {
  version: '1.0-placeholder',
  description: 'Future Picoclaw trend intake format. No real integration in v1.',
  inputSchema: {
    trend_topic:     'string — headline from Picoclaw trend signal',
    source:          'enum: google_trends | reddit | rss | x_trending | manual',
    locale:          'enum: en | it | all',
    score:           'number 0-100 — trend intensity',
    suggested_angle: 'string? — optional framing hint for dilemma generation',
    expires_at:      'ISO date? — when trend becomes stale (omit for evergreen)',
    category_hint:   'enum: morality|survival|loyalty|justice|freedom|technology|society|relationships|lifestyle',
  },
  examplePayload: {
    trend_topic:     'example trend topic from Picoclaw',
    source:          'google_trends',
    locale:          'en',
    score:           78,
    suggested_angle: 'frame as individual vs collective cost dilemma',
    expires_at:      null,
    category_hint:   'society',
  },
  recommendedSeedsForPicoclaw: picoclaWSeeds.map(s => ({
    seedId:  s.seedId,
    packId:  s.packId,
    label:   s.packLabel,
    note:    'unused seed — good candidate for Picoclaw-triggered generation',
  })),
  integrationStatus: 'NOT_IMPLEMENTED — placeholder only',
}

console.log('  Input schema documented in JSON output.')
console.log(`  ${picoclaWSeeds.length} recommended seed slots for future Picoclaw pairing.`)

// ── Assemble full JSON report ─────────────────────────────────────────────────

const report = {
  generatedAt:          new Date().toISOString(),
  redisMode:            REDIS_OK ? 'connected' : 'static-only',
  inventorySummary:     inv,
  semanticDuplicatePairs: topDupes,
  duplicatePairTotal:   dupePairs.length,
  archetypeSaturation:  arcReport.map(a => ({ id:a.id, label:a.label, count:a.count, saturated: a.count >= ARC_SAT_THRESH })),
  categoryDistribution: catDist,
  activeExclusions:     SEED_EXCLUSIONS,
  burnedSeeds:          burned,
  cooldownRecommendations: cooldownCandidates,
  seedPackStats:        {
    overall: { generated:overallGen, saved:overallSaved, rejected:overallRej, conversionRate:`${overallRate}%` },
    byPack:  Object.fromEntries(Object.entries(packStats).map(([id,s]) => [id, {
      ...s, conversionRate: s.generated > 0 ? `${Math.round(s.saved/s.generated*100)}%` : 'N/A',
    }])),
  },
  seedsToExpand:        unusedSeeds.slice(0, 30),
  seedsToAvoid:         avoidTopicSeeds,
  contentGaps: {
    unusedPacks:        unusedPacks.map(p => p.id),
    lowConversionPacks: lowConvPacks,
    categoryGaps:       catDist.gaps,
    categoryOpportunities: catGapRecs,
  },
  landingPageCandidates,
  localeBalance: {
    approvedEn:enApp, approvedIt:itApp, ratio, imbalance:imbal, needsRebalancing:imbal>10,
  },
  picoclaw,
}

// ── Write JSON ────────────────────────────────────────────────────────────────

fs.writeFileSync(outJson, JSON.stringify(report, null, 2))

// ── Write MD summary ──────────────────────────────────────────────────────────

const md = [
  `# SplitVote — Content Intelligence Report`,
  `**Date:** ${today}  |  **Redis mode:** ${report.redisMode}`,
  '',
  '## Inventory',
  `| | EN | IT |`,
  `|---|---|---|`,
  `| Static | ${inv.static.en} | ${inv.static.it} |`,
  `| Approved dynamic | ${inv.approved.en} | ${inv.approved.it} |`,
  `| Drafts | ${inv.drafts.en} | ${inv.drafts.it} |`,
  `| **Total published** | **${inv.published.en}** | **${inv.published.it}** |`,
  '',
  '## Semantic Duplicates',
  `${dupePairs.length} pair(s) with Jaccard ≥ ${DUPE_THRESH}%`,
  ...topDupes.slice(0,5).map(p => `- [${p.locale.toUpperCase()}] **${p.similarity}%** — "${p.a.q.slice(0,60)}" ↔ "${p.b.q.slice(0,60)}"`),
  '',
  '## Archetype Saturation',
  ...arcReport.map(a => `- ${a.count >= ARC_SAT_THRESH ? '🔴' : a.count >= 2 ? '🟡' : '🟢'} **${a.label}**: ${a.count}`),
  '',
  '## Category Distribution',
  `**Gaps (< 5):** ${catDist.gaps.length > 0 ? catDist.gaps.map(g=>`[${g.locale.toUpperCase()}] ${g.category}:${g.total}`).join(', ') : 'None'}`,
  `**Surplus (> 25):** ${catDist.surplus.length > 0 ? catDist.surplus.map(s=>`[${s.locale.toUpperCase()}] ${s.category}:${s.total}`).join(', ') : 'None'}`,
  '',
  '## Active Exclusions',
  ...SEED_EXCLUSIONS.map(e => `- \`${e.seedId}\` [${e.status}] — ${e.reason}`),
  '',
  '## Burned Seeds',
  `- High rejection: ${burned.filter(b=>b.flags.includes('high_rejection')).length}`,
  `- No conversion: ${burned.filter(b=>b.flags.includes('no_conversion')).length}`,
  '',
  '## Cooldown Recommendations',
  cooldownCandidates.length === 0
    ? '✓ None — current exclusion list is up to date'
    : cooldownCandidates.map(c => `- \`${c.seedId}\` — ${c.rejectedCount} rejected, 0 saved`).join('\n'),
  '',
  '## Seed Pack Conversion',
  `Overall: **${overallSaved}/${overallGen} (${overallRate}%)**`,
  ...packList.slice(0,8).map(([id,s]) => {
    const r = s.generated > 0 ? Math.round(s.saved/s.generated*100) : 0
    return `- ${r < 50 ? '⚠ ' : ''}${s.label}: ${s.saved}/${s.generated} (${r}%)`
  }),
  '',
  '## Seeds to Expand',
  `${unusedSeeds.length} seeds never used. Top candidates:`,
  ...unusedSeeds.slice(0,8).map(s => `- \`${s.seedId}\` [${s.packId}]`),
  '',
  '## Seeds to Avoid',
  avoidTopicSeeds.length === 0 ? '✓ None' : avoidTopicSeeds.slice(0,8).map(s => `- \`${s.seedId}\` — ${s.reason}`).join('\n'),
  '',
  '## Landing Page Candidates',
  landingCandidates.length === 0
    ? '✓ All high-volume categories have landing pages'
    : landingCandidates.map(c => `- **${c.category}**: EN=${c.enTotal} IT=${c.itTotal}`).join('\n'),
  '',
  '## Locale Balance',
  `EN: ${enApp} | IT: ${itApp} | ratio: ${ratio} | imbalance: ${imbal}`,
  imbal > 10 ? `⚠ Prefer ${enApp > itApp ? 'IT' : 'EN'} in next batch` : '✓ Balanced',
  '',
  '## Picoclaw Intake',
  'Placeholder format documented in JSON. No real integration in v1.',
  `${picoclaWSeeds.length} seed slots recommended for future Picoclaw pairing.`,
  '',
  '---',
  `*Generated by content-intelligence-report.mjs — SAFE_AUTONOMOUS, read-only*`,
].join('\n')

fs.writeFileSync(outMd, md)

// ── Final summary ─────────────────────────────────────────────────────────────

console.log('\n══════════════════════════════════════════════════════════')
console.log(`  JSON → content-output/content-intelligence-report-${today}.json`)
console.log(`  MD  → content-output/content-intelligence-report-${today}.md`)
console.log('══════════════════════════════════════════════════════════\n')
