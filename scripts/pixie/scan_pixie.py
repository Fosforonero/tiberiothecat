#!/usr/bin/env python3
"""Inventory the Pixie raw asset tree.

Read-only. Walks `pixie/original/` (default) and emits a markdown + JSON
audit report under `reports/pixie/`. Never modifies any asset.

Usage:
    python3 scripts/pixie/scan_pixie.py
    python3 scripts/pixie/scan_pixie.py --input pixie/original --reports reports/pixie
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from collections import defaultdict
from dataclasses import dataclass, asdict
from datetime import date
from pathlib import Path

try:
    from PIL import Image
except ImportError:
    sys.stderr.write("ERROR: Pillow not available. Install with: pip install Pillow\n")
    sys.exit(2)


CANONICAL_SIZE = (256, 256)
ACCEPTED_EXT = {".png", ".webp"}
FILENAME_RE = re.compile(r"^pixie-([a-z0-9]+)-stage-([1-9]\d*)\.(png|webp)$")

# Paths the script must NEVER write to. Defensive even though scan is read-only.
FORBIDDEN_OUTPUT_ROOTS = ("public/pixie", "pixie/original")


@dataclass
class AssetRecord:
    relpath: str
    species: str
    stage: int | None
    ext: str
    width: int
    height: int
    mode: str
    has_alpha: bool
    bytes: int
    naming_ok: bool
    notes: list[str]


def assert_safe_output(path: Path) -> None:
    abs_path = path.resolve()
    for forbidden in FORBIDDEN_OUTPUT_ROOTS:
        forbidden_abs = Path(forbidden).resolve()
        try:
            abs_path.relative_to(forbidden_abs)
        except ValueError:
            continue
        raise SystemExit(f"REFUSING to write to forbidden path: {path}")


def inspect_file(path: Path, root: Path) -> AssetRecord | None:
    if path.suffix.lower() not in ACCEPTED_EXT:
        return None
    rel = path.relative_to(root)
    notes: list[str] = []
    match = FILENAME_RE.match(path.name)
    species = match.group(1) if match else (rel.parts[0] if len(rel.parts) > 1 else "unknown")
    stage = int(match.group(2)) if match else None
    naming_ok = match is not None
    if not naming_ok:
        notes.append(f"non_canonical_filename:{path.name}")

    try:
        with Image.open(path) as im:
            width, height = im.size
            mode = im.mode
            has_alpha = "A" in mode or im.info.get("transparency") is not None
    except Exception as exc:  # noqa: BLE001 — surface any decode error
        notes.append(f"open_error:{type(exc).__name__}:{exc}")
        return AssetRecord(
            relpath=str(rel),
            species=species,
            stage=stage,
            ext=path.suffix.lower(),
            width=0,
            height=0,
            mode="?",
            has_alpha=False,
            bytes=path.stat().st_size,
            naming_ok=naming_ok,
            notes=notes,
        )

    if (width, height) != CANONICAL_SIZE and (width, height) != (CANONICAL_SIZE[0] * 2, CANONICAL_SIZE[1] * 2):
        notes.append(f"non_canonical_size:{width}x{height}")
    if not has_alpha:
        notes.append("no_alpha_channel")
    if mode not in ("RGBA", "LA", "P"):
        notes.append(f"unusual_mode:{mode}")

    return AssetRecord(
        relpath=str(rel),
        species=species,
        stage=stage,
        ext=path.suffix.lower(),
        width=width,
        height=height,
        mode=mode,
        has_alpha=has_alpha,
        bytes=path.stat().st_size,
        naming_ok=naming_ok,
        notes=notes,
    )


def render_markdown(records: list[AssetRecord], input_root: Path) -> str:
    by_species: dict[str, list[AssetRecord]] = defaultdict(list)
    for rec in records:
        by_species[rec.species].append(rec)

    lines: list[str] = []
    lines.append(f"# Pixie Audit — {date.today().isoformat()}")
    lines.append("")
    lines.append(f"**Input root:** `{input_root}`")
    lines.append(f"**Total assets:** {len(records)}")
    lines.append(f"**Species observed:** {len(by_species)}")
    lines.append("")
    lines.append("## Per-species summary")
    lines.append("")
    lines.append("| Species | Files | Stages observed | Naming drift | Notes |")
    lines.append("|---|---|---|---|---|")
    for species in sorted(by_species):
        recs = by_species[species]
        stages = sorted({r.stage for r in recs if r.stage is not None})
        drift = sum(1 for r in recs if not r.naming_ok)
        flagged = sum(1 for r in recs if r.notes)
        lines.append(
            f"| `{species}` | {len(recs)} | {', '.join(str(s) for s in stages) or '—'} | {drift} | {flagged} |"
        )
    lines.append("")

    flagged = [r for r in records if r.notes]
    if flagged:
        lines.append("## Flagged files")
        lines.append("")
        for rec in flagged:
            lines.append(f"- `{rec.relpath}` — {', '.join(rec.notes)}")
        lines.append("")
    else:
        lines.append("## Flagged files")
        lines.append("")
        lines.append("None.")
        lines.append("")

    return "\n".join(lines)


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Scan Pixie raw assets.")
    parser.add_argument("--input", default="pixie/original", help="Asset root to scan.")
    parser.add_argument("--reports", default="reports/pixie", help="Reports output directory.")
    parser.add_argument("--tag", default=None, help="Optional suffix on the report filename.")
    args = parser.parse_args(argv)

    input_root = Path(args.input).resolve()
    reports_root = Path(args.reports)
    assert_safe_output(reports_root)
    reports_root.mkdir(parents=True, exist_ok=True)

    if not input_root.exists():
        sys.stderr.write(f"NOTE: input root does not exist: {input_root}\n")
        return 0

    records: list[AssetRecord] = []
    for path in sorted(input_root.rglob("*")):
        if not path.is_file():
            continue
        rec = inspect_file(path, input_root)
        if rec is not None:
            records.append(rec)

    suffix = f"-{args.tag}" if args.tag else ""
    today = date.today().isoformat()
    md_path = reports_root / f"audit-{today}{suffix}.md"
    json_path = reports_root / f"audit-{today}{suffix}.json"

    md_path.write_text(render_markdown(records, input_root), encoding="utf-8")
    json_path.write_text(
        json.dumps({"date": today, "input": str(input_root), "records": [asdict(r) for r in records]}, indent=2),
        encoding="utf-8",
    )
    print(f"audit written: {md_path}")
    print(f"audit written: {json_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
