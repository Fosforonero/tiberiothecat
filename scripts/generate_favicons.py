#!/usr/bin/env python3
"""
generate_favicons.py — Generate all favicon/icon sizes from splitvote-icon.png
Source of truth: public/brand/splitvote-icon.png (original PNG, never reconstructed)

Output files (all in public/):
  favicon.ico              — multi-size ICO (16, 32, 48)
  favicon-16x16.png        — 16×16
  favicon-32x32.png        — 32×32
  apple-touch-icon.png     — 180×180 (iOS)
  android-chrome-192x192.png — 192×192 (Android/PWA)
  android-chrome-512x512.png — 512×512 (Android splash/PWA)
  site.webmanifest         — PWA manifest

Usage:
  pip install Pillow --break-system-packages
  python3 scripts/generate_favicons.py
  (run from project root)
"""

import json
import sys
from pathlib import Path

try:
    from PIL import Image
except ImportError:
    print("❌ Pillow not installed. Run: pip install Pillow --break-system-packages")
    sys.exit(1)

ROOT = Path(__file__).parent.parent
SRC = ROOT / "public" / "brand" / "splitvote_icon.png"
OUT = ROOT / "public"

if not SRC.exists():
    print(f"❌ Source not found: {SRC}")
    print("   Place the original splitvote-icon.png in public/brand/ first.")
    sys.exit(1)

img = Image.open(SRC).convert("RGBA")
print(f"✅ Loaded {SRC.name} ({img.width}×{img.height})")


def fit_square(source: Image.Image, size: int, padding_ratio: float = 0.08) -> Image.Image:
    """Resize without distortion, center on transparent square canvas."""
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    target = max(1, int(size * (1 - padding_ratio * 2)))
    fitted = source.copy()
    fitted.thumbnail((target, target), Image.LANCZOS)
    x = (size - fitted.width) // 2
    y = (size - fitted.height) // 2
    canvas.alpha_composite(fitted, (x, y))
    return canvas

SIZES = {
    "favicon-16x16.png":        (16, 16),
    "favicon-32x32.png":        (32, 32),
    "apple-touch-icon.png":     (180, 180),
    "android-chrome-192x192.png": (192, 192),
    "android-chrome-512x512.png": (512, 512),
}

for filename, size in SIZES.items():
    resized = fit_square(img, size[0])
    out_path = OUT / filename
    resized.save(out_path, "PNG", optimize=True)
    print(f"  ✅ {filename} ({size[0]}×{size[1]})")

# Multi-size ICO: 16, 32, 48
ico_path = OUT / "favicon.ico"
fit_square(img, 256).save(
    ico_path,
    format="ICO",
    sizes=[(16, 16), (32, 32), (48, 48), (256, 256)],
)
print(f"  ✅ favicon.ico (16, 32, 48, 256)")

# site.webmanifest
manifest = {
    "name": "SplitVote",
    "short_name": "SplitVote",
    "description": "Real-time global votes on impossible moral dilemmas. No right answers — just honest ones.",
    "start_url": "/",
    "scope": "/",
    "display": "standalone",
    "orientation": "any",
    "background_color": "#070718",
    "theme_color": "#070718",
    "lang": "en",
    "dir": "ltr",
    "categories": ["entertainment", "social", "games"],
    "icons": [
        {
            "src": "/android-chrome-192x192.png",
            "sizes": "192x192",
            "type": "image/png",
            "purpose": "any"
        },
        {
            "src": "/android-chrome-512x512.png",
            "sizes": "512x512",
            "type": "image/png",
            "purpose": "any"
        },
        {
            "src": "/android-chrome-512x512.png",
            "sizes": "512x512",
            "type": "image/png",
            "purpose": "maskable"
        }
    ],
    "shortcuts": [
        {
            "name": "Trending Dilemmas",
            "short_name": "Trending",
            "description": "See the most voted dilemmas right now",
            "url": "/trending",
            "icons": [{ "src": "/android-chrome-192x192.png", "sizes": "192x192" }]
        },
        {
            "name": "My Moral Profile",
            "short_name": "Profile",
            "description": "Discover your moral archetype",
            "url": "/personality",
            "icons": [{ "src": "/android-chrome-192x192.png", "sizes": "192x192" }]
        }
    ]
}
manifest_path = OUT / "site.webmanifest"
manifest_path.write_text(json.dumps(manifest, indent=2))
print(f"  ✅ site.webmanifest")

print()
print("Done. Now update app/layout.tsx metadata icons to reference new files.")
print("  icons: { icon: [")
print("    { url: '/favicon.ico' },")
print("    { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },")
print("    { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },")
print("    { url: '/android-chrome-192x192.png', sizes: '192x192', type: 'image/png' },")
print("  ], apple: [{ url: '/apple-touch-icon.png' }], shortcut: '/favicon.ico' }")
