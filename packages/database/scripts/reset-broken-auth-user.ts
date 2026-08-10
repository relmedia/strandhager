import { config } from "dotenv";
import { resolve } from "node:path";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "../src/generated/prisma";

config({ path: resolve(process.cwd(), "../../.env") });
config({ path: resolve(process.cwd(), ".env") });

async function main() {
  const email = process.argv[2];
  if (!email) {
    console.error(
      "Usage: pnpm --filter @cabin/database exec tsx scripts/reset-broken-auth-user.ts <email>",
    );
    process.exit(1);
  }

  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set");
  }

  const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });

  try {
    const users = await prisma.$queryRawUnsafe<{ id: string }[]>(
      `SELECT id FROM neon_auth."user" WHERE lower(email) = lower($1)`,
      email,
    );

    if (users.length === 0) {
      console.log("No user found for that email.");
      return;
    }

    const userId = users[0].id;

    await prisma.$executeRawUnsafe(`DELETE FROM neon_auth.session WHERE "userId" = $1`, userId);
    await prisma.$executeRawUnsafe(`DELETE FROM neon_auth.account WHERE "userId" = $1`, userId);
    await prisma.$executeRawUnsafe(`DELETE FROM neon_auth."user" WHERE id = $1`, userId);

    console.log("Removed broken auth user. Sign up again from /login.");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error("ERR", error instanceof Error ? error.message : error);
  process.exit(1);
});
