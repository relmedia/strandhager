/**
 * Slår tofaktor ved innlogging på eller av for dashbordbrukere, uten å gå
 * veien om dashbordet. Nyttig når e-posten med engangskoden ikke kommer fram
 * og ingen kommer seg inn.
 *
 *   node apps/api/scripts/set-two-factor.mjs --all off
 *   node apps/api/scripts/set-two-factor.mjs deg@eksempel.no on
 */
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@cabin/database";
import { config } from "dotenv";

const here = dirname(fileURLToPath(import.meta.url));
const apiRoot = join(here, "..");
const repoRoot = join(apiRoot, "../..");

config({ path: join(repoRoot, ".env") });
config({ path: join(apiRoot, ".env") });

const [targetArg, stateArg] = process.argv.slice(2);

if (!targetArg || !stateArg) {
  console.error(
    "Bruk: node apps/api/scripts/set-two-factor.mjs <e-post|--all> <on|off>",
  );
  process.exit(1);
}

if (stateArg !== "on" && stateArg !== "off") {
  console.error(`Ukjent tilstand «${stateArg}». Bruk on eller off.`);
  process.exit(1);
}

if (!process.env.DATABASE_URL) {
  console.error("Fant ikke DATABASE_URL i .env eller apps/api/.env.");
  process.exit(1);
}

const enabled = stateArg === "on";
const all = targetArg === "--all";
const email = all ? null : targetArg.trim().toLowerCase();

const prisma = new PrismaClient({
  adapter: new PrismaNeon({ connectionString: process.env.DATABASE_URL }),
});

try {
  if (!all) {
    const user = await prisma.adminUser.findUnique({ where: { email } });
    if (!user) {
      console.error(`Fant ingen bruker med e-posten ${email}.`);
      process.exit(1);
    }
  }

  await prisma.adminUser.updateMany({
    where: all ? {} : { email },
    data: { twoFactorEnabled: enabled },
  });

  const users = await prisma.adminUser.findMany({
    where: all ? {} : { email },
    select: { email: true, twoFactorEnabled: true },
    orderBy: { createdAt: "asc" },
  });

  for (const user of users) {
    console.log(`${user.email}: tofaktor er ${user.twoFactorEnabled ? "på" : "av"}`);
  }

  if (!enabled) {
    console.log("\nDisse brukerne logger nå inn med kun e-post og passord.");
  }
} finally {
  await prisma.$disconnect();
}
