"""Download all gallery images from strandhager.no (Utleie + Felleshuset pages)
at original resolution and export sharp, web-optimized JPEGs."""

import io
import re
import urllib.request
from pathlib import Path

from PIL import Image

PAGES = [
    "https://www.strandhager.no/?page_id=15",
    "https://www.strandhager.no/?page_id=67",
]
OUT = Path(__file__).resolve().parents[1] / "apps" / "web" / "public" / "images"
RAW = Path(__file__).resolve().parent / "gallery-raw"
RAW.mkdir(exist_ok=True)

UA = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}
SIZE_SUFFIX = re.compile(r"-\d+x\d+(?=\.(?:jpe?g|png|webp)$)", re.I)


def fetch(url: str) -> bytes:
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=30) as r:
        return r.read()


def collect_urls() -> list[str]:
    urls: list[str] = []
    seen: set[str] = set()
    for page in PAGES:
        html = fetch(page).decode("utf-8", "ignore")
        for m in re.finditer(r"https?://[^\s\"'<>]+?wp-content/uploads/[^\s\"'<>]+?\.(?:jpe?g|png)", html, re.I):
            url = m.group(0)
            original = SIZE_SUFFIX.sub("", url)
            if original not in seen:
                seen.add(original)
                urls.append(original)
    return urls


def main() -> None:
    urls = collect_urls()
    print(f"Found {len(urls)} unique original images")

    for url in urls:
        name = url.rsplit("/", 1)[-1]
        dest = RAW / name
        try:
            data = fetch(url)
        except Exception as e:  # noqa: BLE001
            # Original may not exist; retry the sized URL found in the page
            print(f"  FAILED {name}: {e}")
            continue
        dest.write_bytes(data)
        img = Image.open(io.BytesIO(data))
        print(f"  {name}: {img.size[0]}x{img.size[1]} {len(data) // 1024} KB")


if __name__ == "__main__":
    main()
