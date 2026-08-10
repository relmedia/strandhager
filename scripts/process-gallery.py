"""Export sharp web-ready gallery images and refresh the homepage strip images
from the full-resolution originals."""

import re
from pathlib import Path

from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
RAW = Path(__file__).resolve().parent / "gallery-raw"
IMAGES = ROOT / "apps" / "web" / "public" / "images"
GALLERI = IMAGES / "galleri"
GALLERI.mkdir(exist_ok=True)

NUM = re.compile(r"-(\d{3})(?:_ny|-1)?\.jpg$", re.I)


def export(src: Path, dest: Path, max_edge: int, quality: int) -> tuple[int, int]:
    img = Image.open(src).convert("RGB")
    w, h = img.size
    scale = min(1.0, max_edge / max(w, h))
    if scale < 1.0:
        img = img.resize((round(w * scale), round(h * scale)), Image.LANCZOS)
    img = img.filter(ImageFilter.UnsharpMask(radius=1.2, percent=60, threshold=2))
    img.save(dest, "JPEG", quality=quality, optimize=True, progressive=True)
    return img.size


def dhash(path: Path, size: int = 8) -> int:
    img = Image.open(path).convert("L").resize((size + 1, size), Image.LANCZOS)
    px = list(img.getdata())
    bits = 0
    for row in range(size):
        for col in range(size):
            bits = (bits << 1) | (px[row * (size + 1) + col] > px[row * (size + 1) + col + 1])
    return bits


def hamming(a: int, b: int) -> int:
    return bin(a ^ b).count("1")


def main() -> None:
    # 1) Full viewer set: the 2022 Felleshus series, deduped across naming families.
    large = {NUM.search(p.name).group(1): p for p in sorted(RAW.glob("2022-OlbergFelleshus-*.jpg"))}
    small = {NUM.search(p.name).group(1): p for p in sorted(RAW.glob("2022-Olberg-felleshus-*.jpg"))}
    merged = dict(small)
    merged.update(large)  # prefer the high-res family on number collisions

    entries = []
    for index, (num, path) in enumerate(sorted(merged.items()), start=1):
        dest = GALLERI / f"felleshuset-{index:02d}.jpg"
        w, h = export(path, dest, max_edge=1920, quality=86)
        entries.append((f"/images/galleri/{dest.name}", w, h))
        print(f"{dest.name} <- {path.name} ({w}x{h})")

    ts = "export const galleryImages = [\n"
    for src, w, h in entries:
        ts += f'  {{ src: "{src}", width: {w}, height: {h} }},\n'
    ts += "] as const;\n"
    (ROOT / "scripts" / "gallery-images.ts.txt").write_text(ts)
    print(f"\n{len(entries)} viewer images exported; TS list written to scripts/gallery-images.ts.txt")

    # 2) Refresh the homepage strip images from their originals (matched by dhash).
    raw_hashes = {p: dhash(p) for p in RAW.glob("2022-*.jpg")}
    for current in sorted(IMAGES.glob("utleie-*.jpg")):
        ch = dhash(current)
        best = min(raw_hashes, key=lambda p: hamming(raw_hashes[p], ch))
        dist = hamming(raw_hashes[best], ch)
        if dist <= 10:
            w, h = export(best, current, max_edge=1600, quality=88)
            print(f"refreshed {current.name} <- {best.name} (dist {dist}, {w}x{h})")
        else:
            print(f"SKIPPED {current.name}: no confident match (best {best.name}, dist {dist})")


if __name__ == "__main__":
    main()
