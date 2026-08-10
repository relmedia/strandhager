import type { Prisma } from '@cabin/database';
import { parseIsoDate, type IsoDate } from '../common/dates';

type Client = Pick<Prisma.TransactionClient, 'blackout'>;

/**
 * Closures covering any day between `start` and `end`, both ends included.
 * Two inclusive ranges overlap when each starts on or before the other ends.
 */
export function findOverlappingBlackouts(
  client: Client,
  spaceId: string,
  start: IsoDate,
  end: IsoDate,
  excludeId?: string,
) {
  return client.blackout.findMany({
    where: {
      spaceId,
      startDate: { lte: parseIsoDate(end) },
      endDate: { gte: parseIsoDate(start) },
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
    select: { id: true, startDate: true, endDate: true, reason: true },
    orderBy: { startDate: 'asc' },
  });
}
