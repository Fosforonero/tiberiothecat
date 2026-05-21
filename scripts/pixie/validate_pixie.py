#!/usr/bin/env python3
"""Validate Pixie work-tree assets against the canonical contract.

Reads from `pixie/work/` (default). Never modifies any asset. Writes a
promotion-readiness report to `reports/pixie/`.

Usage:
    python3 scripts/pixie/validate_pixie.py
    python3 scripts/pixie/validate_pixie.py --input pixie/final
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from dataclasses import dataclass, asdict
from datetime import date
from pathlib import Path

try:
    from PIL import Image
except ImportError:
    sys.stderr.write("ERROR: Pillow not available. Install with: pip install Pillow\n")
    sys.exit(2)


CANONICAL_SIZE = (256, 256)
RETINA_SIZE = (512, 512)
MAX_BYTES_256 = 300 * 1024
MAX_BYTES_512 = 900 * 1024
FILENAME_RE = re.compile(r"^pixie-([a-z0-9]+)-stage-([1-9]\d*)\.png$")
FORBIDDEN_OUTPUT_ROOTS = ("public/pixie", "pixie/original")


@dataclass
class Verdict:
    relpath: str
    passed: bool
    failures: list[str]


def assert_safe_output(path: Path) -> None:
    abs_path = path.resolve()
    for forbidden in FORBIDDEN_OUTPUT_ROOTS:
        forbidden_abs = Path(forbidden).resolve()
        try:
            abs_path.relative_to(forbidden_abs)
        except ValueError:
            continue
        raise SystemExit(f"REFUSING to write to forbidden path: {path}")


def validate_one(path: Path, root: Path) -> Verdict:
    rel = str(path.relative_to(root))
    failures: list[str] = []

    if path.suffix.lower() != ".png":
        failures.append(f"non_png_extension:{path.suffix.lower()}")

    match = FILENAME_RE.match(path.name)
    if not match:
        failures.append(f"filename_not_canonical:{path.name}")

    size_bytes = path.stat().st_size

    try:
        with Image.open(path) as im:
            im.load()
            width, height = im.size
            mode = im.mode
    except Exception as exc:  # noqa: BLE001
        failures.append(f"open_failed:{type(exc).__name__}:{exc}")
        return Verdict(relpath=rel, passed=False, failures=failures)

    if (width, height) == CANONICAL_SIZE:
        if size_bytes > MAX_BYTES_256:
            failures.append(f"oversize_256:{size_bytes}>{MAX_BYTES_256}")
    elif (width, height) == RETINA_SIZE:
        if size_bytes > MAX_BYTES_512:
            failures.append(f"oversize_512:{size_bytes}>{MAX_BYTES_512}")
    else:
        failures.append(f"non_canonical_size:{width}x{height}")

    if mode != "RGBA":
        failures.append(f"mode_not_rgba:{mode}")

    return Verdict(relpath=rel, passed=not failures, failures=failures)


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Validate Pixie work-tree assets.")
    parser.add_argument("--input", default="pixie/work", help="Asset root to validate.")
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

    verdicts: list[Verdict] = []
    for path in sorted(input_root.rglob("*")):
        if not path.is_file():
            continue
        if path.suffix.lower() not in {".png", ".webp"}:
            continue
        verdicts.append(validate_one(path, input_root))

    total = len(verdicts)
    passed = sum(1 for v in verdicts if v.passed)
    failed = total - passed
    promotion_ready = failed == 0 and total > 0
    verdict_label = "READY" if promotion_ready else ("BLOCKED" if total > 0 else "EMPTY")

    suffix = f"-{args.tag}" if args.tag else ""
    today = date.today().isoformat()
    md_path = reports_root / f"validate-{today}{suffix}.md"
    json_path = reports_root / f"validate-{today}{suffix}.json"

    lines: list[str] = [
        f"# Pixie Validate — {today}",
        "",
        f"**Input:** `{input_root}`",
        f"**Verdict:** `{verdict_label}`",
        f"**Total:** {total} — passed: {passed} — failed: {failed}",
        "",
    ]
    if failed:
        lines.append("## Failures")
        lines.append("")
        for v in verdicts:
            if not v.passed:
                lines.append(f"- `{v.relpath}` — {', '.join(v.failures)}")
        lines.append("")
    else:
        lines.append("## Failures")
        lines.append("")
        lines.append("None.")
        lines.append("")

    md_path.write_text("\n".join(lines), encoding="utf-8")
    json_path.write_text(
        json.dumps(
            {
                "date": today,
                "input": str(input_root),
                "verdict": verdict_label,
                "totals": {"total": total, "passed": passed, "failed": failed},
                "results": [asdict(v) for v in verdicts],
            },
            indent=2,
        ),
        encoding="utf-8",
    )
    print(f"validate summary: {md_path}")
    print(f"verdict: {verdict_label} ({passed}/{total} passed)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
