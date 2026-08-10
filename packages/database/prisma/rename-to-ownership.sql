-- Renames the renting vocabulary to owning, keeping the rows. Prisma's db push
-- would drop and recreate these instead, taking the data with it.
ALTER TABLE "Parcel" RENAME COLUMN "tenantId" TO "ownerId";
ALTER TABLE "Tenancy" RENAME TO "Ownership";
