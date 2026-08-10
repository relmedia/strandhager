import "dotenv/config";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "../src/generated/prisma";
// Initial content comes straight from the web app's static defaults.
import { galleries } from "../../../apps/web/lib/gallery";
import { site } from "../../../apps/web/lib/site-content";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const prisma = new PrismaClient({
  adapter: new PrismaNeon({ connectionString }),
});

async function main() {
  const sections = Object.entries(site).filter(([, value]) => typeof value === "object");
  const scalars = Object.fromEntries(
    Object.entries(site).filter(([, value]) => typeof value !== "object"),
  );

  // Scalar site fields (name, tagline, logo) live in a "general" section.
  await prisma.siteSection.upsert({
    where: { key: "general" },
    create: { key: "general", data: scalars },
    update: { data: scalars },
  });
  console.log("seeded general:", Object.keys(scalars).join(", "));

  for (const [key, data] of sections) {
    await prisma.siteSection.upsert({
      where: { key },
      create: { key, data: data as object },
      update: { data: data as object },
    });
    console.log("seeded section:", key);
  }

  await prisma.siteSection.upsert({
    where: { key: "galleries" },
    create: { key: "galleries", data: galleries },
    update: { data: galleries },
  });
  console.log("seeded section: galleries");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
