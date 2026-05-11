import { NextRequest } from 'next/server'

export const runtime = 'edge'

// Accent colours per species
const ACCENTS = ['#fbbf24', '#a78bfa', '#34d399', '#60a5fa', '#fb923c']

// Stage-1 emojis for the five free/unlockable species
const EMOJIS = ['⚡', '🔮', '🍄', '🌑', '🪐']

// Short species labels (same in EN/IT)
const NAMES = ['Spark', 'Blip', 'Momo', 'Shade', 'Orbit']

const UNLOCK_EN = ['Always free', 'Always free', '10 votes', '7-day streak', '100 votes']
const UNLOCK_IT = ['Sempre gratis', 'Sempre gratis', '10 voti', 'Streak 7 giorni', '100 voti']

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
  const locale = searchParams.get('locale') ?? 'en'
  const IT = locale === 'it'

  const headline = escapeXml(IT ? 'Conosci i Pixie' : 'Meet the Pixies')
  const subline = escapeXml(
    IT
      ? 'Piccoli compagni morali che crescono votando dilemmi impossibili.'
      : 'Small companions that grow as you vote on impossible moral dilemmas.',
  )
  const footer = escapeXml(IT ? '12 specie · 6 stadi di evoluzione · splitvote.io' : '12 species · 6 evolution stages · splitvote.io')
  const unlockLabels = IT ? UNLOCK_IT : UNLOCK_EN

  // 5 column centres: 200 400 600 800 1000
  const cols = [200, 400, 600, 800, 1000]
  const cy = 295   // vertical centre of emoji circles
  const r  = 82    // circle radius

  const speciesNodes = cols.map((cx, i) => {
    const accent  = ACCENTS[i]
    const emoji   = EMOJIS[i]
    const name    = NAMES[i]
    const unlock  = escapeXml(unlockLabels[i])

    return `
  <!-- ${name} -->
  <circle cx="${cx}" cy="${cy}" r="${r}"
          fill="${accent}10" stroke="${accent}" stroke-width="1.2" opacity="0.55"/>
  <text x="${cx}" y="${cy + 28}"
        font-family="system-ui, sans-serif"
        font-size="72" text-anchor="middle">${emoji}</text>
  <text x="${cx}" y="${cy + r + 30}"
        font-family="system-ui, -apple-system, BlinkMacSystemFont, sans-serif"
        font-size="16" font-weight="700" fill="${accent}" text-anchor="middle">${name}</text>
  <text x="${cx}" y="${cy + r + 50}"
        font-family="system-ui, -apple-system, BlinkMacSystemFont, sans-serif"
        font-size="13" fill="#475569" text-anchor="middle">${unlock}</text>`
  }).join('\n')

  // Rainbow top-bar gradient stops
  const stopPct = [0, 25, 50, 75, 100]
  const rainbowStops = ACCENTS.map((c, i) => `<stop offset="${stopPct[i]}%" style="stop-color:${c}"/>`).join('')

  const svg = `<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0a0a0f"/>
      <stop offset="100%" style="stop-color:#0d0d1a"/>
    </linearGradient>
    <linearGradient id="topBar" x1="0%" y1="0%" x2="100%" y2="0%">
      ${rainbowStops}
    </linearGradient>
    <pattern id="dots" x="0" y="0" width="30" height="30" patternUnits="userSpaceOnUse">
      <circle cx="1" cy="1" r="1" fill="#ffffff" opacity="0.03"/>
    </pattern>
  </defs>

  <!-- Background -->
  <rect width="1200" height="630" fill="url(#bg)"/>
  <rect width="1200" height="630" fill="url(#dots)"/>

  <!-- Rainbow top bar -->
  <rect x="0" y="0" width="1200" height="6" fill="url(#topBar)"/>

  <!-- Headline -->
  <text x="600" y="82"
        font-family="system-ui, -apple-system, BlinkMacSystemFont, sans-serif"
        font-size="52" font-weight="900" fill="#f1f5f9"
        text-anchor="middle">${headline}</text>

  <!-- Subline -->
  <text x="600" y="118"
        font-family="system-ui, -apple-system, BlinkMacSystemFont, sans-serif"
        font-size="19" fill="#64748b"
        text-anchor="middle">${subline}</text>

  <!-- Separator -->
  <rect x="80" y="142" width="1040" height="1" fill="#ffffff" opacity="0.06"/>

  <!-- Species grid -->
  ${speciesNodes}

  <!-- Bottom separator -->
  <rect x="80" y="502" width="1040" height="1" fill="#ffffff" opacity="0.05"/>

  <!-- Footer -->
  <text x="600" y="540"
        font-family="system-ui, -apple-system, BlinkMacSystemFont, sans-serif"
        font-size="15" fill="#334155" text-anchor="middle"
        letter-spacing="0.5">${footer}</text>

  <!-- Brand watermark -->
  <text x="600" y="600"
        font-family="system-ui, -apple-system, BlinkMacSystemFont, sans-serif"
        font-size="13" font-weight="700" fill="#1e293b"
        text-anchor="middle" letter-spacing="2">SPLITVOTE.IO</text>
</svg>`

  return new Response(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
    },
  })
}
