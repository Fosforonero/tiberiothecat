#!/usr/bin/env node
/**
 * check-it-copy.mjs
 *
 * Lightweight QA script: grep account/personality surfaces for known English-only
 * UI strings that must NOT appear as hardcoded literals when locale=it is active.
 *
 * Run manually after any sprint touching ProfileClient, dashboard, CompanionDisplay,
 * DailyMissions, or PersonalityClient.
 *
 * Usage: node scripts/check-it-copy.mjs
 *
 * Does NOT block the build. Exits with code 1 only if violations are found,
 * so it can optionally be added to CI as a non-blocking warning step.
 */

import { readFileSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')

// Files to audit (relative to project root)
const FILES_TO_CHECK = [
  'app/profile/ProfileClient.tsx',
  'app/dashboard/page.tsx',
  'components/DailyMissions.tsx',
  'components/CompanionDisplay.tsx',
  'app/personality/PersonalityClient.tsx',
]

// Strings to check. Each entry specifies:
//   str:       exact UI string to look for (in string-literal context only)
//   file:      which file to check
//   asLiteral: if true, only match occurrences inside quotes (' " `) — avoids
//              matching prop/variable names that happen to contain the substring
const CHECKS = [
  // Demographics labels
  { str: 'Used only in aggregate',        file: 'app/profile/ProfileClient.tsx',  asLiteral: true  },
  { str: 'Birth Year',                    file: 'app/profile/ProfileClient.tsx',  asLiteral: true  },
  { str: "'Gender'",                      file: 'app/profile/ProfileClient.tsx',  asLiteral: false },
  { str: "'Male'",                        file: 'app/profile/ProfileClient.tsx',  asLiteral: false },
  { str: "'Female'",                      file: 'app/profile/ProfileClient.tsx',  asLiteral: false },
  { str: 'Select country',               file: 'app/profile/ProfileClient.tsx',  asLiteral: true  },
  // Stats section
  { str: 'Dilemmas voted',                file: 'app/profile/ProfileClient.tsx',  asLiteral: true  },
  { str: 'Badges earned',                 file: 'app/profile/ProfileClient.tsx',  asLiteral: true  },
  { str: 'Day streak',                    file: 'app/profile/ProfileClient.tsx',  asLiteral: true  },
  { str: 'Member since',                  file: 'app/profile/ProfileClient.tsx',  asLiteral: true  },
  // Personality section in profile
  { str: 'Your archetype is ready',       file: 'app/profile/ProfileClient.tsx',  asLiteral: true  },
  { str: 'Discover your moral profile',   file: 'app/profile/ProfileClient.tsx',  asLiteral: true  },
  // Membership
  { str: 'Manage Billing',                file: 'app/profile/ProfileClient.tsx',  asLiteral: true  },
  // Dashboard missions / companion (check absence of EN-only strings NOT in ternary)
  { str: "Today's Missions",             file: 'components/DailyMissions.tsx',    asLiteral: true  },
  { str: 'Your Companion',               file: 'components/CompanionDisplay.tsx', asLiteral: true  },
]

// How many lines above/below the match to look for `IT ?` guard
const CONTEXT_LINES = 5

let violations = 0

for (const { str, file, asLiteral } of CHECKS) {
  const fullPath = join(ROOT, file)
  if (!existsSync(fullPath)) {
    console.warn(`  ⚠️  File not found: ${file}`)
    continue
  }
  const src = readFileSync(fullPath, 'utf-8')
  const lines = src.split('\n')

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    // Skip if string not on this line at all
    if (!line.includes(str)) continue

    // If asLiteral=false, the str already includes its own quotes (e.g. "'Male'")
    // If asLiteral=true, check that the string appears inside a string literal delimiter
    if (asLiteral) {
      // Look for the string surrounded by ' or " (simple heuristic: line contains 'str or "str)
      const inQuotes = /['"`]/.test(line.slice(line.indexOf(str) - 1, line.indexOf(str)))
        || line.includes(`'${str}`)
        || line.includes(`"${str}`)
      if (!inQuotes) continue
    }

    // Build context window (±CONTEXT_LINES)
    const start = Math.max(0, i - CONTEXT_LINES)
    const end   = Math.min(lines.length - 1, i + CONTEXT_LINES)
    const context = lines.slice(start, end + 1).join('\n')

    // Properly guarded if:
    // 1. Context contains an IT ternary guard
    // 2. The string is inside a copy object definition (EN_COPY / IT_COPY key)
    const guarded =
      context.includes('IT ?') ||
      context.includes('IT?') ||
      // Copy object key patterns in PersonalityClient
      /^\s+\w+:\s+['"`]/.test(line) && (
        context.includes('EN_COPY') || context.includes('IT_COPY')
      ) ||
      // The line itself is inside a copy object block (heuristic: indented key: 'value')
      /^\s{2,4}(loading|unlockTitle|unlockDesc|signIn|almostTitle|votes|voteLink|header|profileTitle|basedOn|sign|lowConfidence|share|download|copied|communityVerdict|axesTitle|refine|disclaimer|resultsUpdate):/.test(line)

    if (!guarded) {
      if (violations === 0) console.log('\n🔍 check-it-copy: possible hardcoded EN strings in IT surfaces:\n')
      console.log(`  ❌  ${file}:${i + 1}`)
      console.log(`        → "${str}"`)
      console.log(`        ${line.trim()}\n`)
      violations++
    }
  }
}

if (violations === 0) {
  console.log('✅  check-it-copy: no hardcoded EN strings found in IT surfaces.')
} else {
  console.log(`\n⚠️   ${violations} potential violation(s). Review the lines above.`)
  console.log('     False positives: strings inside EN_COPY/IT_COPY objects are safe.\n')
  process.exit(1)
}
