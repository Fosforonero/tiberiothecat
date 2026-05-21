#!/usr/bin/env python3
"""Compose a contact-sheet PNG of all Pixie assets under the input tree.

Reads from `pixie/work/` (default). Writes a single review-sheet PNG to
`reports/pixie/`. Never modifies any asset.

Usage:
    python3 scripts/pixie/generate_review_sheet.py
    python3 scripts/pixie/generate_review_sheet.py --input pixie/final --tile 128
"""

from __future__ import annotations

import argparse
import math
import sys
from datetime import date
from pathlib import Path

try:
    from PIL import Image, ImageDraw, ImageFont
except ImportError:
    sys.stderr.write("ERROR: Pillow not available. Install with: pip install Pillow\n")
    sys.exit(2)


FORBIDDEN_OUTPUT_ROOTS = ("public/pixie", "pixie/original")
DEFAULT_TILE = 128
LABEL_HEIGHT = 18
BG_COLOR = (16, 18, 28, 255)        # dark theme backdrop
GRID_COLOR = (40, 44, 64, 255)
LABEL_COLOR = (215, 220, 240, 255)


def assert_safe_output(path: Path) -> None:
    abs_path = path.resolve()
    for forbidden in FORBIDDEN_OUTPUT_ROOTS:
        forbidden_abs = Path(forbidden).resolve()
        try:
            abs_path.relative_to(forbidden_abs)
        except ValueError:
            continue
        raise SystemExit(f"REFUSING to write to forbidden path: {path}")


def load_font() -> ImageFont.ImageFont:
    try:
        return ImageFont.truetype("Arial.ttf", 10)
    except Exception:  # noqa: BLE001
        return ImageFont.load_default()


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Generate a Pixie review contact sheet.")
    parser.add_argument("--input", default="pixie/work", help="Asset root to tile.")
    parser.add_argument("--reports", default="reports/pixie", help="Reports output directory.")
    parser.add_argument("--tile", type=int, default=DEFAULT_TILE, help="Per-asset tile size in px.")
    parser.add_argument("--cols", type=int, default=0, help="Force a column count (0 = auto).")
    parser.add_argument("--tag", default=None, help="Optional suffix on the output filename.")
    args = parser.parse_args(argv)

    input_root = Path(args.input).resolve()
    reports_root = Path(args.reports)
    assert_safe_output(reports_root)
    reports_root.mkdir(parents=True, exist_ok=True)

    if not input_root.exists():
        sys.stderr.write(f"NOTE: input root does not exist: {input_root}\n")
        return 0

    images: list[tuple[str, Path]] = []
    for path in sorted(input_root.rglob("*")):
        if not path.is_file():
            continue
        if path.suffix.lower() not in {".png", ".webp"}:
            continue
        images.append((str(path.relative_to(input_root)), path))

    if not images:
        sys.stderr.write(f"NOTE: no assets found under {input_root}\n")
        return 0

    tile = max(32, args.tile)
    cell_h = tile + LABEL_HEIGHT
    cols = args.cols if args.cols > 0 else max(1, min(12, int(math.sqrt(len(images)))))
    rows = math.ceil(len(images) / cols)
    sheet_w = cols * tile
    sheet_h = rows * cell_h

    sheet = Image.new("RGBA", (sheet_w, sheet_h), BG_COLOR)
    draw = ImageDraw.Draw(sheet)
    font = load_font()

    for idx, (label, path) in enumerate(images):
        row, col = divmod(idx, cols)
        x = col * tile
        y = row * cell_h
        # Grid divider
        draw.rectangle((x, y, x + tile - 1, y + cell_h - 1), outline=GRID_COLOR)
        try:
            with Image.open(path) as im:
                im_rgba = im.convert("RGBA")
                im_rgba.thumbnail((tile - 4, tile - 4), Image.Resampling.LANCZOS)
                paste_x = x + (tile - im_rgba.width) // 2
                paste_y = y + (tile - im_rgba.height) // 2
                sheet.paste(im_rgba, (paste_x, paste_y), im_rgba)
        except Exception as exc:  # noqa: BLE001
            draw.text((x + 4, y + 4), f"ERR: {type(exc).__name__}", fill=LABEL_COLOR, font=font)
        draw.text((x + 2, y + tile + 2), label[-32:], fill=LABEL_COLOR, font=font)

    suffix = f"-{args.tag}" if args.tag else ""
    today = date.today().isoformat()
    out_path = reports_root / f"review-sheet-{today}{suffix}.png"
    assert_safe_output(out_path)
    sheet.save(out_path, format="PNG", optimize=True)
    print(f"review sheet: {out_path} ({sheet_w}x{sheet_h}, {len(images)} tiles)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
