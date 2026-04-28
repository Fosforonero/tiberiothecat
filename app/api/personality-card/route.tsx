import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'
import { ARCHETYPES } from '@/lib/personality'

export const runtime = 'edge'

const VALID_IDS = new Set(['guardian', 'rebel', 'oracle', 'diplomat', 'strategist', 'empath'])

const ARCHETYPE_HEX: Record<string, string> = {
  guardian:   '#3b82f6',
  rebel:      '#ef4444',
  oracle:     '#06b6d4',
  diplomat:   '#eab308',
  strategist: '#a855f7',
  empath:     '#22c55e',
}

/**
 * GET /api/personality-card?archetype=guardian&locale=en|it
 * Returns a 1080×1920 PNG personality share card.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const rawId  = searchParams.get('archetype') ?? 'diplomat'
  const locale = searchParams.get('locale') === 'it' ? 'it' : 'en'
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
