/**
 * /api/dilemma-result-card
 *
 * Edge SVG OG card for /results/[id] and /it/results/[id] pages.
 * Curiosity-gap design: shows the dilemma question + options + vote count
 * but deliberately hides the vote split — percentages are NOT shown so that
 * recipients are compelled to click and find out.
 *
 * Query params:
 *  ?id=<dilemmaId>   — required
 *  ?locale=it        — Italian text (default: en)
 *
 * Cache: 60 s max-age, 5 min stale-while-revalidate (live data, but not real-time).
 */

import { NextRequest } from 'next/server'
import { getScenario } from '@/lib/scenarios'
import { getDynamicScenario } from '@/lib/dynamic-scenarios'
import { getItalianScenario } from '@/lib/scenarios-it'
import { getVotes } from '@/lib/redis'

export const runtime = 'edge'

/** Wrap text into at most 2 lines of max `maxChars` chars (word-aware). */
function wrapText(text: string, maxChars: number): [string, string] {
  if (text.length <= maxChars) return [text, '']
  const words = text.split(' ')
  let line1 = ''
  for (let i = 0; i < words.length; i++) {
    const candidate = (line1 + ' ' + words[i]).trim()
    if (candidate.length <= maxChars) {
      line1 = candidate
    } else {
      return [line1, words.slice(i).join(' ')]
    }
  }
  return [line1, '']
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id') ?? 'trolley'
  const locale = searchParams.get('locale') ?? 'en'
  const IT = locale === 'it'

  // ── Resolve scenario text ────────────────────────────────────────
  let scenario: { question: string; optionA: string; optionB: string; emoji?: string } | undefined

  if (IT) {
    // Prefer an IT-locale dynamic scenario; fall back to translated static
    const dynamic = await getDynamicScenario(id)
    scenario = dynamic?.locale === 'it'
      ? dynamic
      : (getItalianScenario(id) ?? getScenario(id))
  } else {
    scenario = getScenario(id) ?? await getDynamicScenario(id)
  }

  // ── Live vote split ──────────────────────────────────────────────
  let pctA = 50
  let pctB = 50
  let totalVotes = 0
  try {
    const votes = await getVotes(id)
    totalVotes = votes.a + votes.b
    if (totalVotes > 0) {
      pctA = Math.round((votes.a / totalVotes) * 100)
      pctB = 100 - pctA
    }
  } catch {
    // fallback: 50/50
  }

  // ── Text content ─────────────────────────────────────────────────
  const question = escapeXml(
    scenario?.question ?? (IT ? 'Cosa sceglieresti?' : 'What would you choose?'),
  )
  const optA = escapeXml(scenario?.optionA ?? 'A')
  const optB = escapeXml(scenario?.optionB ?? 'B')
  const emoji = (scenario as { emoji?: string } | undefined)?.emoji ?? '🌍'

  const [q1, q2Raw] = wrapText(question, 42)
  const q2 = q2Raw.length > 42 ? q2Raw.slice(0, 41) + '…' : q2Raw
  const twoLines = Boolean(q2)

  const votesLabel = totalVotes > 0
    ? IT
      ? `${totalVotes.toLocaleString('it-IT')} persone hanno già votato`
      : `${totalVotes.toLocaleString('en-US')} people have already voted`
    : IT ? 'Sii il primo a votare!' : 'Be the first to vote!'

  // Curiosity gap: never reveal the split — the teaser drives clicks
  const teaser1 = IT ? 'Sai come si divide il voto?' : 'Can you guess how'
  const teaser2 = IT ? '' : 'the vote splits?'
  const ctaText = IT
    ? 'Vota e scopri il risultato → splitvote.io'
    : 'Vote and see the result → splitvote.io'

  // ── Bar geometry (hidden percentages — curiosity gap) ────────────
  const BAR_W = 1080
  const barA  = Math.max(4, Math.round(BAR_W * pctA / 100))
  const barB  = Math.max(4, BAR_W - barA)

  // Vertical positions shift when there are two question lines
  const barY    = twoLines ? 265 : 218
  const teaserY = twoLines ? 370 : 325
  const teaser2Y = teaserY + 68
  const optY    = twoLines ? 480 : 435

  const svg = `<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0a0a0f"/>
      <stop offset="100%" style="stop-color:#0f0f1a"/>
    </linearGradient>
    <linearGradient id="topBar" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%"   style="stop-color:#ef4444"/>
      <stop offset="50%"  style="stop-color:#8b5cf6"/>
      <stop offset="100%" style="stop-color:#3b82f6"/>
    </linearGradient>
    <linearGradient id="gA" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%"   style="stop-color:#ef4444"/>
      <stop offset="100%" style="stop-color:#f87171"/>
    </linearGradient>
    <linearGradient id="gB" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%"   style="stop-color:#60a5fa"/>
      <stop offset="100%" style="stop-color:#3b82f6"/>
    </linearGradient>
    <filter id="glow">
      <feGaussianBlur stdDeviation="6" result="coloredBlur"/>
      <feMerge>
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>

  <!-- Background -->
  <rect width="1200" height="630" fill="url(#bg)"/>
  <pattern id="dots" x="0" y="0" width="30" height="30" patternUnits="userSpaceOnUse">
    <circle cx="1" cy="1" r="1" fill="#ffffff" opacity="0.04"/>
  </pattern>
  <rect width="1200" height="630" fill="url(#dots)"/>

  <!-- Top gradient bar -->
  <rect x="0" y="0" width="1200" height="6" fill="url(#topBar)"/>

  <!-- Dilemma emoji -->
  <text x="60" y="105"
        font-family="system-ui, sans-serif"
        font-size="56">${emoji}</text>

  <!-- Brand -->
  <text x="1140" y="55"
        font-family="system-ui, -apple-system, BlinkMacSystemFont, sans-serif"
        font-size="16" font-weight="900" fill="#475569"
        text-anchor="end" letter-spacing="1">splitvote.io</text>

  <!-- Question line 1 -->
  <text x="60" y="175"
        font-family="system-ui, -apple-system, BlinkMacSystemFont, sans-serif"
        font-size="44" font-weight="800" fill="#f1f5f9">${q1}</text>

  ${q2 ? `<!-- Question line 2 -->
  <text x="60" y="228"
        font-family="system-ui, -apple-system, BlinkMacSystemFont, sans-serif"
        font-size="44" font-weight="800" fill="#f1f5f9">${q2}</text>` : ''}

  <!-- Split bar track -->
  <rect x="60" y="${barY}" width="1080" height="14" rx="7" fill="#1e293b"/>

  <!-- Split bar A (red) — shown without labels to intrigue, not inform -->
  <rect x="60" y="${barY}" width="${barA}" height="14" rx="7" fill="url(#gA)"/>

  <!-- Split bar B (blue) -->
  <rect x="${60 + barA}" y="${barY}" width="${barB}" height="14" rx="7" fill="url(#gB)"/>

  <!-- Option A label (left) -->
  <text x="60" y="${barY - 12}"
        font-family="system-ui, -apple-system, BlinkMacSystemFont, sans-serif"
        font-size="18" font-weight="600" fill="#ef4444">${optA.length > 28 ? optA.slice(0, 27) + '…' : optA}</text>

  <!-- Option B label (right) -->
  <text x="1140" y="${barY - 12}"
        font-family="system-ui, -apple-system, BlinkMacSystemFont, sans-serif"
        font-size="18" font-weight="600" fill="#60a5fa"
        text-anchor="end">${optB.length > 28 ? optB.slice(0, 27) + '…' : optB}</text>

  <!-- Curiosity gap teaser -->
  <text x="600" y="${teaserY}"
        font-family="system-ui, -apple-system, BlinkMacSystemFont, sans-serif"
        font-size="52" font-weight="900" fill="#f1f5f9"
        filter="url(#glow)"
        text-anchor="middle">${teaser1}</text>

  ${teaser2 ? `<text x="600" y="${teaser2Y}"
        font-family="system-ui, -apple-system, BlinkMacSystemFont, sans-serif"
        font-size="52" font-weight="900" fill="#f1f5f9"
        filter="url(#glow)"
        text-anchor="middle">${teaser2}</text>` : ''}

  <!-- Vote count (social proof without direction) -->
  <text x="600" y="${optY}"
        font-family="system-ui, -apple-system, BlinkMacSystemFont, sans-serif"
        font-size="19" font-weight="500" fill="#475569"
        text-anchor="middle">${votesLabel}</text>

  <!-- Separator -->
  <rect x="60" y="565" width="1080" height="1" fill="#1e293b"/>

  <!-- CTA -->
  <text x="600" y="605"
        font-family="system-ui, -apple-system, BlinkMacSystemFont, sans-serif"
        font-size="22" font-weight="700" fill="#94a3b8"
        text-anchor="middle">${ctaText}</text>
</svg>`

  return new Response(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=60, stale-while-revalidate=300',
    },
  })
}
