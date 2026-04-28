import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'
import { getScenario } from '@/lib/scenarios'
import { getDynamicScenario } from '@/lib/dynamic-scenarios'
import { IT_SCENARIO_TRANSLATIONS } from '@/lib/scenarios-it'
import { getVotes } from '@/lib/redis'

export const runtime = 'edge'

function trunc(text: string, max: number): string {
  return text.length > max ? text.slice(0, max) + '…' : text
}

/**
 * GET /api/story-card?id={scenarioId}&locale=en|it
 * Returns a 1080×1920 PNG story card ready for Instagram/TikTok Stories.
 * Card shows aggregate results only — no personal vote data.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const id     = searchParams.get('id') ?? 'trolley'
  const locale = searchParams.get('locale') ?? 'en'
  const isIT   = locale === 'it'

  const scenario = getScenario(id) ?? await getDynamicScenario(id)

  let question = scenario?.question ?? (isIT ? 'Cosa sceglieresti?' : 'What would you choose?')
  let optA     = scenario?.optionA ?? 'Option A'
  let optB     = scenario?.optionB ?? 'Option B'
  const emoji  = scenario?.emoji ?? '🌍'

  // Use Italian translations for static scenarios when locale=it
  if (isIT) {
    const isDynamicIT = scenario && 'locale' in scenario && (scenario as { locale?: string }).locale === 'it'
    if (!isDynamicIT) {
      const itTr = IT_SCENARIO_TRANSLATIONS[id]
      if (itTr) { question = itTr.question; optA = itTr.optionA; optB = itTr.optionB }
    }
  }

  let pctA = 50, pctB = 50, totalVotes = 0
  try {
    const votes = await getVotes(id)
    totalVotes = votes.a + votes.b
    if (totalVotes > 0) {
      pctA = Math.round((votes.a / totalVotes) * 100)
      pctB = 100 - pctA
    }
  } catch { /* fallback 50/50 */ }

  const colorA = 'rgba(239,68,68,0.65)'
  const colorB = 'rgba(59,130,246,0.65)'

  const subtitle   = isIT ? 'Cosa sceglierebbe il mondo?' : 'What would the world choose?'
  const votesLabel = isIT
    ? `${totalVotes.toLocaleString('it-IT')} voti nel mondo`
    : `${totalVotes.toLocaleString()} votes worldwide`
  const ctaText    = isIT ? 'Cosa sceglieresti TU? →' : 'What would YOU choose? →'
  const urlLabel     = `splitvote.io/play/${id}`

  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          width: '100%',
          height: '100%',
          background: 'linear-gradient(135deg, #07071a 0%, #0d0d2e 100%)',
          fontFamily: '"system-ui", sans-serif',
          position: 'relative',
        }}
      >
        {/* Decorative orbs */}
        <div style={{
          position: 'absolute', top: 60, left: -80,
          width: 440, height: 440, borderRadius: '50%',
          background: 'rgba(79,70,229,0.12)', display: 'flex',
        }} />
        <div style={{
          position: 'absolute', bottom: 80, right: -60,
          width: 360, height: 360, borderRadius: '50%',
          background: 'rgba(6,182,212,0.10)', display: 'flex',
        }} />

        {/* ── Logo ── */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 88 }}>
          <div style={{ display: 'flex', fontSize: 52, fontWeight: 900, color: 'white', letterSpacing: '-1px' }}>
            <span>Split</span>
            <span style={{ color: '#60a5fa' }}>Vote</span>
          </div>
          <div style={{ display: 'flex', fontSize: 28, color: 'rgba(255,255,255,0.35)', marginTop: 10 }}>
            {subtitle}
          </div>
        </div>

        {/* Divider */}
        <div style={{ width: 760, height: 1, background: 'rgba(255,255,255,0.08)', margin: '28px 0' }} />

        {/* Emoji */}
        <div style={{ display: 'flex', fontSize: 148, lineHeight: 1, marginBottom: 36 }}>
          {emoji}
        </div>

        {/* Question */}
        <div style={{
          display: 'flex',
          fontSize: 52,
          fontWeight: 800,
          color: 'white',
          textAlign: 'center',
          textWrap: 'wrap',
          maxWidth: 900,
          lineHeight: 1.25,
          padding: '0 80px',
          justifyContent: 'center',
        }}>
          {question}
        </div>

        {/* Spacer */}
        <div style={{ display: 'flex', flexGrow: 1, minHeight: 48 }} />

        {/* ── Vote bars ── */}
        <div style={{ display: 'flex', flexDirection: 'column', width: 760, gap: 16, marginBottom: 28 }}>
          {/* Option A */}
          <div style={{
            position: 'relative', width: 760, height: 88,
            borderRadius: 20, overflow: 'hidden', display: 'flex',
          }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(255,255,255,0.05)', display: 'flex' }} />
            <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: `${pctA}%`, background: colorA, display: 'flex' }} />
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px',
            }}>
              <span style={{ fontSize: 28, fontWeight: 700, color: 'white', maxWidth: 540 }}>
                {trunc(optA, 32)}
              </span>
              <span style={{ fontSize: 40, fontWeight: 900, color: '#ef4444', marginLeft: 16 }}>
                {pctA}%
              </span>
            </div>
          </div>

          {/* Option B */}
          <div style={{
            position: 'relative', width: 760, height: 88,
            borderRadius: 20, overflow: 'hidden', display: 'flex',
          }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(255,255,255,0.05)', display: 'flex' }} />
            <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: `${pctB}%`, background: colorB, display: 'flex' }} />
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px',
            }}>
              <span style={{ fontSize: 28, fontWeight: 700, color: 'white', maxWidth: 540 }}>
                {trunc(optB, 32)}
              </span>
              <span style={{ fontSize: 40, fontWeight: 900, color: '#60a5fa', marginLeft: 16 }}>
                {pctB}%
              </span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, marginBottom: 32 }}>
          <div style={{ display: 'flex', fontSize: 28, color: 'rgba(255,255,255,0.35)' }}>
            {votesLabel}
          </div>
        </div>

        {/* CTA */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: 760, height: 80,
          borderRadius: 24,
          background: 'rgba(59,130,246,0.14)',
          border: '1px solid rgba(59,130,246,0.28)',
          marginBottom: 24,
        }}>
          <span style={{ fontSize: 34, fontWeight: 800, color: '#60a5fa' }}>
            {ctaText}
          </span>
        </div>

        {/* URL */}
        <div style={{ display: 'flex', fontSize: 26, color: 'rgba(255,255,255,0.22)', marginBottom: 48 }}>
          {urlLabel}
        </div>
      </div>
    ),
    {
      width: 1080,
      height: 1920,
      headers: {
        'Cache-Control': 'public, max-age=60, stale-while-revalidate=300',
        'Content-Disposition': `inline; filename="splitvote-story-${id}.png"`,
      },
    },
  )
}
