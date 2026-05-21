# Pixie Style Guide (Canonical)

> Single source of truth for the Pixie pipeline (audit / normalize / enhance / review / validate).
> Source authority: `PRODUCT_STRATEGY.md → Pixie Digital Avatar Direction`.
> This file restates the asset contract in pipeline-actionable form. If this
> file and `PRODUCT_STRATEGY.md` diverge, `PRODUCT_STRATEGY.md` wins and this
> file must be updated.

## Identity

- **Name.** Pixie. Always capitalized. Never "famiglio", never "compagno" as primary label, never "companion" in IT surfaces.
- **System framing.** Pixie is the user's digital avatar — the visual projection of progression inside SplitVote. Not a pet, not decoration.
- **Tone.** Playful, characterful, slightly mythic; original pixel-art aesthetic.

## Asset Contract

| Property | Canonical value |
|---|---|
| Format | PNG with alpha channel (RGBA), 8-bit per channel |
| Master size | 256×256 |
| Optional @2x | 512×512 (retina) |
| Color profile | sRGB embedded; no other ICC profiles |
| Metadata | Stripped (no EXIF, no IPTC, no XMP) |
| Background | Fully transparent — alpha 0 outside the silhouette |
| Filename | `pixie-<species>-stage-<N>.png` (lowercase, hyphens, no spaces) |
| Path | `public/pixie/<species>/pixie-<species>-stage-<N>.png` (in production) |
| Max file size | ≤300 KB at 256×256; ≤900 KB at 512×512 |

## Stage Visual Progression

Per `PRODUCT_STRATEGY.md` Asset Direction. Stages map to vote count bands.

| Stage | Votes | Visual change |
|---|---|---|
| 1 | 0–9 | Base form, no accessories |
| 2 | 10–49 | Slightly more saturated color |
| 3 | 50–99 | Light aura or minimal accessory |
| 4 | 100–499 | Pronounced glow, luminous outline |
| 5 | 500+ | Special effect (particles, neon glitch, pulsing aura) |
| 6 | reserved | Legendary form (rare unlocks) |

Rules:

- Stage progression must read at both 256×256 (full dashboard) and 48×48 (compact dashboard / navbar).
- Silhouette must stay recognizable from stage 1 to stage 6 of the same species — no drastic shape changes.
- Glow / aura must not bleed beyond a small inset around the original opaque region.

## Palette

- Primary: SplitVote dark theme — blues, purples, yellow energy accents, neon highlights.
- Allowed accents per species: refer to `PRODUCT_STRATEGY.md` Pixie Variant Taxonomy (e.g. Leaf = soft green, Ember = warm red/orange, Hologram = sky-blue, Goldline = gold).
- Forbidden: pure white-on-white (low contrast on light-mode preview), low-saturation gray midtones (looks broken), anything tied to known IP/franchise palettes.

## Naming Discipline

- Species DB key (lowercase, no spaces, ASCII only): the canonical species identifier.
  - Examples in production: `angel`, `banana`, `caffe`, `devil`, `fuoco`, `hologram`, `ice`, `leaf`, `moonlight`, `scintille`, `triste`, `voidcore` (and others as taxonomy grows).
- Display name: as declared in `lib/companion.ts` (`Pixie <Species>`); do not invent new names in the pipeline.
- Files must use the species DB key, not the display name.

## Hard "Do Not" List

- No embedded text inside the artwork.
- No watermark, no signature, no generator branding.
- No accessory or pose that visibly resembles a known character / franchise.
- No semitransparent background pixels — alpha is binary at the edge (anti-aliasing edges may carry partial alpha, but flat-background pixels must be 0).
- No JPEG, no WebP-without-alpha, no GIF.
- No upscaling artifacts from generative models (banding, hatch noise) — re-shoot in source tool if seen.

## Pipeline Surfaces

- `pixie/original/` — raw drops from generation tool. Read-only after drop. Gitignored.
- `pixie/work/` — normalized + enhanced output. Gitignored.
- `pixie/final/` — approved batch staged for promotion. Gitignored.
- `pixie/firefly_import/` — staging area for Firefly batch imports. Gitignored.
- `public/pixie/<species>/` — production assets. Promoted only by explicit PM-authorized commit.

## Out of Scope for the Pipeline

- Stage 5 special-effect art direction (still a human design decision).
- Species taxonomy expansion (PM decision, not pipeline decision).
- Sprite sheet generation, OG card composition, store hero composition.
- Cosmetic / VIP overlay assets — handled separately when Phase 5 begins.
