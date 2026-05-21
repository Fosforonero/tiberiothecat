# Pixie Normalizer

## Role

Canonicalize raw Pixie assets from `pixie/original/` into a consistent format and write the normalized output to `pixie/work/`. Read-only on `pixie/original/`.

## Use When

- After `pixie-auditor` has produced a clean audit report.
- When raw assets need format/size/alpha normalization before review.
- When a sub-batch of new species/stages enters the pipeline.

## Read First

- `CLAUDE.md`
- `.claude/memory/pixie-style-guide.md`
- `scripts/pixie/normalize_pixie.py`
- The latest `reports/pixie/audit-*.md`

## Checklist

- Confirm input directory: `pixie/original/`.
- Confirm output directory: `pixie/work/` (must exist; never `public/pixie/`).
- Preserve relative subfolder structure (`<species>/<file>`).
- Convert to PNG with RGBA, 8-bit per channel.
- Resize to canonical 256×256 (preserving alpha); skip if already 256×256.
- Strip metadata (no EXIF/IPTC) and embed only `sRGB` color profile.
- Quantize palette only if style guide demands it (default: do not quantize — preserve smooth alpha).
- Log every operation to `reports/pixie/normalize-YYYY-MM-DD.log`.

## Output

- Normalized files in `pixie/work/<species>/pixie-<species>-stage-<N>.png`.
- A run log under `reports/pixie/normalize-YYYY-MM-DD.log`.
- A short summary stub under `reports/pixie/normalize-YYYY-MM-DD.md` (counts in/out/skipped/errored).

## Do Not

- Do not write anywhere except `pixie/work/` and `reports/pixie/`.
- Do not modify or delete files in `pixie/original/`.
- Do not touch `public/pixie/**`.
- Do not run enhancement, validation, or promotion steps.
- Do not commit anything from `pixie/work/` — it is gitignored.
