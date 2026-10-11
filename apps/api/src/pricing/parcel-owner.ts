import type { Prisma } from '@cabin/database';

type Client = Pick<Prisma.TransactionClient, 'parcellant'>;

/**
 * Whether an email belongs to someone who owns a plot *today*.
 *
 * `parcels: { some: {} }` is what makes it current: `Parcel.ownerId` points at
 * whoever holds the plot now, so selling it ends the discount while leaving the
 * person's ownership history intact.
 *
 * Matched case-insensitively and trimmed, because `Parcellant.email` is neither
 * normalised nor unique — the register is maintained by hand.
 *
 * Deliberately returns a plain boolean. Callers must never surface *who* was
 * matched, which plot they hold, or anything else that would turn a price
 * lookup into a way of reading the owner register.
 */
export async function ownsAParcel(client: Client, email: string): Promise<boolean> {
  const address = email.trim();
  if (!address) return false;

  const owner = await client.parcellant.findFirst({
    where: {
      email: { equals: address, mode: 'insensitive' },
      parcels: { some: {} },
    },
    select: { id: true },
  });

  return owner !== null;
}
