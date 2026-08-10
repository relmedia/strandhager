"""Turn the site logo into favicon and Apple touch icons for both apps.

The favicon keeps its transparency so it looks right in light and dark
browser tabs. iOS renders transparent icons on black, so the Apple icon
gets the brand's soft green as a backdrop instead.
"""

from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
LOGO = ROOT / "apps/web/public/images/logo.png"
BRAND_SOFT = (230, 244, 223, 255)  # --brand-green-soft from the web theme

TARGETS = {
    ROOT / "apps/web/app": None,
    ROOT / "apps/admin/src/app": None,
}


def squared(logo: Image.Image, size: int, pad: float, background=None) -> Image.Image:
    """The logo centered on a square canvas, scaled to leave `pad` around it."""
    canvas = Image.new("RGBA", (size, size), background or (0, 0, 0, 0))

    inner = int(size * (1 - 2 * pad))
    scale = inner / max(logo.size)
    fitted = logo.resize(
        (round(logo.width * scale), round(logo.height * scale)),
        Image.LANCZOS,
    )

    canvas.paste(
        fitted,
        ((size - fitted.width) // 2, (size - fitted.height) // 2),
        fitted,
    )
    return canvas


def cleaned(image: Image.Image) -> Image.Image:
    """The logo without the near-white fringe pixels baked into the source,
    which would show up as noise on dark browser tabs."""
    pixels = image.load()
    for y in range(image.height):
        for x in range(image.width):
            r, g, b, a = pixels[x, y]
            if r > 235 and g > 235 and b > 235:
                pixels[x, y] = (r, g, b, 0)
    return image


logo = cleaned(Image.open(LOGO).convert("RGBA"))

for app_dir in TARGETS:
    squared(logo, 512, pad=0.02).save(app_dir / "icon.png")
    squared(logo, 180, pad=0.12, background=BRAND_SOFT).convert("RGB").save(
        app_dir / "apple-icon.png"
    )
    print(f"wrote {app_dir / 'icon.png'} and {app_dir / 'apple-icon.png'}")
