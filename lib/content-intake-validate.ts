/**
 * Validation and risk-flagging for POST /api/admin/content-intake.
 * Phase 0 — no AI, no external calls, no writes.
 */

export type ItemType = 'trend' | 'news' | 'fact' | 'source'

export type RiskFlag =
  | 'real_person'
  | 'current_event'
  | 'legal_sensitive'
  | 'medical'
  | 'politics'
  | 'minors'
  | 'tragedy'
  | 'unsupported_claim'
  | 'source_missing'

export type SuggestedTransformation =
  | 'abstracted_dilemma_candidate'
  | 'blocked_direct_news'
  | 'fact_context_only'
  | 'none'

export interface NormalizedItem {
  index:                   number
  type:                    ItemType
  title:                   string
  summary:                 string
  url?:                    string
  publishedAt?:            string
  region?:                 string
  facts?:                  string[]
  tags?:                   string[]
  riskFlags:               RiskFlag[]
  suggestedTransformation: SuggestedTransformation
}

export interface RejectedItem {
  index:  number
  title:  string  // truncated ≤80 chars; no secret echoed
  reason: string
}

export interface IntakeValidationResult {
  accepted: NormalizedItem[]
  rejected: RejectedItem[]
}

// ── Constants ─────────────────────────────────────────────────────────────────

const VALID_TYPES    = new Set<string>(['trend', 'news', 'fact', 'source'])
const BLOCKED_FIELDS = ['fullText', 'body', 'articleText', 'content']

// ── String helpers ────────────────────────────────────────────────────────────

function stripControl(s: string): string {
  return s.replace(/[\x00-\x1F\x7F]/g, ' ').replace(/\s+/g, ' ').trim()
}

function safeTitle(raw: unknown): string {
  if (typeof raw !== 'string' || raw.trim() === '') return '[untitled]'
  const cleaned = stripControl(raw)
  return cleaned.length <= 80 ? cleaned : cleaned.slice(0, 79) + '…'
}

// ── URL validation ────────────────────────────────────────────────────────────

// Matches localhost, 127.x, 10.x, 192.168.x, 172.16-31.x, 169.254.x, IPv6 loopback
const PRIVATE_HOST =
  /^(localhost|127\.\d+\.\d+\.\d+|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+|169\.254\.\d+\.\d+|::1|\[::1\])$/i

function parseUrl(raw: string): { ok: true; url: string } | { ok: false; reason: string } {
  let parsed: URL
  try { parsed = new URL(raw) } catch { return { ok: false, reason: 'url is not a valid URL' } }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return { ok: false, reason: 'url must use http or https' }
  }
  if (PRIVATE_HOST.test(parsed.hostname)) {
    return { ok: false, reason: 'url must not point to a private or local host' }
  }
  return { ok: true, url: parsed.toString() }
}

// ── ISO 8601 validation ───────────────────────────────────────────────────────

function isISO8601(s: string): boolean {
  return /^\d{4}-\d{2}-\d{2}/.test(s) && !isNaN(Date.parse(s))
}

// ── Risk flag heuristics ──────────────────────────────────────────────────────
// Phase 0: keyword/pattern heuristics only — advisory, not blocking.
// Phase 1 AI pass will be more precise.

// Role titles that usually precede a real person's name
const RE_REAL_PERSON_ROLE =
  /\b(CEO|CTO|CFO|COO|president|senator|minister|governor|mayor|director|chancellor|judge|congressman|congresswoman|presidente|ministro|sindaco|governatore|senatore|direttore|cancelliere|giudice|parlamentare)\b/i

// Two consecutive Title Case words (FirstName LastName) — may fire on place names; acceptable FP rate for Phase 0
const RE_REAL_PERSON_NAME = /\b[A-Z][a-z]{1,19}\s+[A-Z][a-z]{1,19}\b/

const RE_CURRENT_EVENT =
  /\b(breaking|today|yesterday|this week|last week|ongoing|developing|live update|unfolding|just announced|hours ago|minutes ago|real.time|oggi|ieri|questa settimana|settimana scorsa|in corso|in diretta|ultime ore|aggiornamento)\b/i

