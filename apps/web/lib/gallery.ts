export type GalleryImage = {
  src: string;
  width: number;
  height: number;
  alt: string;
};

export type Gallery = {
  /** URL segment: /galleri/<slug> */
  slug: string;
  eyebrow: string;
  title: string;
  images: GalleryImage[];
};

export type GalleriesContent = {
  galleries: Gallery[];
};

const dims: ReadonlyArray<readonly [number, number]> = [
  [1701, 1134],
  [1701, 1134],
  [1701, 1199],
  [1701, 1134],
  [1701, 1165],
  [1701, 1134],
  [1701, 1134],
  [1701, 1134],
  [1701, 1134],
  [1701, 1155],
  [1134, 1701],
  [1134, 1701],
  [1134, 1701],
  [1134, 1701],
  [1636, 1091],
  [1134, 1701],
  [1134, 1701],
  [1701, 1134],
  [1680, 1120],
  [1134, 1701],
  [1134, 1701],
  [1701, 1134],
  [1701, 1134],
  [1701, 1134],
  [1701, 1134],
  [1701, 1134],
  [1701, 1134],
  [1701, 1134],
  [1701, 1134],
  [1134, 756],
  [1701, 1134],
  [1134, 756],
  [1701, 1134],
];

export const galleryImages: GalleryImage[] = dims.map(([width, height], index) => ({
  src: `/images/galleri/felleshuset-${String(index + 1).padStart(2, "0")}.jpg`,
  width,
  height,
  alt: `Felleshuset og uteområdet ved Ølberg strandhager – bilde ${index + 1} av ${dims.length}`,
}));

// Exported by scripts/fetch-parsellene.py, ordered from the highest-resolution
// original downwards.
const parselleneDims: ReadonlyArray<readonly [number, number]> = [
  [1920, 1280],
  [1920, 1280],
  [1072, 700],
  [726, 312],
  [480, 720],
  [480, 720],
  [480, 720],
  [536, 340],
  [536, 340],
  ...Array.from({ length: 30 }, () => [480, 320] as const),
];

/** Positions (1-based) that show Edward Andersens hyttetegninger rather than photos. */
const parselleneDrawings = new Set([4, 8, 9]);

export const parselleneImages: GalleryImage[] = parselleneDims.map(([width, height], index) => {
  const position = index + 1;

  return {
    src: `/images/parsellene/parsellene-${String(position).padStart(2, "0")}.jpg`,
    width,
    height,
    alt: parselleneDrawings.has(position)
      ? `Arkitekttegning av parsellhytte ved Ølberg strandhager – bilde ${position} av ${parselleneDims.length}`
      : `Parsellhagene ved Ølberg strandhager – bilde ${position} av ${parselleneDims.length}`,
  };
});

export const galleries: GalleriesContent = {
  galleries: [
    {
      slug: "felleshuset",
      eyebrow: "Bildegalleri",
      title: "Felleshuset og uteområdet",
      images: galleryImages,
    },
    {
      slug: "parsellene",
      eyebrow: "Bildegalleri",
      title: "Parsellene og hyttene",
      images: parselleneImages,
    },
  ],
};
