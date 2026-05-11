"""
fix-white-bg-pixies.py
Removes near-white backgrounds from angel / devil / void Pixie PNGs
and composites them onto the same dark background used by all other species
(#090914 ≈ the dark navy present in spark, heart, crown, etc.).

Strategy:
  1. Convert to RGBA
  2. Flood-fill from all 4 corners (tolerance 18/255) → makes bg transparent
  3. Composite the transparent PNG onto a solid dark canvas
  4. Save as RGB PNG (no alpha needed after compositing)

Angel has a mostly-white body: we use a tighter tolerance (12) so the
flood-fill stops at the first gradient/edge pixel and doesn't eat into
the character.  A second flood-fill pass at the same tolerance is run
from the remaining three corners to catch any corner that's a slightly
different shade.
"""

import sys
from pathlib import Path
from PIL import Image, ImageDraw

DARK_BG = (9, 9, 20)          # #090914 — matches spark/heart/crown etc.
SPECIES  = ["angel", "devil", "void"]
STAGES   = range(1, 7)

# Tighter tolerance for angel (white body) to avoid eating the character
TOLERANCE: dict[str, int] = {
    "angel": 12,
    "devil": 20,
    "void":  20,
}

BASE = Path(__file__).parent.parent / "public" / "pixie"


def color_dist(a: tuple[int, ...], b: tuple[int, ...]) -> float:
    return sum((x - y) ** 2 for x, y in zip(a[:3], b[:3])) ** 0.5


def flood_fill_transparent(img_rgba: Image.Image, seed: tuple[int, int], tol: int) -> Image.Image:
    """Flood-fill from seed pixel, making matched pixels fully transparent."""
    img = img_rgba.copy()
    seed_color = img.getpixel(seed)[:3]
    w, h = img.size

    visited = [[False] * h for _ in range(w)]
    stack = [seed]

    while stack:
        x, y = stack.pop()
        if x < 0 or x >= w or y < 0 or y >= h:
            continue
        if visited[x][y]:
            continue
        visited[x][y] = True

        px = img.getpixel((x, y))
        if color_dist(px[:3], seed_color) > tol:
            continue

        img.putpixel((x, y), (0, 0, 0, 0))

        stack.extend([(x+1, y), (x-1, y), (x, y+1), (x, y-1)])

    return img


def process(species: str) -> None:
    tol = TOLERANCE[species]
    folder = BASE / species

    for stage in STAGES:
        path = folder / f"pixie-{species}-stage-{stage}.png"
        if not path.exists():
            print(f"  SKIP  {path.name} (not found)")
            continue

        img = Image.open(path).convert("RGBA")
        w, h = img.size

        # Flood-fill from all 4 corners
        corners = [(0, 0), (w-1, 0), (0, h-1), (w-1, h-1)]
        for corner in corners:
            img = flood_fill_transparent(img, corner, tol)

        # Composite onto dark canvas
        canvas = Image.new("RGBA", (w, h), (*DARK_BG, 255))
        canvas.paste(img, (0, 0), mask=img)

        # Save as RGB (no alpha needed)
        canvas.convert("RGB").save(path, "PNG", optimize=False)
        print(f"  OK    {path.name}")


def main() -> None:
    for species in SPECIES:
        print(f"\n── {species} ──")
        process(species)
    print("\nDone.")


if __name__ == "__main__":
    main()
