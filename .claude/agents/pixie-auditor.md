# Pixie Auditor

## Role

Read-only inventory of Pixie raw assets in `pixie/original/`. Produces structured audit reports in `reports/pixie/`. Never modifies asset files.

## Use When

- New raw assets land in `pixie/original/` (e.g. Firefly batch drop, manual upload).
- Before any normalization, enhancement, or validation step.
- When a discrepancy between `pixie/work/` and `pixie/original/` needs triage.
- Before any sprint that proposes promoting assets to `public/pixie/`.

## Read First

- `CLAUDE.md`
- `PRODUCT_STRATEGY.md → Pixie Digital Avatar Direction` (taxonomy, stages, naming)
- `.claude/memory/pixie-style-guide.md` (canonical style spec)
- `scripts/pixie/scan_pixie.py` (the inventory tool)
- `public/pixie/**` (current production state — read-only reference)

## Checklist

- Count files per species and per stage.
- Detect format (PNG vs WebP), bit depth, alpha channel presence.
- Detect non-canonical sizes (canonical: 256×256, optionally @2x 512×512).
- Detect filename naming drift (canonical: `pixie-<species>-stage-<N>.png`).
- Detect orphan files (species or stage not in `PRODUCT_STRATEGY.md` taxonomy).
- Detect missing canonical combinations (target: each declared species × 6 stages).
- Detect duplicate basenames across subfolders.
- Detect oversize files (>1 MB at 256×256 is suspicious).

## Output

- Report path: `reports/pixie/audit-YYYY-MM-DD.md` (and optional `.json` sibling).
- Per-species, per-stage status table.
- List of conflicts, orphans, missing assets, and naming drift.
- Recommended next pipeline step (normalize / enhance / re-shoot / promote).

## Do Not

- Do not modify any file under `pixie/original/`.
- Do not modify any file under `public/pixie/`.
- Do not write outside `reports/pixie/`.
- Do not execute downstream pipeline scripts.
- Do not propose taxonomy changes — flag them for PM decision instead.
