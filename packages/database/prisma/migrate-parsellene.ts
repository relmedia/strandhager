import "dotenv/config";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "../src/generated/prisma";
import { parselleneImages } from "../../../apps/web/lib/gallery";
import { site } from "../../../apps/web/lib/site-content";

/**
 * One-off: replaces the Parsellene section with the richer model (nøkkeltall,
 * hytteinnhold, hagestyret, arkitekter, venteliste) and fills the Parsellene
 * gallery with the photos exported by scripts/fetch-parsellene.py. Other
 * sections and the Felleshuset gallery are left untouched.
 */

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const prisma = new PrismaClient({
  adapter: new PrismaNeon({ connectionString }),
});

type StoredGallery = { slug: string; eyebrow: string; title: string; images: unknown[] };

async function main() {
  await prisma.siteSection.upsert({
    where: { key: "parsellene" },
    create: { key: "parsellene", data: site.parsellene },
    update: { data: site.parsellene },
  });
  console.log("updated parsellene section");

  const row = await prisma.siteSection.findUnique({ where: { key: "galleries" } });
  const stored = (row?.data ?? {}) as { galleries?: StoredGallery[] };
  const galleries = stored.galleries ?? [];

  const parsellene: StoredGallery = {
    slug: "parsellene",
    eyebrow: "Bildegalleri",
    title: "Parsellene og hyttene",
    images: parselleneImages,
  };

  const index = galleries.findIndex((gallery) => gallery.slug === "parsellene");
  const next =
    index === -1
      ? [...galleries, parsellene]
      : galleries.map((gallery, i) =>
          i === index ? { ...gallery, title: parsellene.title, images: parselleneImages } : gallery,
        );

  await prisma.siteSection.upsert({
    where: { key: "galleries" },
    create: { key: "galleries", data: { galleries: next } },
    update: { data: { galleries: next } },
  });

  console.log(
    `parsellene gallery now has ${parselleneImages.length} bilder; ${next.length} galleri totalt`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
