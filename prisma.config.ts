import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "packages/database/prisma/schema.prisma",
  migrations: {
    path: "packages/database/prisma/migrations",
    seed: "tsx packages/database/prisma/seed.ts",
  },

  datasource: {
    // Direct (non-pooled) URL — required for Prisma migrate / db push
    url: env("DIRECT_URL"),
  },
});