const RE_LEGAL =
  /\b(lawsuit|sued|suing|charged|indicted|arrested|convicted|guilty|verdict|settlement|allegation|alleged|accused|defendant|plaintiff|fraud|criminal|imprisoned|sentenced|denuncia|denunciato|arrestato|condannato|indagato|imputato|processo|tribunale|reato|crimine|truffa|frode|sentenza)\b/i

const RE_MEDICAL =
  /\b(drug|drugs|treatment|cure|diagnosis|medicine|medication|symptom|disease|illness|hospital|surgery|therapy|vaccine|clinical|patient|cancer|virus|epidemic|pandemic|outbreak|farmaco|farmaci|trattamento|cura|diagnosi|medicina|sintomi|malattia|ospedale|chirurgia|terapia|vaccino|paziente|cancro|epidemia|pandemia)\b/i

const RE_POLITICS =
  /\b(election|democrat|republican|conservative|liberal|political party|congress|senate|parliament|legislation|ballot|referendum|elezione|democratico|conservatore|liberale|parlamento|politica|legislazione|governo|campagna|referendum)\b/i

const RE_MINORS =
  /\b(child|children|minor|minors|underage|teenager|teen|youth|juvenile|pupil|kindergarten|infant|toddler|bambino|bambini|minore|adolescente|ragazzo|ragazzi|infanzia|asilo)\b/i

const RE_TRAGEDY =
  /\b(death|died|killed|murder|massacre|shooting|bombing|terrorist attack|disaster|crash|accident|victim|tragedy|suicide|fatality|morte|morto|ucciso|omicidio|strage|attacco|disastro|incidente|vittima|tragedia|suicidio|devastante|lutto|attentato)\b/i

const RE_UNSUPPORTED =
  /\b(studies show|research proves|experts say|scientists claim|proven to|guaranteed|the first ever|the only one|always works|never fails|gli studi dimostrano|la ricerca dimostra|gli esperti|è stato dimostrato|garantito)\b/i

function detectFlags(type: ItemType, text: string, url?: string): RiskFlag[] {
  const flags: RiskFlag[] = []
  if (RE_REAL_PERSON_ROLE.test(text) || RE_REAL_PERSON_NAME.test(text)) flags.push('real_person')
  if (RE_CURRENT_EVENT.test(text))  flags.push('current_event')
  if (RE_LEGAL.test(text))          flags.push('legal_sensitive')
  if (RE_MEDICAL.test(text))        flags.push('medical')
  if (RE_POLITICS.test(text))       flags.push('politics')
  if (RE_MINORS.test(text))         flags.push('minors')
  if (RE_TRAGEDY.test(text))        flags.push('tragedy')
  if (RE_UNSUPPORTED.test(text))    flags.push('unsupported_claim')
  if (type === 'fact' && !url)      flags.push('source_missing')
  return flags
}

// ── Suggested transformation ──────────────────────────────────────────────────

// These flags make a direct-news → dilemma transformation unsafe
const BLOCKING_FLAGS = new Set<RiskFlag>([
  'real_person', 'current_event', 'politics', 'legal_sensitive', 'minors', 'tragedy',
])

function suggestTransformation(type: ItemType, flags: RiskFlag[]): SuggestedTransformation {
  if (type === 'fact' || type === 'source') return 'fact_context_only'
  if (flags.some(f => BLOCKING_FLAGS.has(f))) return 'blocked_direct_news'
  return 'abstracted_dilemma_candidate'
}

// ── Per-item validation ───────────────────────────────────────────────────────

