/**
 * Creates a dashboard user in AdminUser. There is no self-service sign-up.
 *
 * Usage, from the repo root:
 *   node apps/api/scripts/create-admin.mjs deg@eksempel.no "passordet" "Fullt Navn"
 *
 * The old path still works:
 *   node apps/admin/scripts/create-admin.mjs deg@eksempel.no "passordet" "Fullt Navn"
 */
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@cabin/database";
import * as bcrypt from "bcryptjs";
import { config } from "dotenv";

const here = dirname(fileURLToPath(import.meta.url));
const apiRoot = join(here, "..");
const repoRoot = join(apiRoot, "../..");

config({ path: join(repoRoot, ".env") });
config({ path: join(apiRoot, ".env") });

const [emailArg, password, nameArg] = process.argv.slice(2);

if (!emailArg || !password) {
  console.error(
    'Bruk: node apps/api/scripts/create-admin.mjs <e-post> <passord> ["Fullt Navn"]',
  );
  process.exit(1);
}

if (password.length < 8) {
  console.error("Passordet må være minst 8 tegn.");
  process.exit(1);
}

if (!process.env.DATABASE_URL) {
  console.error("Fant ikke DATABASE_URL i .env eller apps/api/.env.");
  process.exit(1);
}

const email = emailArg.trim().toLowerCase();
const name = nameArg?.trim() || email.split("@")[0];

const prisma = new PrismaClient({
  adapter: new PrismaNeon({ connectionString: process.env.DATABASE_URL }),
});

try {
  const existing = await prisma.adminUser.findUnique({ where: { email } });
  if (existing) {
    console.error(`Det finnes allerede en bruker med e-posten ${email}.`);
    process.exit(1);
  }

  const user = await prisma.adminUser.create({
    data: {
      email,
      name,
      passwordHash: await bcrypt.hash(password, 10),
    },
    select: { id: true, email: true, name: true },
  });

  console.log(`Bruker opprettet: ${user.name} <${user.email}> (${user.id})`);
  console.log("Du kan nå logge inn på admin-siden med denne e-posten og passordet.");
} finally {
  await prisma.$disconnect();
}
