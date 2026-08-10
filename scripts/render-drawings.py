"""Turn the two drawing PDFs from the old site into sharp web previews.

The illustration plan is vector artwork, so it just needs a high-resolution
render. The cabin drawings are faded grayscale scans, so they get a levels and
sharpening pass to lift the linework off the paper.
"""

import io
import shutil
import urllib.request
from pathlib import Path

import pymupdf
from PIL import Image, ImageFilter, ImageOps

ROOT = Path(__file__).resolve().parent.parent
RAW = Path(__file__).parent / "pdf-raw"
DOCS_OUT = ROOT / "apps/web/public/dokumenter"
IMG_OUT = ROOT / "apps/web/public/images/tegninger"

MAX_EDGE = 2000

SOURCES = {
    "illustrasjonsplan": {
        "url": "https://www.strandhager.no/wp-content/uploads/2013/09/illplan26_011.pdf",
        "scan": False,
        # Photos and colour washes compress far better as WebP than as PNG.
        "format": "webp",
    },
    "hyttetegninger": {
        "url": "https://www.strandhager.no/wp-content/uploads/2013/09/strandhagerhytter.pdf",
        "scan": True,
        "format": "png",
    },
}


def download(name: str, url: str) -> Path:
    RAW.mkdir(exist_ok=True)
    dest = RAW / f"{name}.pdf"

    if not dest.exists():
        request = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(request, timeout=60) as response:
            dest.write_bytes(response.read())

    return dest


def native_zoom(page: pymupdf.Page, fallback: float) -> float:
    """Zoom that renders a scanned page at the resolution of its own bitmap."""
    images = page.get_images(full=True)
    if not images:
        return fallback

    width, height = images[0][2], images[0][3]
    longest_source = max(width, height)
    longest_page = max(page.rect.width, page.rect.height)
    return max(fallback, longest_source / longest_page)


def render(page: pymupdf.Page, zoom: float) -> Image.Image:
    pixmap = page.get_pixmap(matrix=pymupdf.Matrix(zoom, zoom), alpha=False)
    return Image.open(io.BytesIO(pixmap.tobytes("png"))).convert("RGB")


def clean_scan(img: Image.Image) -> Image.Image:
    """Whiten the paper, deepen the pencil lines, then re-sharpen."""
    gray = ImageOps.grayscale(img)
    gray = ImageOps.autocontrast(gray, cutoff=(0.5, 6.0))
    # Pull the midtones down so the linework reads as black rather than gray.
    gray = gray.point(lambda value: int(255 * (value / 255) ** 1.35))
    return gray.filter(ImageFilter.UnsharpMask(radius=1.6, percent=140, threshold=2))


def trim(img: Image.Image, padding: float = 0.015) -> Image.Image:
    """Crop the blank paper around a drawing, ignoring scanner dust."""
    probe = ImageOps.grayscale(img).reduce(8).filter(ImageFilter.MedianFilter(3))
    box = probe.point(lambda value: 255 if value < 235 else 0).getbbox()
    if not box:
        return img

    pad = round(max(img.size) * padding)
    left, top, right, bottom = (value * 8 for value in box)
    return img.crop(
        (
            max(0, left - pad),
            max(0, top - pad),
            min(img.width, right + pad),
            min(img.height, bottom + pad),
        )
    )


def fit(img: Image.Image) -> Image.Image:
    longest = max(img.size)
    if longest <= MAX_EDGE:
        return img

    scale = MAX_EDGE / longest
    size = (round(img.width * scale), round(img.height * scale))
    resized = img.resize(size, Image.LANCZOS)
    return resized.filter(ImageFilter.UnsharpMask(radius=1.0, percent=70, threshold=3))


def main() -> None:
    DOCS_OUT.mkdir(parents=True, exist_ok=True)
    IMG_OUT.mkdir(parents=True, exist_ok=True)

    for name, source in SOURCES.items():
        pdf = download(name, source["url"])
        shutil.copyfile(pdf, DOCS_OUT / f"{name}.pdf")

        doc = pymupdf.open(pdf)
        for index, page in enumerate(doc):
            is_scan = source["scan"]
            zoom = native_zoom(page, 3.0) if is_scan else 3.0
            img = render(page, zoom)

            if is_scan:
                img = clean_scan(img)

            img = fit(trim(img))

            suffix = "" if doc.page_count == 1 else f"-{index + 1}"
            extension = source["format"]
            dest = IMG_OUT / f"{name}{suffix}.{extension}"

            if extension == "webp":
                img.save(dest, "WEBP", quality=90, method=6)
            else:
                img.save(dest, "PNG", optimize=True)

            print(f"{dest.relative_to(ROOT)}  {img.width}x{img.height}  {dest.stat().st_size / 1024:.0f} kB")

        doc.close()


if __name__ == "__main__":
    main()
