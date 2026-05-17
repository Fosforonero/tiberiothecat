import { describe, it, expect } from 'vitest'
import { NAME_COLORS as STORE_NAME_COLORS } from '@/lib/cosmetics-store'
import { getEquippedCosmetics, NAME_COLORS as RENDERER_NAME_COLORS } from '@/lib/cosmetics'

// These tests pin down the writer/renderer contract for cosmetics.
//
// Bug repro (16 May 2026): every name color slug the picker writes
// (white, blue, purple, green, gold, pink, red, gradient) must round-trip
// through getEquippedCosmetics() — i.e. the renderer must know each slug.
// Before the fix, only `gold` matched: the other 7 slugs were silently
// discarded because the renderer dictionary used a different set
// (aurora, fire, frost, rose, mint, violet, sky) that the picker never wrote.

describe('cosmetics catalog — writer/renderer slug alignment', () => {
  it('every name color slug the picker writes is renderable', () => {
    for (const { value: slug } of STORE_NAME_COLORS) {
      const resolved = getEquippedCosmetics({ name_color: slug })
      expect(resolved.nameColor, `slug "${slug}" must resolve to a NameColorDef`).not.toBeNull()
    }
  })

  it('renderer dictionary contains exactly the picker slug set', () => {
    const pickerSlugs   = new Set(STORE_NAME_COLORS.map((c) => c.value))
    const rendererSlugs = new Set(Object.keys(RENDERER_NAME_COLORS))
    expect(rendererSlugs).toEqual(pickerSlugs)
  })

  it('getEquippedCosmetics returns null cleanly for unknown slugs', () => {
    const resolved = getEquippedCosmetics({ name_color: 'nonsense-slug' })
    expect(resolved.nameColor).toBeNull()
  })

  it('returns null for all three cosmetics when profile is null', () => {
    const resolved = getEquippedCosmetics(null)
    expect(resolved).toEqual({ frame: null, glow: null, nameColor: null })
  })

  it('frame + glow slugs the picker writes are renderable', () => {
    const resolvedFrame = getEquippedCosmetics({ equipped_frame: 'frame_pulse' })
    expect(resolvedFrame.frame).not.toBeNull()
    expect(resolvedFrame.frame?.id).toBe('frame_pulse')

    const resolvedGlow = getEquippedCosmetics({ equipped_glow: 'glow_fire' })
    expect(resolvedGlow.glow).not.toBeNull()
    expect(resolvedGlow.glow?.id).toBe('glow_fire')
  })
})
