/**
 * Opens an ownership for every plot that already has an owner.
 *
 * Before the history existed, a plot only pointed at whoever owned it, with no
 * record of when that started. The best guess available is when the plot was
 * last edited, which is the day the owner was set. Correct the dates in the
 * dashboard afterwards if they matter.
 *
 * Run from the repository root:  npx tsx packages/database/prisma/backfill-ownerships.ts
 */

import "dotenv/config";

import { prisma } from "../src/client";

async function main() {
  const owned = await prisma.parcel.findMany({
    where: { ownerId: { not: null } },
    select: { id: true, number: true, ownerId: true, updatedAt: true },
    orderBy: { number: "asc" },
  });

  let created = 0;

  for (const parcel of owned) {
    const open = await prisma.ownership.findFirst({
      where: { parcelId: parcel.id, endedAt: null },
      select: { id: true },
    });

    if (open) continue;

    await prisma.ownership.create({
      data: {
        parcelId: parcel.id,
        parcellantId: parcel.ownerId!,
        startedAt: new Date(`${parcel.updatedAt.toISOString().slice(0, 10)}T00:00:00.000Z`),
      },
    });

    created++;
    console.log(`Opened an ownership for parcel ${parcel.number}.`);
  }

  console.log(`Done: ${created} of ${owned.length} owned parcels needed one.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
