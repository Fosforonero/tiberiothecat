#!/usr/bin/env python3
"""Normalize Pixie raw assets into the canonical 256x256 RGBA PNG form.

Reads from `pixie/original/` (default), writes to `pixie/work/` (default).
Never modifies `pixie/original/` and never writes to `public/pixie/`.

Usage:
    python3 scripts/pixie/normalize_pixie.py
    python3 scripts/pixie/normalize_pixie.py --input pixie/original --output pixie/work
    python3 scripts/pixie/normalize_pixie.py --dry-run
"""

from __future__ import annotations

import argparse
import sys
from dataclasses import dataclass
from datetime import date, datetime
from pathlib import Path

try:
    from PIL import Image
except ImportError:
    sys.stderr.write("ERROR: Pillow not available. Install with: pip install Pillow\n")
    sys.exit(2)


CANONICAL_SIZE = (256, 256)
ACCEPTED_EXT = {".png", ".webp"}
FORBIDDEN_OUTPUT_ROOTS = ("public/pixie", "pixie/original")


@dataclass
class OpResult:
    relpath: str
    action: str  # 'wrote', 'skipped', 'error'
    detail: str


def assert_safe_output(path: Path) -> None:
    abs_path = path.resolve()
    for forbidden in FORBIDDEN_OUTPUT_ROOTS:
        forbidden_abs = Path(forbidden).resolve()
        try:
            abs_path.relative_to(forbidden_abs)
        except ValueError:
            continue
        raise SystemExit(f"REFUSING to write to forbidden path: {path}")


def normalize_one(src: Path, dst: Path, dry_run: bool) -> OpResult:
    rel = str(src)
    try:
        with Image.open(src) as im:
            im.load()
            mode_in = im.mode
            size_in = im.size
            converted = im.convert("RGBA") if im.mode != "RGBA" else im.copy()
            if converted.size != CANONICAL_SIZE:
                converted = converted.resize(CANONICAL_SIZE, Image.Resampling.LANCZOS)
            if dry_run:
                return OpResult(rel, "skipped", f"dry_run mode_in={mode_in} size_in={size_in[0]}x{size_in[1]}")
            dst.parent.mkdir(parents=True, exist_ok=True)
            # Strip metadata by writing through a fresh image; no pnginfo passed.
            converted.save(dst, format="PNG", optimize=True)
        return OpResult(rel, "wrote", f"-> {dst}")
    except Exception as exc:  # noqa: BLE001
        return OpResult(rel, "error", f"{type(exc).__name__}: {exc}")


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Normalize Pixie raw assets to canonical PNG.")
    parser.add_argument("--input", default="pixie/original", help="Read-only input root.")
    parser.add_argument("--output", default="pixie/work", help="Output root (must not be public/pixie or pixie/original).")
    parser.add_argument("--reports", default="reports/pixie", help="Reports output directory.")
    parser.add_argument("--dry-run", action="store_true", help="Inspect only; do not write any output file.")
    args = parser.parse_args(argv)

    input_root = Path(args.input).resolve()
    output_root = Path(args.output)
    reports_root = Path(args.reports)
    assert_safe_output(output_root)
    assert_safe_output(reports_root)

    if not input_root.exists():
        sys.stderr.write(f"NOTE: input root does not exist: {input_root}\n")
        return 0

    output_root.mkdir(parents=True, exist_ok=True)
    reports_root.mkdir(parents=True, exist_ok=True)

    today = date.today().isoformat()
    log_path = reports_root / f"normalize-{today}.log"
    summary_path = reports_root / f"normalize-{today}.md"

    results: list[OpResult] = []
    started = datetime.now().isoformat(timespec="seconds")
    with log_path.open("a", encoding="utf-8") as logf:
        logf.write(f"# run started {started} dry_run={args.dry_run}\n")
        for src in sorted(input_root.rglob("*")):
            if not src.is_file():
                continue
            if src.suffix.lower() not in ACCEPTED_EXT:
                continue
            rel = src.relative_to(input_root)
            # Force output extension to .png regardless of input extension.
            dst = output_root / rel.with_suffix(".png")
            assert_safe_output(dst)
            result = normalize_one(src, dst, args.dry_run)
            logf.write(f"{result.action}\t{result.relpath}\t{result.detail}\n")
            results.append(result)

    wrote = sum(1 for r in results if r.action == "wrote")
    skipped = sum(1 for r in results if r.action == "skipped")
    errored = sum(1 for r in results if r.action == "error")
    summary_lines = [
        f"# Pixie Normalize — {today}",
        "",
        f"**Input:** `{input_root}`",
        f"**Output:** `{output_root}`",
        f"**Dry run:** {args.dry_run}",
        "",
        f"- wrote: {wrote}",
        f"- skipped: {skipped}",
        f"- errored: {errored}",
        "",
        f"Detailed log: `{log_path}`",
        "",
    ]
    if errored:
        summary_lines.append("## Errors")
        summary_lines.append("")
        for r in results:
            if r.action == "error":
                summary_lines.append(f"- `{r.relpath}` — {r.detail}")
        summary_lines.append("")

    summary_path.write_text("\n".join(summary_lines), encoding="utf-8")
    print(f"normalize summary: {summary_path}")
    print(f"normalize log:     {log_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
