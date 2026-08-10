"""Download the Parsellene photos from strandhager.no and export the sharpest
web-ready JPEGs the originals allow, plus a JSON manifest for the CMS.

Most of the 2013 uploads only exist as 240x160 thumbnails on the old site, so
they are upscaled once with Lanczos and lightly sharpened. Two photos exist at
full resolution and carry the section artwork.
"""

import io
import json
import re
import urllib.parse
import urllib.request
from pathlib import Path

from PIL import Image, ImageEnhance, ImageFilter, ImageOps

PAGE = "https://www.strandhager.no/?page_id=33"
# Full-resolution uploads of photos the Parsellene page only links as thumbnails.
EXTRA = [
    "https://www.strandhager.no/wp-content/uploads/2013/09/IMG_8903.jpg",
]
# Re-uploaded duplicates that the full-resolution files above supersede.
SUPERSEDED = {"IMG_89031.jpg"}

ROOT = Path(__file__).resolve().parents[1]
RAW = Path(__file__).resolve().parent / "parsellene-raw"
OUT = ROOT / "apps" / "web" / "public" / "images" / "parsellene"

RAW.mkdir(exist_ok=True)
OUT.mkdir(parents=True, exist_ok=True)

UA = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}
SIZE_SUFFIX = re.compile(r"-\d+x\d+(?=\.(?:jpe?g|png)$)", re.I)
GALLERY_PATH = re.compile(r"wp-content/uploads/2013/", re.I)

MAX_EDGE = 1920
UPSCALE_BELOW = 1000


def fetch(url: str) -> bytes:
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=60) as response:
        return response.read()


def collect_urls() -> list[str]:
    html = fetch(PAGE).decode("utf-8", "ignore")
    urls: list[str] = []
    seen: set[str] = set()

    for match in re.finditer(
        r"https?://[^\s\"'<>]+?wp-content/uploads/[^\s\"'<>]+?\.(?:jpe?g|png)", html, re.I
    ):
        url = SIZE_SUFFIX.sub("", match.group(0))
        name = urllib.parse.unquote(url.rsplit("/", 1)[-1])
        if not GALLERY_PATH.search(url) or name in SUPERSEDED or url in seen:
            continue
        seen.add(url)
        urls.append(url)

    return urls + [u for u in EXTRA if u not in seen]


def download() -> list[Path]:
    paths: list[Path] = []
    for url in collect_urls():
        dest = RAW / urllib.parse.unquote(url.rsplit("/", 1)[-1])
        if not dest.exists():
            try:
                dest.write_bytes(fetch(url))
            except Exception as error:  # noqa: BLE001
                print(f"  FAILED {dest.name}: {error}")
                continue
        paths.append(dest)
    return paths


def dhash(path: Path, size: int = 8) -> int:
    """Perceptual hash, used to drop duplicate uploads of the same photo."""
    with Image.open(path) as raw:
        img = raw.convert("L").resize((size + 1, size), Image.LANCZOS)
        px = list(img.getdata())
    bits = 0
    for row in range(size):
        for col in range(size):
            left = px[row * (size + 1) + col]
            right = px[row * (size + 1) + col + 1]
            bits = (bits << 1) | (left > right)
    return bits


def hamming(a: int, b: int) -> int:
    return bin(a ^ b).count("1")


def grade(img: Image.Image) -> Image.Image:
    """Lift the flat, overcast originals: gentle levels, colour and contrast."""
    img = ImageOps.autocontrast(img, cutoff=(0.4, 0.1), preserve_tone=True)
    img = ImageEnhance.Color(img).enhance(1.12)
    return ImageEnhance.Contrast(img).enhance(1.06)


def export(src: Path, dest: Path) -> tuple[int, int]:
    with Image.open(src) as raw:
        img = grade(raw.convert("RGB"))
        w, h = img.size
        edge = max(w, h)

        if edge > MAX_EDGE:
            scale = MAX_EDGE / edge
            img = img.resize((round(w * scale), round(h * scale)), Image.LANCZOS)
            img = img.filter(ImageFilter.UnsharpMask(radius=1.2, percent=65, threshold=2))
        elif edge < UPSCALE_BELOW:
            # Small originals: a single 2x Lanczos pass plus gentle sharpening
            # keeps edges defined without amplifying JPEG artefacts.
            img = img.resize((w * 2, h * 2), Image.LANCZOS)
            img = img.filter(ImageFilter.UnsharpMask(radius=1.6, percent=55, threshold=3))
        else:
            img = img.filter(ImageFilter.UnsharpMask(radius=1.0, percent=45, threshold=2))

        img.save(dest, "JPEG", quality=90, optimize=True, progressive=True)
        return img.size


def main() -> None:
    downloaded = download()
    print(f"Downloaded {len(downloaded)} images\n")

    kept: list[tuple[int, Path]] = []
    hashes: list[int] = []
    for path in sorted(downloaded):
        with Image.open(path) as img:
            edge = max(img.size)

        current = dhash(path)
        if any(hamming(current, seen) <= 6 for seen in hashes):
            print(f"  skipped {path.name}: duplicate")
            continue

        hashes.append(current)
        kept.append((edge, path))

    # Best resolution first, so the gallery and strip lead with the strongest photos.
    kept.sort(key=lambda item: (-item[0], item[1].name))

    entries = []
    for index, (_, path) in enumerate(kept, start=1):
        dest = OUT / f"parsellene-{index:02d}.jpg"
        w, h = export(path, dest)
        entries.append(
            {
                "src": f"/images/parsellene/{dest.name}",
                "width": w,
                "height": h,
                "alt": "Parsellhagene ved Ølberg strandhager",
            }
        )
        print(f"{dest.name} <- {path.name} ({w}x{h})")

    manifest = Path(__file__).resolve().parent / "parsellene-images.json"
    manifest.write_text(json.dumps(entries, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"\n{len(entries)} images exported; manifest written to {manifest.name}")


if __name__ == "__main__":
    main()
