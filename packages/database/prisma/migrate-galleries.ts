import "dotenv/config";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "../src/generated/prisma";

/**
 * One-off: the single "galleri" section becomes a "galleries" list so the site
 * can host more than one gallery. Existing content is kept as "felleshuset".
 */

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const prisma = new PrismaClient({
  adapter: new PrismaNeon({ connectionString }),
});

type LegacyGallery = {
  eyebrow?: string;
  title?: string;
  images?: unknown[];
};

async function main() {
  const existing = await prisma.siteSection.findUnique({ where: { key: "galleries" } });
  if (existing) {
    console.log("galleries section already exists — nothing to do");
    return;
  }

  const legacyRow = await prisma.siteSection.findUnique({ where: { key: "galleri" } });
  const legacy = (legacyRow?.data ?? {}) as LegacyGallery;

  const galleries = [
    {
      slug: "felleshuset",
      eyebrow: legacy.eyebrow ?? "Bildegalleri",
      title: legacy.title ?? "Felleshuset og uteområdet",
      images: legacy.images ?? [],
    },
    {
      slug: "parsellene",
      eyebrow: "Bildegalleri",
      title: "Parsellene",
      images: [],
    },
  ];

  await prisma.siteSection.create({
    data: { key: "galleries", data: { galleries } },
  });

  console.log(
    `created galleries section (felleshuset: ${galleries[0].images.length} bilder, parsellene: 0)`,
  );

  if (legacyRow) {
    await prisma.siteSection.delete({ where: { key: "galleri" } });
    console.log("removed legacy galleri section");
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
