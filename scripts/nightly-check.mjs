#!/usr/bin/env node
/**
 * nightly-check.mjs
 *
 * Runs safe, read-only checks in sequence and prints a consolidated report.
 * Safe to run without GO — falls under SAFE_AUTONOMOUS per CLAUDE.md.
 *
 * Included:
 *   - validate-personality.mjs   (read-only: lib/personality.ts consistency)
 *   - check-it-copy.mjs          (read-only: grep for hardcoded EN strings in IT surfaces)
 *
 * Excluded:
 *   - generate-social-content.mjs (excluded: writes to content-output/ and can read Redis)
 *
 * Usage:  npm run nightly:check
 * No new dependencies — uses only Node built-ins.
 */

import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const CHECKS = [
  {
    name: 'validate-personality',
    script: path.join(__dirname, 'validate-personality.mjs'),
    description: 'Personality system consistency (lib/personality.ts vs card route vs client)',
  },
  {
    name: 'check-it-copy',
    script: path.join(__dirname, 'check-it-copy.mjs'),
    description: 'Hardcoded EN strings in IT surfaces',
  },
]

const EXCLUDED = [
  {
    name: 'generate-social-content',
    reason: 'excluded by safety policy — writes to content-output/ and can read Redis',
  },
]

function runScript(scriptPath) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [scriptPath], {
      stdio: ['ignore', 'pipe', 'pipe'],
      env: process.env,
    })
    let stdout = ''
    let stderr = ''
    child.stdout.on('data', (d) => { stdout += d.toString() })
    child.stderr.on('data', (d) => { stderr += d.toString() })
    child.on('close', (code) => resolve({ code, stdout, stderr }))
  })
}

const results = []
const start = Date.now()

console.log('\n══════════════════════════════════════════')
console.log('  SplitVote — Nightly Check')
console.log(`  ${new Date().toISOString()}`)
console.log('══════════════════════════════════════════\n')

for (const check of CHECKS) {
  console.log(`▶ ${check.name}: ${check.description}`)
  const { code, stdout, stderr } = await runScript(check.script)
  const output = (stdout + stderr).trim()
  if (output) {
    for (const line of output.split('\n')) {
      console.log(`  ${line}`)
    }
  }
  const passed = code === 0
  results.push({ name: check.name, passed, code })
  console.log(`  → ${passed ? '✅ PASS' : `❌ FAIL (exit ${code})`}\n`)
}

console.log('──────────────────────────────────────────')
console.log('  Excluded scripts (safety policy):')
for (const ex of EXCLUDED) {
  console.log(`  ⊘ ${ex.name}: ${ex.reason}`)
}
console.log('')

const elapsed = ((Date.now() - start) / 1000).toFixed(1)
const passed = results.filter((r) => r.passed).length
const failed = results.filter((r) => !r.passed).length

console.log('══════════════════════════════════════════')
console.log(`  SUMMARY: ${passed}/${results.length} passed, ${failed} failed  (${elapsed}s)`)
console.log('══════════════════════════════════════════\n')

if (failed > 0) process.exit(1)
