import { describe, it, expect } from 'vitest'
import { getProfilePixieSrc, getEffectiveSpecies, getProgressionSpecies } from '@/lib/pixie'

describe('getProfilePixieSrc', () => {
  it('returns null when use_pixie_avatar is false', () => {
    expect(getProfilePixieSrc({
      use_pixie_avatar: false,
      companion_species: 'spark',
      pixie_xp: { spark: 100 },
      votes_count: 100,
    })).toBeNull()
  })

  it('returns null when use_pixie_avatar is null', () => {
    expect(getProfilePixieSrc({
      use_pixie_avatar: null,
      companion_species: 'spark',
    })).toBeNull()
  })

  it('returns null for null/undefined profile', () => {
    expect(getProfilePixieSrc(null)).toBeNull()
    expect(getProfilePixieSrc(undefined)).toBeNull()
  })

  it('returns stage-1 path for new opted-in user with no pixie_xp', () => {
    expect(getProfilePixieSrc({
      use_pixie_avatar: true,
      companion_species: 'spark',
      pixie_xp: {},
      votes_count: 0,
    })).toBe('/pixie/spark/pixie-spark-stage-1.png')
  })

  it('uses species-specific pixie_xp to derive stage', () => {
    // banana species at 100 votes → stage 4
    expect(getProfilePixieSrc({
      use_pixie_avatar: true,
      companion_species: 'banana',
      pixie_xp: { banana: 100, spark: 5 },
      votes_count: 999,
    })).toBe('/pixie/banana/pixie-banana-stage-4.png')
  })

  it('falls back to votes_count when pixie_xp is empty', () => {
    // 50 votes total → stage 3
    expect(getProfilePixieSrc({
      use_pixie_avatar: true,
      companion_species: 'caffe',
      pixie_xp: {},
      votes_count: 50,
    })).toBe('/pixie/caffe/pixie-caffe-stage-3.png')
  })

  it('defaults species to spark when companion_species is missing', () => {
    expect(getProfilePixieSrc({
      use_pixie_avatar: true,
      companion_species: null,
      pixie_xp: {},
      votes_count: 10,
    })).toBe('/pixie/spark/pixie-spark-stage-2.png')
  })

  it('ignoreToggle returns sprite even when use_pixie_avatar is false', () => {
    // Dashboard own-view path: user has not opted into public Pixie avatar,
    // but their private dashboard still shows the sprite.
    expect(getProfilePixieSrc(
      {
        use_pixie_avatar: false,
        companion_species: 'caffe',
        pixie_xp: { caffe: 50 },
        votes_count: 0,
      },
      { ignoreToggle: true },
    )).toBe('/pixie/caffe/pixie-caffe-stage-3.png')
  })

  it('ignoreToggle still returns null for null profile', () => {
    expect(getProfilePixieSrc(null, { ignoreToggle: true })).toBeNull()
  })

  it('renders the active skin sprite but derives stage from companion progression (B2)', () => {
    // User picked spark in onboarding, equipped Pixie Devil from the store, and
    // has accrued 10 votes on their permanent companion (spark).
    // B2: sprite = devil (cosmetic), stage = spark progression (10 votes → stage 2).
    expect(getProfilePixieSrc({
      use_pixie_avatar: true,
      companion_species: 'spark',
      pixie_xp: { active: 'pixie_devil', spark: 10 },
      votes_count: 0,
    })).toBe('/pixie/devil/pixie-devil-stage-2.png')
  })

  it('cosmetic skin key never drives the level — only companion_species does (B2)', () => {
    // Even if the skin's own key carries votes, the level comes from the
    // permanent companion. spark=0 → stage 1, despite devil=500.
    expect(getProfilePixieSrc({
      use_pixie_avatar: true,
      companion_species: 'spark',
      pixie_xp: { active: 'pixie_devil', devil: 500, spark: 0 },
      votes_count: 0,
    })).toBe('/pixie/devil/pixie-devil-stage-1.png')
  })

  it('falls back to companion_species when no pixie skin is active', () => {
    expect(getProfilePixieSrc({
      use_pixie_avatar: true,
      companion_species: 'banana',
      pixie_xp: { banana: 50 },
      votes_count: 0,
    })).toBe('/pixie/banana/pixie-banana-stage-3.png')
  })
})

describe('getProgressionSpecies', () => {
  it('ignores the active cosmetic skin and returns the permanent companion', () => {
    expect(getProgressionSpecies({
      companion_species: 'banana',
      // active skin must NOT affect progression species
    })).toBe('banana')
  })

  it('normalises legacy "nova" to scintille', () => {
    expect(getProgressionSpecies({ companion_species: 'nova' })).toBe('scintille')
  })

  it('defaults to spark when missing', () => {
    expect(getProgressionSpecies(null)).toBe('spark')
    expect(getProgressionSpecies({ companion_species: null })).toBe('spark')
  })
})

describe('getEffectiveSpecies', () => {
  it('returns active skin species when set', () => {
    expect(getEffectiveSpecies({
      companion_species: 'spark',
      pixie_xp: { active: 'pixie_devil' },
    })).toBe('devil')
  })

  it('falls back to companion_species when no active skin', () => {
    expect(getEffectiveSpecies({
      companion_species: 'banana',
      pixie_xp: {},
    })).toBe('banana')
  })

  it('defaults to spark when nothing is set', () => {
    expect(getEffectiveSpecies(null)).toBe('spark')
    expect(getEffectiveSpecies({ companion_species: null })).toBe('spark')
  })
})
