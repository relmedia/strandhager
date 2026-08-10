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
      "Usage: pnpm --filter @cabin/database exec tsx scripts/check-neon-auth-user.ts <email>",
    );
    process.exit(1);
  }

  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set");
  }

  const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });

  try {
    const schemas = await prisma.$queryRawUnsafe(
      "SELECT schema_name::text AS schema_name FROM information_schema.schemata WHERE schema_name = 'neon_auth'",
    );
    console.log("has_neon_auth_schema", Array.isArray(schemas) && schemas.length > 0);

    const count = await prisma.$queryRawUnsafe('SELECT COUNT(*)::int AS n FROM neon_auth."user"');
    console.log("user_count", count);

    const exists = await prisma.$queryRawUnsafe(
      'SELECT EXISTS(SELECT 1 FROM neon_auth."user" WHERE lower(email) = lower($1)) AS exists',
      email,
    );
    console.log("email_exists", exists);

    const cols = await prisma.$queryRawUnsafe(
      `SELECT column_name::text AS column_name
       FROM information_schema.columns
       WHERE table_schema = 'neon_auth' AND table_name = 'account'
       ORDER BY ordinal_position`,
    );
    console.log("account_columns", cols);

    const userCols = await prisma.$queryRawUnsafe(
      `SELECT column_name::text AS column_name
       FROM information_schema.columns
       WHERE table_schema = 'neon_auth' AND table_name = 'user'
       ORDER BY ordinal_position`,
    );
    console.log("user_columns", userCols);

    const userMeta = await prisma.$queryRawUnsafe(
      `SELECT "emailVerified", banned, "createdAt"
       FROM neon_auth."user"
       WHERE lower(email) = lower($1)
       LIMIT 1`,
      email,
    );
    console.log("user_meta", userMeta);

    const accounts = await prisma.$queryRawUnsafe(
      `SELECT "providerId", "accountId",
              CASE WHEN password IS NULL THEN false ELSE true END AS has_password
       FROM neon_auth.account
       WHERE "userId" IN (
         SELECT id FROM neon_auth."user" WHERE lower(email) = lower($1)
       )`,
      email,
    );
    console.log("accounts", accounts);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error("ERR", error instanceof Error ? error.message : error);
  process.exit(1);
});
