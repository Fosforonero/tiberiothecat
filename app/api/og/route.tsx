import { NextRequest } from 'next/server'
import { getScenario } from '@/lib/scenarios'
import { getVotes } from '@/lib/redis'

export const runtime = 'edge'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id') ?? 'trolley'
  const scenario = getScenario(id)

  let pctA = 50
  let pctB = 50
  if (scenario) {
    try {
      const votes = await getVotes(id)
      const total = votes.a + votes.b
      if (total > 0) {
        pctA = Math.round((votes.a / total) * 100)
        pctB = 100 - pctA
      }
    } catch {
      // fallback to 50/50
    }
  }

  const question = scenario?.question ?? 'What would you choose?'
  const optA = scenario?.optionA ?? 'Option A'
  const optB = scenario?.optionB ?? 'Option B'
  const barA = Math.round(1080 * pctA / 100)
  const barB = 1080 - barA

  const svg = `
<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
  <rect width="1200" height="630" fill="#0a0a0f"/>
  <rect x="0" y="0" width="1200" height="4" fill="#3b82f6"/>
  <text x="60" y="70" font-family="system-ui, sans-serif" font-size="28" font-weight="900" fill="#f1f5f9">SplitVote</text>
  <text x="60" y="160" font-family="system-ui" font-size="38" font-weight="700" fill="#f1f5f9">${question.slice(0, 80)}</text>
  <rect x="60" y="360" width="${barA}" height="48" rx="8" fill="#ef4444"/>
  <rect x="${60 + barA}" y="360" width="${barB}" height="48" rx="8" fill="#3b82f6"/>
  <text x="60" y="450" font-family="system-ui" font-size="52" font-weight="900" fill="#ef4444">${pctA}%</text>
  <text x="1140" y="450" font-family="system-ui" font-size="52" font-weight="900" fill="#3b82f6" text-anchor="end">${pctB}%</text>
  <text x="600" y="590" font-family="system-ui" font-size="22" font-weight="600" fill="#64748b" text-anchor="middle">splitvote.io</text>
</svg>`

  return new Response(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=300',
    },
  })
}
