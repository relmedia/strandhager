"""Turn the site logo into favicon and Apple touch icons for both apps.

The favicon keeps its transparency so it looks right in light and dark
browser tabs. iOS renders transparent icons on black, so the Apple icon
gets the brand's soft green as a backdrop instead.
"""

from pathlib import Path

from PIL import Image, ImageDraw

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


def badged(logo: Image.Image, size: int, pad: float, background) -> Image.Image:
    """The logo on a rounded square so it reads clearly at tab size."""
    # Render large and downscale for smooth corners at 16-32px.
    big = size * 4
    canvas = squared(logo, big, pad)

    # The line art is too thin to survive 16px, so stamp it with small
    # offsets to fatten the strokes before scaling down.
    thick = Image.new("RGBA", (big, big), (0, 0, 0, 0))
    reach = max(1, big // 64)
    for dx in range(-reach, reach + 1):
        for dy in range(-reach, reach + 1):
            thick.alpha_composite(canvas, (dx + reach, dy + reach))

    plate = Image.new("RGBA", (big, big), (0, 0, 0, 0))
    ImageDraw.Draw(plate).rounded_rectangle(
        (0, 0, big - 1, big - 1), radius=big // 5, fill=background
    )
    plate.alpha_composite(thick, (-reach, -reach))
    return plate.resize((size, size), Image.LANCZOS)


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
    # Browsers ask for /favicon.ico first, so it must carry the logo too.
    # A soft green plate behind the logo keeps it visible on any tab theme.
    badged(logo, 64, pad=0.08, background=BRAND_SOFT).save(
        app_dir / "favicon.ico",
        sizes=[(16, 16), (32, 32), (48, 48), (64, 64)],
    )
    print(f"wrote icon.png, apple-icon.png and favicon.ico in {app_dir}")
