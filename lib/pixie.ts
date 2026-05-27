import { getCompanionStage, getSpeciesVotes, type CompanionSpecies, type PixieXpMap } from './companion'
import { PRODUCT_BY_ID, type ProductId } from './purchases'

/**
 * Legacy / display-name → canonical species folder name.
 *
 * Some surfaces accidentally received the product-marketing name ("nova")
 * instead of the asset folder name ("scintille"), or rely on the bare
 * product id slice. This map normalises those at the deepest sprite-URL
 * layer so every Pixie renderer (CosmeticAvatar, CompanionDisplay,
 * MobileStickyHUD, PixieSelector, ProductCard, PixieExplainerGallery,
 * PixieLevelUpModal, leaderboard avatars, /u/[id]) produces a working
 * `/pixie/<folder>/` URL without each call site needing its own guard.
 *
 * Add an entry whenever a marketing name diverges from the asset folder.
 */
const SPECIES_ALIAS: Record<string, CompanionSpecies> = {
  nova: 'scintille',
}

/** Normalise a species-ish string to the canonical asset folder name. */
export function normaliseSpecies(species: string): string {
  return SPECIES_ALIAS[species] ?? species
}

/** Returns the public URL for a Pixie stage image.
 *  Expected files: public/pixie/{species}/pixie-{species}-stage-{1-6}.png
 *  Falls back to emoji in CompanionDisplay if the file is missing (onError handler).
 *  Aliasing: a legacy "nova" species silently maps to the scintille sprite
 *  family so old profile rows with companion_species='nova' never produce
 *  a broken image. */
export function getPixieImagePath(species: string, stage: number): string {
  const canonical = normaliseSpecies(species)
  return `/pixie/${canonical}/pixie-${canonical}-stage-${stage}.png`
}

/**
 * Canonical Pixie product → species mapping.
 *
 * PIXIE_ITEMS / PRODUCT_CATALOG product ids ("pixie_nova") are NOT always
 * a simple slice of the species folder ("scintille"). The single source of
 * truth is `PRODUCT_BY_ID[id].unlocksSpecies`. Using slice() instead would
 * map pixie_nova → "nova", a folder that doesn't exist, producing broken
 * sprites for every Nova owner.
 *
 * Use this helper everywhere you need to translate a Pixie skin id into
 * the species folder name (sprite preview, active equip resolution, etc.).
 */
export function pixieItemToSpecies(itemId: string): CompanionSpecies {
  const def = PRODUCT_BY_ID[itemId as ProductId]
  if (def?.unlocksSpecies) return def.unlocksSpecies
  // Fallback for resilience: if the id is "pixie_<x>" and not in the
  // catalog yet, strip the prefix so dev/preview environments don't crash.
  if (itemId.startsWith('pixie_')) return itemId.slice('pixie_'.length) as CompanionSpecies
  return itemId as CompanionSpecies
}

/**
 * Resolves the Pixie sprite URL for a profile row, or null when the user
 * hasn't opted into Pixie avatar (use_pixie_avatar is false/null).
 *
 * Encapsulates the species + stage computation duplicated across dashboard,
 * /u/[id], and leaderboard surfaces. Stage is derived from species-specific
 * vote count when pixie_xp is populated, falling back to the global
 * votes_count for legacy profiles with no pixie_xp.
 *
 * Pass `ignoreToggle: true` to bypass the `use_pixie_avatar` gate. The
 * dashboard uses this — it's the user's own private view, so the Pixie
 * sprite always shows regardless of whether they want it as their PUBLIC
 * avatar on /u/[id] and leaderboards.
 */
export function getProfilePixieSrc(
  profile: {
    companion_species?: string | null
    use_pixie_avatar?: boolean | null
    pixie_xp?: Record<string, unknown> | null
    votes_count?: number | null
  } | null | undefined,
  options: { ignoreToggle?: boolean } = {},
): string | null {
  if (!profile) return null
  if (!options.ignoreToggle && !profile.use_pixie_avatar) return null

  // B2: Pixie skins are cosmetic only. The rendered sprite follows the
  // active skin (effective species), but the stage/level is derived from
  // the permanent companion's progression — never the cosmetic skin.
  const renderSpecies = getEffectiveSpecies(profile)
  const progressionSpecies = getProgressionSpecies(profile)
  const pixieXp = profile.pixie_xp ?? {}
  const hasPixieXp = Object.keys(pixieXp).length > 0
  const speciesVotes = hasPixieXp
    ? getSpeciesVotes(pixieXp as PixieXpMap, progressionSpecies)
    : 0
  const effectiveVotes = hasPixieXp ? speciesVotes : (profile.votes_count ?? 0)
  const stage = getCompanionStage(effectiveVotes)
  return getPixieImagePath(renderSpecies, stage)
}

/**
 * Resolve the species the user is "actively" inhabiting. When the user
 * has equipped a purchasable Pixie skin (pixie_xp.active = 'pixie_devil'),
 * the species is derived from the skin id (devil). Otherwise we fall back
 * to the permanent companion_species set during onboarding, or finally to
 * 'spark' (the default starter).
 *
 * Exported so dashboard surfaces (CompanionDisplay, picker preview) can
 * agree on the same species without re-implementing the precedence rule.
 */
export function getEffectiveSpecies(profile: {
  companion_species?: string | null
  pixie_xp?: Record<string, unknown> | null
} | null | undefined): CompanionSpecies {
  if (!profile) return 'spark'
  const active = typeof profile.pixie_xp?.active === 'string' ? profile.pixie_xp.active : null
  if (active?.startsWith('pixie_')) {
    return pixieItemToSpecies(active)
  }
  return getProgressionSpecies(profile)
}

/**
 * Resolve the species that owns the user's PROGRESSION (XP / level / stage).
 *
 * This is always the permanent `companion_species` set during onboarding —
 * NOT the cosmetic skin in `pixie_xp.active`. Under the B2 model, equipping a
 * market skin changes only the rendered sprite (getEffectiveSpecies); the
 * level a user has earned belongs to their permanent companion. Per-species
 * XP (`/api/pixie/xp`) is keyed on this same `companion_species`, so the
 * display reads the same key the XP writer increments.
 */
export function getProgressionSpecies(profile: {
  companion_species?: string | null
} | null | undefined): CompanionSpecies {
  if (!profile) return 'spark'
  const raw = (profile.companion_species as string | null) ?? 'spark'
  // Defensive: legacy rows may carry "nova" instead of "scintille".
  return (SPECIES_ALIAS[raw] ?? raw) as CompanionSpecies
}
