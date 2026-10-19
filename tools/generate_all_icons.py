#!/usr/bin/env python3
"""
Generate all icon assets (PNGs at all standard resolutions, SVG vector files, and ICO packages)
for Zotero PaperFlow based on the brand icon geometry and colors.
"""

import os
import shutil
from PIL import Image, ImageDraw

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ORIG_ICON_PATH = r"C:\Users\gro_e\.gemini\antigravity\brain\8be00d24-b9c7-4fd0-9487-3b3945f3a2ea\.user_uploaded\media_1792396936288_3f3efe77.png"

ICONS_DIRS = [
    os.path.join(ROOT_DIR, "chrome", "content", "icons"),
    os.path.join(ROOT_DIR, "chrome", "content", "assets", "icons"),
]

SVG_TEMPLATE = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="128" height="128" fill="none" role="img" aria-labelledby="title desc">
  <title id="title">Zotero PaperFlow</title>
  <desc id="desc">Three progress pillars symbolizing manuscript drafting, submission review, and publication acceptance.</desc>
  <!-- Left Pill (Stage 1: Manuscript) -->
  <rect x="19" y="39" width="24" height="56" rx="12" fill="#06b6d4" fill-opacity="0.45"/>
  <circle cx="31" cy="55" r="6" fill="#06b6d4"/>

  <!-- Middle Pill (Stage 2: Review) -->
  <rect x="51" y="27" width="24" height="68" rx="12" fill="#6366f1" fill-opacity="0.80"/>
  <circle cx="63" cy="47" r="6" fill="#ffffff"/>

  <!-- Right Pill (Stage 3: Publication) -->
  <rect x="83" y="15" width="24" height="80" rx="12" fill="#e11d48"/>
  <circle cx="95" cy="35" r="8" fill="#f59e0b"/>
</svg>
"""

def generate():
    for d in ICONS_DIRS:
        os.makedirs(d, exist_ok=True)

    print("1. Writing SVG files...")
    # Write SVG files
    for d in ICONS_DIRS:
        svg_path = os.path.join(d, "icon.svg")
        with open(svg_path, "w", encoding="utf-8") as f:
            f.write(SVG_TEMPLATE)
        print(f"   Written: {svg_path}")

    # Also write chrome/content/icons/researchflow.svg (used by Zotero chrome UI)
    rf_svg = os.path.join(ROOT_DIR, "chrome", "content", "icons", "researchflow.svg")
    with open(rf_svg, "w", encoding="utf-8") as f:
        f.write(SVG_TEMPLATE)
    print(f"   Written: {rf_svg}")

    print("2. Rendering ultra-high-resolution master image (4096 x 4096)...")
    S = 32
    W = 128 * S
    master = Image.new("RGBA", (W, W), (0, 0, 0, 0))
    draw = ImageDraw.Draw(master)

    # Left Pill
    draw.rounded_rectangle(
        [19 * S, 39 * S, 43 * S - 1, 95 * S - 1],
        radius=12 * S,
        fill=(6, 182, 212, int(round(0.45 * 255)))
    )
    draw.ellipse(
        [(31 - 6) * S, (55 - 6) * S, (31 + 6) * S - 1, (55 + 6) * S - 1],
        fill=(6, 182, 212, 255)
    )

    # Mid Pill
    draw.rounded_rectangle(
        [51 * S, 27 * S, 75 * S - 1, 95 * S - 1],
        radius=12 * S,
        fill=(99, 102, 241, int(round(0.80 * 255)))
    )
    draw.ellipse(
        [(63 - 6) * S, (47 - 6) * S, (63 + 6) * S - 1, (47 + 6) * S - 1],
        fill=(255, 255, 255, 255)
    )

    # Right Pill
    draw.rounded_rectangle(
        [83 * S, 15 * S, 107 * S - 1, 95 * S - 1],
        radius=12 * S,
        fill=(225, 29, 72, 255)
    )
    draw.ellipse(
        [(95 - 8) * S, (35 - 8) * S, (95 + 8) * S - 1, (35 + 8) * S - 1],
        fill=(245, 158, 11, 255)
    )

    sizes = [16, 20, 24, 32, 48, 64, 96, 128, 256, 512, 1024]
    rendered_images = {}

    print("3. Generating PNG icons at all resolutions...")
    for sz in sizes:
        if sz == 64 and os.path.exists(ORIG_ICON_PATH):
            # For 64x64, use original uploaded image directly to guarantee 100% pixel fidelity
            rendered_images[sz] = Image.open(ORIG_ICON_PATH).convert("RGBA")
        else:
            rendered_images[sz] = master.resize((sz, sz), Image.Resampling.LANCZOS)

        for d in ICONS_DIRS:
            out_file = os.path.join(d, f"icon-{sz}.png")
            rendered_images[sz].save(out_file, format="PNG", optimize=True)

    # Legacy / alias icon names
    for d in ICONS_DIRS:
        rendered_images[48].save(os.path.join(d, "icon48.png"), format="PNG", optimize=True)
        rendered_images[128].save(os.path.join(d, "icon128.png"), format="PNG", optimize=True)

    print("   All PNG sizes generated: 16, 20, 24, 32, 48, 64, 96, 128, 256, 512, 1024")

    print("4. Generating multi-resolution ICO files...")
    ico_sizes = [(16, 16), (24, 24), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)]
    ico_images = [rendered_images[s[0]] for s in ico_sizes]

    # chrome/content/icons/icon.ico
    icons_ico = os.path.join(ROOT_DIR, "chrome", "content", "icons", "icon.ico")
    ico_images[-1].save(icons_ico, format="ICO", sizes=ico_sizes)
    print(f"   Written: {icons_ico}")

    # chrome/content/assets/icons/favicon.ico
    favicon_ico = os.path.join(ROOT_DIR, "chrome", "content", "assets", "icons", "favicon.ico")
    ico_images[-1].save(favicon_ico, format="ICO", sizes=ico_sizes)
    print(f"   Written: {favicon_ico}")

    # chrome/content/assets/icons/icon.ico
    assets_ico = os.path.join(ROOT_DIR, "chrome", "content", "assets", "icons", "icon.ico")
    ico_images[-1].save(assets_ico, format="ICO", sizes=ico_sizes)
    print(f"   Written: {assets_ico}")

    print("Done! All icons generated successfully.")

if __name__ == "__main__":
    generate()