function validateItem(
  index: number,
  raw:   unknown,
): { ok: true; item: NormalizedItem } | { ok: false; error: RejectedItem } {
  const reject = (reason: string, titleRaw?: unknown): { ok: false; error: RejectedItem } => ({
    ok: false,
    error: { index, title: safeTitle(titleRaw), reason },
  })

  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    return reject('item must be an object')
  }

  const obj = raw as Record<string, unknown>

  for (const field of BLOCKED_FIELDS) {
    if (field in obj) {
      return reject(`field "${field}" is not accepted; submit a summary only`, obj.title)
    }
  }

  if (!VALID_TYPES.has(obj.type as string)) {
    return reject('type must be one of: trend, news, fact, source', obj.title)
  }
  const type = obj.type as ItemType

  if (typeof obj.title !== 'string') return reject('title is required')
  const title = stripControl(obj.title)
  if (title.length === 0)   return reject('title is required')
  if (title.length > 200)   return reject('title must be ≤200 chars', obj.title)

  if (typeof obj.summary !== 'string') return reject('summary is required', obj.title)
  const summary = stripControl(obj.summary)
  if (summary.length === 0) return reject('summary is required', obj.title)
  if (summary.length > 600) return reject('summary must be ≤600 chars', obj.title)

  let url: string | undefined
  if (obj.url != null) {
    if (typeof obj.url !== 'string') return reject('url must be a string', obj.title)
    const r = parseUrl(obj.url)
    if (!r.ok) return reject(r.reason, obj.title)
    url = r.url
  }

  let publishedAt: string | undefined
  if (obj.publishedAt != null) {
    if (typeof obj.publishedAt !== 'string' || !isISO8601(obj.publishedAt)) {
      return reject('publishedAt must be a valid ISO 8601 date string', obj.title)
    }
    publishedAt = obj.publishedAt
  }

  let region: string | undefined
  if (obj.region != null) {
    if (typeof obj.region !== 'string') return reject('region must be a string', obj.title)
    region = stripControl(obj.region)
    if (region.length > 60) return reject('region must be ≤60 chars', obj.title)
  }

  let facts: string[] | undefined
  if (obj.facts != null) {
    if (!Array.isArray(obj.facts)) return reject('facts must be an array', obj.title)
    if (obj.facts.length > 5)      return reject('facts must have ≤5 items', obj.title)
    const normalized: string[] = []
    for (let j = 0; j < obj.facts.length; j++) {
      const f = obj.facts[j]
      if (typeof f !== 'string') return reject(`facts[${j}] must be a string`, obj.title)
      const fact = stripControl(f)
      if (fact.length > 200) return reject(`facts[${j}] must be ≤200 chars`, obj.title)
      normalized.push(fact)
    }
    facts = normalized
  }

  let tags: string[] | undefined
  if (obj.tags != null) {
    if (!Array.isArray(obj.tags)) return reject('tags must be an array', obj.title)
    if (obj.tags.length > 10)     return reject('tags must have ≤10 items', obj.title)
    const normalized: string[] = []
    for (let j = 0; j < obj.tags.length; j++) {
      const t = obj.tags[j]
      if (typeof t !== 'string') return reject(`tags[${j}] must be a string`, obj.title)
      const tag = stripControl(t)
      if (tag.length > 50) return reject(`tags[${j}] must be ≤50 chars`, obj.title)
      normalized.push(tag)
    }
    tags = normalized
  }

  const searchText          = [title, summary, ...(facts ?? [])].join(' ')
  const riskFlags           = detectFlags(type, searchText, url)
  const suggestedTransformation = suggestTransformation(type, riskFlags)

  return {
    ok: true,
    item: {
      index, type, title, summary,
      ...(url         ? { url }         : {}),
      ...(publishedAt ? { publishedAt } : {}),
      ...(region      ? { region }      : {}),
      ...(facts       ? { facts }       : {}),
      ...(tags        ? { tags }        : {}),
      riskFlags,
      suggestedTransformation,
    },
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

export function validateIntakePayload(items: unknown[]): IntakeValidationResult {
  const accepted: NormalizedItem[] = []
  const rejected: RejectedItem[]   = []

  for (let i = 0; i < items.length; i++) {
    const result = validateItem(i, items[i])
    if (result.ok) accepted.push(result.item)
    else           rejected.push(result.error)
  }

  return { accepted, rejected }
}
