/**
 * validate-personality.mjs
 *
 * Validates the consistency of the personality system across:
 *   - lib/personality.ts       (source of truth)
 *   - app/api/personality-card/route.tsx  (VALID_IDS + ARCHETYPE_HEX)
 *   - app/personality/PersonalityClient.tsx  (SIGN_COLORS)
 *
 * Run:  npm run validate:personality
 * Zero new dependencies — reads files as text.
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')

let errors = 0
let warnings = 0

function fail(msg) { console.error(`  ✗ ${msg}`); errors++ }
function warn(msg) { console.warn(`  ⚠ ${msg}`); warnings++ }
function ok(msg)   { console.log(`  ✓ ${msg}`) }

// ── Read sources ───────────────────────────────────────────────

const personalityTs  = fs.readFileSync(path.join(ROOT, 'lib/personality.ts'), 'utf8')
const cardRouteTsx   = fs.readFileSync(path.join(ROOT, 'app/api/personality-card/route.tsx'), 'utf8')
const clientTsx      = fs.readFileSync(path.join(ROOT, 'app/personality/PersonalityClient.tsx'), 'utf8')

// ── Extract archetype IDs from personality.ts ─────────────────
// Match `id: 'some-id'` lines inside ARCHETYPES array

const idMatches = [...personalityTs.matchAll(/^\s+id:\s+'([^']+)'/gm)].map(m => m[1])

console.log('\n── lib/personality.ts ──')

const EXPECTED_COUNT = 18
if (idMatches.length !== EXPECTED_COUNT) {
  fail(`Expected ${EXPECTED_COUNT} archetypes, found ${idMatches.length}: ${idMatches.join(', ')}`)
} else {
  ok(`${EXPECTED_COUNT} archetypes found`)
}

// Unique IDs
const idSet = new Set(idMatches)
if (idSet.size !== idMatches.length) {
  const dupes = idMatches.filter((id, i) => idMatches.indexOf(id) !== i)
  fail(`Duplicate archetype IDs: ${dupes.join(', ')}`)
} else {
  ok('All IDs are unique')
}

// Required original 6
const ORIGINAL_6 = ['guardian', 'rebel', 'oracle', 'diplomat', 'strategist', 'empath']
for (const id of ORIGINAL_6) {
  if (!idSet.has(id)) fail(`Original archetype missing: ${id}`)
}
ok('Original 6 IDs present')

// diplomat must be the 4th entry (index 3) for fallback
const diplomatIndex = idMatches.indexOf('diplomat')
if (diplomatIndex !== 3) {
  fail(`'diplomat' must be at index 3 (fallback), found at index ${diplomatIndex}`)
} else {
  ok("'diplomat' at index 3 (fallback)")
}

// ── Check EN/IT fields and traits parity ─────────────────────
// Split archetypes by their opening brace after `id: '...'`
// Rough but effective: find each archetype block by scanning between id markers

const REQUIRED_FIELDS = [
  ['name', 'nameIt'],
  ['sign', 'signIt'],
  ['tagline', 'taglineIt'],
  ['description', 'descriptionIt'],
  ['shareText', 'shareTextIt'],
]

let missingFields = 0
let traitsMismatch = 0
let profileMissing = 0

for (const id of idMatches) {
  // Find the block for this archetype by locating `id: 'ID'` and then slicing ahead
  const idPattern = new RegExp(`id:\\s+'${id.replace('-', '\\-')}'`)
  const start = personalityTs.search(idPattern)
  if (start === -1) { fail(`Could not locate block for '${id}'`); continue }

  // Slice a window large enough to cover all fields including long descriptions + shareText + profile
  const block = personalityTs.slice(start, start + 2500)

  // Check required EN/IT pairs — descriptions and shareText use double quotes in the source
  for (const [en, it] of REQUIRED_FIELDS) {
    const hasEn = new RegExp(`${en}:\\s*["'\`]`).test(block)
    const hasIt = new RegExp(`${it}:\\s*["'\`]`).test(block)
    if (!hasEn) { fail(`'${id}': missing field '${en}'`); missingFields++ }
    if (!hasIt) { fail(`'${id}': missing field '${it}'`); missingFields++ }
  }

  // Check traits / traitsIt same length
  const traitsEnMatch  = block.match(/traits:\s*\[([^\]]+)\]/)
  const traitsItMatch  = block.match(/traitsIt:\s*\[([^\]]+)\]/)
  if (traitsEnMatch && traitsItMatch) {
    const enCount = (traitsEnMatch[1].match(/'/g) ?? []).length / 2
    const itCount = (traitsItMatch[1].match(/'/g) ?? []).length / 2
    if (enCount !== itCount) {
      fail(`'${id}': traits length ${enCount} ≠ traitsIt length ${itCount}`)
      traitsMismatch++
    }
  } else {
    fail(`'${id}': could not parse traits/traitsIt`)
    traitsMismatch++
  }

  // Check profile present
  if (!block.includes('profile:')) {
    fail(`'${id}': missing 'profile' field`)
    profileMissing++
  }
}

if (missingFields === 0) ok('All EN/IT fields present for all archetypes')
if (traitsMismatch === 0) ok('traits / traitsIt length match for all archetypes')
if (profileMissing === 0) ok('profile present for all archetypes')

// ── Check MORAL_AXES typos ─────────────────────────────────────
if (personalityTs.includes('Liberatarian')) {
  fail("Typo 'Liberatarian' found in MORAL_AXES — should be 'Libertarian'")
} else {
  ok("MORAL_AXES 'Libertarian' spelling correct")
}

// ── Cross-check personality-card/route.tsx ────────────────────
console.log('\n── app/api/personality-card/route.tsx ──')

// Extract VALID_IDS entries
const validIdsMatch = cardRouteTsx.match(/const VALID_IDS = new Set\(\[([^\]]+)\]\)/)
if (!validIdsMatch) {
  fail('Could not locate VALID_IDS in personality-card route')
} else {
  const cardIds = [...validIdsMatch[1].matchAll(/'([^']+)'/g)].map(m => m[1])
  const cardSet = new Set(cardIds)

  for (const id of idMatches) {
    if (!cardSet.has(id)) fail(`'${id}' missing from VALID_IDS in personality-card route`)
  }
  for (const id of cardIds) {
    if (!idSet.has(id)) warn(`'${id}' in VALID_IDS but not in lib/personality.ts archetypes`)
  }
  if (cardIds.length === EXPECTED_COUNT) ok(`VALID_IDS has ${EXPECTED_COUNT} entries`)
  else fail(`VALID_IDS has ${cardIds.length} entries, expected ${EXPECTED_COUNT}`)
}

// Extract ARCHETYPE_HEX keys
const hexMatch = cardRouteTsx.match(/const ARCHETYPE_HEX[^=]+=\s*\{([^}]+)\}/)
if (!hexMatch) {
  fail('Could not locate ARCHETYPE_HEX in personality-card route')
} else {
  const hexKeys = [...hexMatch[1].matchAll(/'?([a-z-]+)'?\s*:/g)].map(m => m[1])
  const hexSet = new Set(hexKeys)

  for (const id of idMatches) {
    if (!hexSet.has(id)) fail(`'${id}' missing from ARCHETYPE_HEX`)
  }
  if (hexKeys.length === EXPECTED_COUNT) ok(`ARCHETYPE_HEX has ${EXPECTED_COUNT} entries`)
  else fail(`ARCHETYPE_HEX has ${hexKeys.length} entries, expected ${EXPECTED_COUNT}`)
}

// ── Cross-check PersonalityClient.tsx ─────────────────────────
console.log('\n── app/personality/PersonalityClient.tsx ──')

const signColorsMatch = clientTsx.match(/const SIGN_COLORS[^=]+=\s*\{([^}]+)\}/)
if (!signColorsMatch) {
  fail('Could not locate SIGN_COLORS in PersonalityClient.tsx')
} else {
  const colorKeys = [...signColorsMatch[1].matchAll(/'?([a-z-]+)'?\s*:/g)].map(m => m[1])
  const colorSet = new Set(colorKeys)

  for (const id of idMatches) {
    if (!colorSet.has(id)) fail(`'${id}' missing from SIGN_COLORS`)
  }
  if (colorKeys.length === EXPECTED_COUNT) ok(`SIGN_COLORS has ${EXPECTED_COUNT} entries`)
  else fail(`SIGN_COLORS has ${colorKeys.length} entries, expected ${EXPECTED_COUNT}`)
}

// ── Summary ────────────────────────────────────────────────────
console.log('')
if (errors === 0 && warnings === 0) {
  console.log('✅ All personality consistency checks passed.\n')
  process.exit(0)
} else if (errors === 0) {
  console.log(`⚠️  Passed with ${warnings} warning(s).\n`)
  process.exit(0)
} else {
  console.log(`❌ ${errors} error(s), ${warnings} warning(s). Fix before shipping.\n`)
  process.exit(1)
}
