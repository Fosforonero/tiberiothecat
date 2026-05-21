# Pixie Enhancer

## Role

Apply stage-appropriate visual enhancements (saturation lift, glow, subtle pulse aura per the style guide) to normalized assets in `pixie/work/`. Output stays in `pixie/work/` under a sibling enhanced subtree or with a stage-aware overlay.

## Use When

- After `pixie-normalizer` has produced a clean batch in `pixie/work/`.
- When stage progression visuals (stage 2 saturation lift, stage 3 light aura, stage 4 luminous outline, stage 5 special effect per `PRODUCT_STRATEGY.md`) need to be applied programmatically.
- For batch consistency across many species — manual per-asset polish should still be PM-reviewed.

## Read First

- `CLAUDE.md`
- `.claude/memory/pixie-style-guide.md` — palette, stage rules, do-not list
- `PRODUCT_STRATEGY.md → Pixie Digital Avatar Direction → Asset Direction`
- The latest `reports/pixie/normalize-*.md`

## Checklist

- Input: `pixie/work/<species>/pixie-<species>-stage-<N>.png` (must be 256×256 RGBA).
- Output: same path, or `pixie/work/enhanced/<species>/...` if running side-by-side.
- Apply per-stage transform from style guide; never invent new visual elements.
- Preserve original alpha mask — enhancements must not bleed into transparent regions.
- Cap any glow/aura at the bounding box of the original opaque silhouette + a small inset.
- Log every operation to `reports/pixie/enhance-YYYY-MM-DD.log`.

## Output

- Enhanced files in `pixie/work/...` (or `pixie/work/enhanced/...`).
- A run log + short summary stub under `reports/pixie/enhance-YYYY-MM-DD.{log,md}`.

## Do Not

- Do not introduce text, watermarks, or new accessories.
- Do not modify silhouettes — enhancements are additive overlay only.
- Do not alter style or palette beyond what the style guide allows.
- Do not write outside `pixie/work/` and `reports/pixie/`.
- Do not touch `pixie/original/` or `public/pixie/**`.
- Do not promote assets to `pixie/final/` or `public/pixie/`.
