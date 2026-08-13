/**
 * One-off: point the existing admin user at a new e-mail, keep the password.
 *
 *   node apps/api/scripts/rename-admin-email.mjs old@eksempel.no new@eksempel.no
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

const [fromArg, toArg] = process.argv.slice(2);

if (!fromArg || !toArg) {
  console.error("Bruk: node apps/api/scripts/rename-admin-email.mjs <gammel-e-post> <ny-e-post>");
  process.exit(1);
}

if (!process.env.DATABASE_URL) {
  console.error("Fant ikke DATABASE_URL i .env eller apps/api/.env.");
  process.exit(1);
}

const from = fromArg.trim().toLowerCase();
const to = toArg.trim().toLowerCase();

const prisma = new PrismaClient({
  adapter: new PrismaNeon({ connectionString: process.env.DATABASE_URL }),
});

try {
  const user = await prisma.adminUser.findUnique({ where: { email: from } });
  if (!user) {
    console.error(`Fant ingen bruker med e-posten ${from}.`);
    process.exit(1);
  }

  const taken = await prisma.adminUser.findUnique({ where: { email: to } });
  if (taken) {
    console.error(`Det finnes allerede en bruker med e-posten ${to}.`);
    process.exit(1);
  }

  const updated = await prisma.adminUser.update({
    where: { id: user.id },
    data: { email: to },
    select: { id: true, email: true, name: true },
  });

  console.log(`Oppdatert: ${updated.name} <${updated.email}> (${updated.id})`);
} finally {
  await prisma.$disconnect();
}
