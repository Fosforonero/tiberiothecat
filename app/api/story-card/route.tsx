import { NextRequest, NextResponse } from 'next/server'
import { getScenario } from '@/lib/scenarios'
import { getDynamicScenario } from '@/lib/dynamic-scenarios'
import { getVotes } from '@/lib/redis'

export const runtime = 'edge'

function esc(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function wrapText(text: string, maxChars: number): string[] {
  const words = text.split(' ')
  const lines: string[] = []
  let current = ''
  for (const word of words) {
    if ((current + ' ' + word).trim().length <= maxChars) {
      current = (current + ' ' + word).trim()
    } else {
      if (current) lines.push(current)
      current = word
    }
  }
  if (current) lines.push(current)
  return lines.slice(0, 4) // max 4 lines
}

/**
 * GET /api/story-card?id={scenarioId}&voted=a|b
 * Returns a 1080×1920 SVG story card ready for Instagram/TikTok Stories.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id') ?? 'trolley'
  const voted = searchParams.get('voted') as 'a' | 'b' | null

  const scenario = getScenario(id) ?? await getDynamicScenario(id)

  let pctA = 50
  let pctB = 50
  let totalVotes = 0

  if (scenario) {
    try {
      const votes = await getVotes(id)
      totalVotes = votes.a + votes.b
      if (totalVotes > 0) {
        pctA = Math.round((votes.a / totalVotes) * 100)
        pctB = 100 - pctA
      }
    } catch { /* fallback 50/50 */ }
  }

  const question = esc(scenario?.question ?? 'What would you choose?')
  const optA = esc(scenario?.optionA ?? 'Option A')
  const optB = esc(scenario?.optionB ?? 'Option B')
  const emoji = scenario?.emoji ?? '🌍'

  const questionLines = wrapText(question, 28)
  const questionSvg = questionLines
    .map((line, i) => `<tspan x="540" dy="${i === 0 ? 0 : 64}">${esc(line)}</tspan>`)
    .join('')

  const barWidthA = Math.round((pctA / 100) * 760)
  const barWidthB = Math.round((pctB / 100) * 760)

  const votedAColor = voted === 'a' ? '#ef4444' : '#ef444488'
  const votedBColor = voted === 'b' ? '#3b82f6' : '#3b82f688'

  const votedLine = voted
    ? `<text x="540" y="1760" font-family="system-ui,sans-serif" font-size="32" fill="#ffffff99" text-anchor="middle">
        You chose: ${esc(voted === 'a' ? (scenario?.optionA ?? 'A') : (scenario?.optionB ?? 'B'))}
       </text>`
    : ''

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1920" width="1080" height="1920">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#07071a"/>
      <stop offset="100%" stop-color="#0d0d2e"/>
    </linearGradient>
    <linearGradient id="barA" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="${votedAColor}"/>
      <stop offset="100%" stop-color="#ff6b6b44"/>
    </linearGradient>
    <linearGradient id="barB" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="${votedBColor}"/>
      <stop offset="100%" stop-color="#60a5fa44"/>
    </linearGradient>
    <filter id="glow">
      <feGaussianBlur stdDeviation="20" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>

  <!-- Background -->
  <rect width="1080" height="1920" fill="url(#bg)"/>

  <!-- Decorative orbs -->
  <circle cx="150" cy="300" r="220" fill="#4f46e520" filter="url(#glow)"/>
  <circle cx="950" cy="1600" r="180" fill="#06b6d420" filter="url(#glow)"/>

  <!-- Logo area -->
  <text x="540" y="140" font-family="system-ui,sans-serif" font-size="44" font-weight="900"
        fill="white" text-anchor="middle" letter-spacing="-1">
    Split<tspan fill="#60a5fa">Vote</tspan>
  </text>
  <text x="540" y="190" font-family="system-ui,sans-serif" font-size="26" fill="#ffffff55"
        text-anchor="middle">What would the world choose?</text>

  <!-- Divider -->
  <line x1="160" y1="220" x2="920" y2="220" stroke="#ffffff15" stroke-width="1"/>

  <!-- Emoji -->
  <text x="540" y="440" font-size="140" text-anchor="middle">${emoji}</text>

  <!-- Question -->
  <text font-family="system-ui,sans-serif" font-size="58" font-weight="800" fill="white"
        text-anchor="middle" x="540" y="${540 + (questionLines.length - 1) * 32}">
    ${questionSvg}
  </text>

  <!-- Option A bar -->
  <rect x="160" y="900" width="760" height="88" rx="20" fill="#ffffff08"/>
  <rect x="160" y="900" width="${barWidthA}" height="88" rx="20" fill="url(#barA)"/>
  <text x="180" y="956" font-family="system-ui,sans-serif" font-size="32" font-weight="700"
        fill="white">${esc(optA.length > 24 ? optA.slice(0, 24) + '…' : optA)}</text>
  <text x="900" y="956" font-family="system-ui,sans-serif" font-size="44" font-weight="900"
        fill="#ef4444" text-anchor="end">${pctA}%</text>

  <!-- Option B bar -->
  <rect x="160" y="1020" width="760" height="88" rx="20" fill="#ffffff08"/>
  <rect x="160" y="1020" width="${barWidthB}" height="88" rx="20" fill="url(#barB)"/>
  <text x="180" y="1076" font-family="system-ui,sans-serif" font-size="32" font-weight="700"
        fill="white">${esc(optB.length > 24 ? optB.slice(0, 24) + '…' : optB)}</text>
  <text x="900" y="1076" font-family="system-ui,sans-serif" font-size="44" font-weight="900"
        fill="#3b82f6" text-anchor="end">${pctB}%</text>

  <!-- Total votes -->
  <text x="540" y="1180" font-family="system-ui,sans-serif" font-size="30" fill="#ffffff55"
        text-anchor="middle">${totalVotes.toLocaleString()} votes worldwide</text>

  <!-- Your vote -->
  ${votedLine}

  <!-- CTA -->
  <rect x="160" y="1800" width="760" height="88" rx="24" fill="#3b82f620" stroke="#3b82f640" stroke-width="1"/>
  <text x="540" y="1856" font-family="system-ui,sans-serif" font-size="36" font-weight="800"
        fill="#60a5fa" text-anchor="middle">What would YOU choose? →</text>

  <!-- URL -->
  <text x="540" y="1920" font-family="system-ui,sans-serif" font-size="28" fill="#ffffff40"
        text-anchor="middle">splitvote.io/play/${esc(id)}</text>
</svg>`

  return new NextResponse(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=60, stale-while-revalidate=300',
    },
  })
}
