import "dotenv/config";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "../src/generated/prisma";

/**
 * Seeds the spaces that can be rented by the day, their price list, and the
 * 47 parcels. Safe to re-run: everything upserts, and it never touches
 * bookings, parsellanter or the waiting list.
 */

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const prisma = new PrismaClient({
  adapter: new PrismaNeon({ connectionString }),
});

const FELLESHUSET = {
  slug: "felleshuset",
  name: "Felleshuset",
  description:
    "Moderne selskapslokale med plass til inntil 50 personer, rett ved Solastranden.",
  maxGuests: 50,
  cleaningFee: 1500,
  priceNote: "Alle priser er oppgitt inkl. mva.",
  noticeDays: 2,
};

const RATES = [
  { label: "Hverdager", weekdays: [1, 2, 3, 4], amount: 3500, position: 0 },
  { label: "Fredag–søndag", weekdays: [5, 6, 7], amount: 5000, position: 1 },
];

/** The plan has 47 numbered plots, each 300 m². */
const PARCEL_COUNT = 47;
const PARCEL_SIZE = 300;

async function main() {
  const space = await prisma.space.upsert({
    where: { slug: FELLESHUSET.slug },
    create: FELLESHUSET,
    update: FELLESHUSET,
  });

  // Rates have no natural key, so replace the whole price list in one go.
  await prisma.rate.deleteMany({ where: { spaceId: space.id } });
  await prisma.rate.createMany({
    data: RATES.map((rate) => ({ ...rate, spaceId: space.id })),
  });

  console.log(`Seeded space "${space.slug}" with ${RATES.length} day rates.`);

  // Only creates what is missing, so a plot that has been edited or let out
  // survives a re-run untouched.
  const created = await prisma.parcel.createMany({
    data: Array.from({ length: PARCEL_COUNT }, (_, index) => ({
      number: index + 1,
      size: PARCEL_SIZE,
    })),
    skipDuplicates: true,
  });

  console.log(`Seeded ${created.count} new parcels of ${PARCEL_COUNT}.`);
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
