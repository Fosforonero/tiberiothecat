import { NextRequest } from 'next/server'
import { getScenario } from '@/lib/scenarios'
import { getVotes } from '@/lib/redis'

export const runtime = 'edge'

function wrapText(text: string, maxChars: number): [string, string] {
  if (text.length <= maxChars) return [text, '']
  const words = text.split(' ')
  let line1 = ''
  for (let i = 0; i < words.length; i++) {
    const candidate = (line1 + ' ' + words[i]).trim()
    if (candidate.length <= maxChars) {
      line1 = candidate
    } else {
      const line2 = words.slice(i).join(' ')
      return [line1, line2]
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
  const scenario = getScenario(id)

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
    } catch {
      // fallback to 50/50
    }
  }

  const question = escapeXml(scenario?.question ?? 'What would you choose?')
  const optA = escapeXml(scenario?.optionA ?? 'Option A')
  const optB = escapeXml(scenario?.optionB ?? 'Option B')
  const emoji = scenario?.emoji ?? '🌍'

  const [q1, q2] = wrapText(question, 42)
  const q2Trimmed = q2.length > 42 ? q2.slice(0, 41) + '…' : q2

  // Bar widths — total bar area 1080px (x: 60 to 1140)
  const BAR_W = 1080
  const barA = Math.max(4, Math.round(BAR_W * pctA / 100))
  const barB = Math.max(4, BAR_W - barA)

  const votesLabel = totalVotes > 0
    ? `${totalVotes.toLocaleString('en-US')} votes worldwide`
    : 'Be the first to vote!'

  const svg = `<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0a0a0f"/>
      <stop offset="100%" style="stop-color:#0f0f1a"/>
    </linearGradient>
    <linearGradient id="topBar" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#ef4444"/>
      <stop offset="50%" style="stop-color:#8b5cf6"/>
      <stop offset="100%" style="stop-color:#3b82f6"/>
    </linearGradient>
    <linearGradient id="gA" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#ef4444"/>
      <stop offset="100%" style="stop-color:#f87171"/>
    </linearGradient>
    <linearGradient id="gB" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#60a5fa"/>
      <stop offset="100%" style="stop-color:#3b82f6"/>
    </linearGradient>
    <filter id="glow">
      <feGaussianBlur stdDeviation="8" result="coloredBlur"/>
      <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>

  <!-- Background -->
  <rect width="1200" height="630" fill="url(#bg)"/>

  <!-- Subtle dot grid -->
  <pattern id="dots" x="0" y="0" width="30" height="30" patternUnits="userSpaceOnUse">
    <circle cx="1" cy="1" r="1" fill="#ffffff" opacity="0.04"/>
  </pattern>
  <rect width="1200" height="630" fill="url(#dots)"/>

  <!-- Top gradient bar -->
  <rect x="0" y="0" width="1200" height="6" fill="url(#topBar)"/>

  <!-- Emoji -->
  <text x="60" y="105" font-family="system-ui, sans-serif" font-size="56">${emoji}</text>

  <!-- SplitVote wordmark -->
  <text x="1140" y="56" font-family="system-ui, -apple-system, BlinkMacSystemFont, sans-serif" font-size="20" font-weight="900" fill="#334155" text-anchor="end" letter-spacing="3">SPLITVOTE.IO</text>

  <!-- Question line 1 -->
  <text x="60" y="175" font-family="system-ui, -apple-system, BlinkMacSystemFont, sans-serif" font-size="44" font-weight="800" fill="#f1f5f9">${q1}</text>
  ${q2Trimmed ? `<text x="60" y="228" font-family="system-ui, -apple-system, BlinkMacSystemFont, sans-serif" font-size="44" font-weight="800" fill="#f1f5f9">${q2Trimmed}</text>` : ''}

  <!-- Split bar background -->
  <rect x="60" y="${q2Trimmed ? 265 : 218}" width="1080" height="14" rx="7" fill="#1e293b"/>

  <!-- Split bar A -->
  <rect x="60" y="${q2Trimmed ? 265 : 218}" width="${barA}" height="14" rx="7" fill="url(#gA)"/>

  <!-- Split bar B -->
  <rect x="${60 + barA}" y="${q2Trimmed ? 265 : 218}" width="${barB}" height="14" rx="7" fill="url(#gB)"/>

  <!-- Percentage A (big) -->
  <text x="60" y="${q2Trimmed ? 390 : 345}" font-family="system-ui, -apple-system, BlinkMacSystemFont, sans-serif" font-size="110" font-weight="900" fill="#ef4444" filter="url(#glow)">${pctA}%</text>

  <!-- Percentage B (big) -->
  <text x="1140" y="${q2Trimmed ? 390 : 345}" font-family="system-ui, -apple-system, BlinkMacSystemFont, sans-serif" font-size="110" font-weight="900" fill="#3b82f6" text-anchor="end" filter="url(#glow)">${pctB}%</text>

  <!-- VS divider -->
  <text x="600" y="${q2Trimmed ? 375 : 330}" font-family="system-ui, sans-serif" font-size="24" font-weight="900" fill="#334155" text-anchor="middle">VS</text>

  <!-- Option A label -->
  <text x="60" y="${q2Trimmed ? 435 : 390}" font-family="system-ui, -apple-system, BlinkMacSystemFont, sans-serif" font-size="22" font-weight="600" fill="#94a3b8">${optA.length > 30 ? optA.slice(0, 29) + '…' : optA}</text>

  <!-- Option B label -->
  <text x="1140" y="${q2Trimmed ? 435 : 390}" font-family="system-ui, -apple-system, BlinkMacSystemFont, sans-serif" font-size="22" font-weight="600" fill="#94a3b8" text-anchor="end">${optB.length > 30 ? optB.slice(0, 29) + '…' : optB}</text>

  <!-- Bottom divider -->
  <rect x="60" y="565" width="1080" height="1" fill="#1e293b"/>

  <!-- CTA -->
  <text x="600" y="600" font-family="system-ui, -apple-system, BlinkMacSystemFont, sans-serif" font-size="22" font-weight="700" fill="#475569" text-anchor="middle">What would YOU choose? → splitvote.io</text>

  <!-- Votes count -->
  <text x="600" y="535" font-family="system-ui, -apple-system, BlinkMacSystemFont, sans-serif" font-size="18" font-weight="500" fill="#334155" text-anchor="middle">${votesLabel}</text>
</svg>`

  return new Response(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=60, stale-while-revalidate=300',
    },
  })
}
