import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'
import { ARCHETYPES } from '@/lib/personality'

export const runtime = 'edge'

const VALID_IDS = new Set([
  'guardian', 'rebel', 'oracle', 'diplomat', 'strategist', 'empath',
  'idealist', 'pragmatist', 'protector', 'truth-teller', 'pioneer',
  'peacemaker', 'sentinel', 'advocate', 'visionary', 'maverick', 'stoic', 'caretaker',
])

const ARCHETYPE_HEX: Record<string, string> = {
  guardian:      '#3b82f6',
  rebel:         '#ef4444',
  oracle:        '#06b6d4',
  diplomat:      '#eab308',
  strategist:    '#a855f7',
  empath:        '#22c55e',
  idealist:      '#6366f1',
  pragmatist:    '#94a3b8',
  protector:     '#f97316',
  'truth-teller':'#f43f5e',
  pioneer:       '#f59e0b',
  peacemaker:    '#14b8a6',
  sentinel:      '#0ea5e9',
  advocate:      '#d946ef',
  visionary:     '#8b5cf6',
  maverick:      '#71717a',
  stoic:         '#78716c',
  caretaker:     '#ec4899',
}

/**
 * GET /api/personality-card?archetype=guardian&locale=en|it&format=story|og
 * - format=story (default): 1080×1920 PNG vertical (Instagram/TikTok stories)
 * - format=og: 1200×630 PNG horizontal (OG image for social link previews)
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const rawId  = searchParams.get('archetype') ?? 'diplomat'
  const locale = searchParams.get('locale') === 'it' ? 'it' : 'en'
  const format = searchParams.get('format') === 'og' ? 'og' : 'story'
  const isIT   = locale === 'it'

  const archetypeId = VALID_IDS.has(rawId) ? rawId : 'diplomat'
  const archetype   = ARCHETYPES.find(a => a.id === archetypeId) ?? ARCHETYPES[3]
  const color       = ARCHETYPE_HEX[archetypeId] ?? '#a855f7'

  const name     = isIT ? archetype.nameIt     : archetype.name
  const sign     = isIT ? archetype.signIt     : archetype.sign
  const tagline  = isIT ? archetype.taglineIt  : archetype.tagline
  const traits   = isIT ? archetype.traitsIt   : archetype.traits

  const signLabel  = isIT ? `Segno SplitVote: ${sign}` : `SplitVote Sign: ${sign}`
  const basedOn    = isIT ? 'Basato sulle mie scelte su SplitVote' : 'Based on my SplitVote choices'
  const disclaimer = isIT ? 'Solo intrattenimento — non validato scientificamente'
                          : 'For entertainment only — not scientifically validated'
  const urlLabel   = isIT ? 'splitvote.io/it/personality' : 'splitvote.io/personality'

  // ───────────────── HORIZONTAL OG (1200×630) ─────────────────
  if (format === 'og') {
    return new ImageResponse(
      (
        <div
          style={{
            display: 'flex',
            width: '100%',
            height: '100%',
            background: 'linear-gradient(135deg, #07071a 0%, #0d0d2e 60%, #080820 100%)',
            fontFamily: '"system-ui", sans-serif',
            position: 'relative',
          }}
        >
          {/* Background orbs */}
          <div style={{
            position: 'absolute', top: -120, left: -160,
            width: 480, height: 480, borderRadius: '50%',
            background: `${color}20`, display: 'flex',
          }} />
          <div style={{
            position: 'absolute', bottom: -80, right: -120,
            width: 360, height: 360, borderRadius: '50%',
            background: `${color}14`, display: 'flex',
          }} />

          {/* Top accent bar */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0,
            height: 5, background: `linear-gradient(90deg, ${color}, ${color}55)`,
            display: 'flex',
          }} />

          {/* Brand top-right */}
          <div style={{
            position: 'absolute', top: 32, right: 40,
            display: 'flex', flexDirection: 'column', alignItems: 'flex-end',
          }}>
            <div style={{ display: 'flex', fontSize: 26, fontWeight: 900, color: 'white', letterSpacing: '-0.5px' }}>
              <span>Split</span>
              <span style={{ color: '#60a5fa' }}>Vote</span>
            </div>
            <div style={{ display: 'flex', fontSize: 13, color: 'rgba(255,255,255,0.32)', marginTop: 2, letterSpacing: '0.06em' }}>
              {isIT ? 'PERSONALITÀ MORALE' : 'MORAL PERSONALITY'}
            </div>
          </div>

          {/* LEFT — emoji + sign label */}
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            width: 460, height: '100%',
            paddingLeft: 60,
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 280, height: 280, borderRadius: '50%',
              background: `${color}1a`,
              border: `1.5px solid ${color}45`,
              marginBottom: 22,
            }}>
              <div style={{ display: 'flex', fontSize: 150, lineHeight: 1 }}>
                {archetype.signEmoji}
              </div>
            </div>
            <div style={{
              display: 'flex',
              fontSize: 14, fontWeight: 700,
              color: 'rgba(255,255,255,0.45)',
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
            }}>
              {signLabel}
            </div>
          </div>

          {/* RIGHT — name + tagline + traits + cta */}
          <div style={{
            display: 'flex', flexDirection: 'column', justifyContent: 'center',
            flex: 1, paddingRight: 60, paddingLeft: 30,
          }}>
            {/* Archetype name */}
            <div style={{
              display: 'flex',
              fontSize: 78, fontWeight: 900,
              color, letterSpacing: '-2px',
              lineHeight: 1.0,
              marginBottom: 18,
            }}>
              {name}
            </div>

            {/* Tagline */}
            <div style={{
              display: 'flex',
              fontSize: 24, fontWeight: 600,
              color: 'rgba(255,255,255,0.6)',
              fontStyle: 'italic',
              maxWidth: 580,
              marginBottom: 28,
              lineHeight: 1.32,
            }}>
              &ldquo;{tagline}&rdquo;
            </div>

            {/* Traits */}
            <div style={{ display: 'flex', flexDirection: 'row', gap: 10, flexWrap: 'wrap', marginBottom: 32, maxWidth: 580 }}>
              {traits.slice(0, 4).map((trait) => (
                <div key={trait} style={{
                  display: 'flex',
                  fontSize: 16, fontWeight: 700,
                  color,
                  background: `${color}18`,
                  border: `1px solid ${color}40`,
                  borderRadius: 10,
                  padding: '7px 16px',
                }}>
                  {trait}
                </div>
              ))}
            </div>

            {/* CTA pill */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 12,
              padding: '10px 16px',
              alignSelf: 'flex-start',
            }}>
              <div style={{ display: 'flex', fontSize: 15, fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>
                {isIT ? 'Scopri il tuo archetipo →' : 'Find your archetype →'}
              </div>
              <div style={{ display: 'flex', fontSize: 14, fontWeight: 800, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.02em' }}>
                {urlLabel}
              </div>
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
        headers: {
          'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
        },
      },
    )
  }

  // ───────────────── VERTICAL STORY (1080×1920) ─────────────────
  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          width: '100%',
          height: '100%',
          background: 'linear-gradient(160deg, #07071a 0%, #0d0d2e 60%, #080820 100%)',
          fontFamily: '"system-ui", sans-serif',
          position: 'relative',
        }}
      >
        {/* Colored orb top-left */}
        <div style={{
          position: 'absolute', top: -60, left: -100,
          width: 520, height: 520, borderRadius: '50%',
          background: `${color}18`, display: 'flex',
        }} />
        {/* Colored orb bottom-right */}
        <div style={{
          position: 'absolute', bottom: 60, right: -80,
          width: 420, height: 420, borderRadius: '50%',
          background: `${color}12`, display: 'flex',
        }} />

        {/* ── Logo ── */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 100 }}>
          <div style={{ display: 'flex', fontSize: 54, fontWeight: 900, color: 'white', letterSpacing: '-1px' }}>
            <span>Split</span>
            <span style={{ color: '#60a5fa' }}>Vote</span>
          </div>
          <div style={{ display: 'flex', fontSize: 26, color: 'rgba(255,255,255,0.35)', marginTop: 8 }}>
            {isIT ? 'Personalità Morale' : 'Moral Personality'}
          </div>
        </div>

        {/* Divider */}
        <div style={{ width: 720, height: 1, background: 'rgba(255,255,255,0.08)', margin: '32px 0' }} />

        {/* ── Emoji ── */}
        <div style={{ display: 'flex', fontSize: 164, lineHeight: 1, marginBottom: 20 }}>
          {archetype.signEmoji}
        </div>

        {/* Sign label */}
        <div style={{
          display: 'flex',
          fontSize: 26, fontWeight: 700,
          color: 'rgba(255,255,255,0.35)',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          marginBottom: 16,
        }}>
          {signLabel}
        </div>

        {/* Archetype name */}
        <div style={{
          display: 'flex',
          fontSize: 96, fontWeight: 900,
          color, letterSpacing: '-2px',
          textAlign: 'center',
          lineHeight: 1.05,
          maxWidth: 900,
          justifyContent: 'center',
          marginBottom: 20,
        }}>
          {name}
        </div>

        {/* Tagline */}
        <div style={{
          display: 'flex',
          fontSize: 38, fontWeight: 600,
          color: 'rgba(255,255,255,0.55)',
          fontStyle: 'italic',
          textAlign: 'center',
          maxWidth: 760,
          justifyContent: 'center',
          marginBottom: 48,
          lineHeight: 1.3,
        }}>
          &ldquo;{tagline}&rdquo;
        </div>

        {/* ── Traits ── */}
        <div style={{ display: 'flex', flexDirection: 'row', gap: 16, flexWrap: 'wrap', justifyContent: 'center', maxWidth: 800, marginBottom: 64 }}>
          {traits.slice(0, 4).map((trait) => (
            <div key={trait} style={{
              display: 'flex',
              fontSize: 28, fontWeight: 700,
              color,
              background: `${color}15`,
              border: `1px solid ${color}40`,
              borderRadius: 16,
              padding: '10px 28px',
            }}>
              {trait}
            </div>
          ))}
        </div>

        {/* Spacer */}
        <div style={{ display: 'flex', flexGrow: 1 }} />

        {/* ── Bottom section ── */}
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          width: 760,
          background: `${color}0d`,
          border: `1px solid ${color}2a`,
          borderRadius: 28,
          padding: '32px 40px',
          marginBottom: 36,
          gap: 12,
        }}>
          <div style={{ display: 'flex', fontSize: 30, fontWeight: 700, color: 'rgba(255,255,255,0.75)', textAlign: 'center', justifyContent: 'center' }}>
            {basedOn}
          </div>
          <div style={{ display: 'flex', fontSize: 22, color: 'rgba(255,255,255,0.28)', textAlign: 'center', justifyContent: 'center' }}>
            {disclaimer}
          </div>
        </div>

        {/* URL */}
        <div style={{ display: 'flex', fontSize: 30, fontWeight: 700, color: 'rgba(255,255,255,0.25)', marginBottom: 60, letterSpacing: '0.02em' }}>
          {urlLabel}
        </div>
      </div>
    ),
    {
      width: 1080,
      height: 1920,
      headers: {
        'Cache-Control': 'public, max-age=300, stale-while-revalidate=600',
        'Content-Disposition': `inline; filename="splitvote-personality-${archetypeId}.png"`,
      },
    },
  )
}
