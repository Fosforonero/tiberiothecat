import { describe, it, expect } from 'vitest'
import { COMPANIONS, isSpeciesUnlocked } from '@/lib/companion'

// Mirrors PixieSelector.tsx filter logic exactly
function visibleAccessible(isAdmin: boolean, isPremium: boolean, votes: number, streak: number, ownedMarket: any[] = []) {
  const orderedSpecies = [
    ...COMPANIONS.filter(c => c.access === 'free'),
    ...COMPANIONS.filter(c => c.access === 'premium'),
    ...COMPANIONS.filter(c => c.access === 'market'),
    ...COMPANIONS.filter(c => c.access === 'admin'),
  ]
  const visible = orderedSpecies.filter(c => c.access !== 'admin' || isAdmin)
  const accessible = visible.filter(c =>
    isSpeciesUnlocked(c.id, votes, streak, isPremium, isAdmin, ownedMarket)
  )
  return { visible: visible.length, accessible: accessible.length, names: accessible.map(c => c.name) }
}

describe('PixieSelector visibility / access', () => {
  it('super_admin sees ALL 24 species (8 free + 7 premium + 6 market + 3 admin)', () => {
    const r = visibleAccessible(true, true, 0, 0, [])
    expect(r.visible).toBe(24)
    expect(r.accessible).toBe(24)
  })
  it('non-admin non-premium new user sees only free starters + premium locked + market locked', () => {
    const r = visibleAccessible(false, false, 0, 0, [])
    expect(r.visible).toBe(21)  // 24 - 3 admin
    expect(r.accessible).toBe(2)  // only spark + blip free starter
  })
  it('premium non-admin sees free starters + all premium + market locked', () => {
    const r = visibleAccessible(false, true, 0, 0, [])
    expect(r.visible).toBe(21)
    expect(r.accessible).toBe(2 + 7)  // starters + 7 premium
  })
  it('non-admin with 500+ votes sees all free + locked premium', () => {
    const r = visibleAccessible(false, false, 500, 30, [])
    expect(r.accessible).toBe(8)  // all 8 free unlocked
  })
})
