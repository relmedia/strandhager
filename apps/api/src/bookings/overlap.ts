import { BookingStatus, type Prisma } from '@cabin/database';
import { parseIsoDate, type IsoDate } from '../common/dates';

/**
 * Statuses that hold a date. A request holds it too, so two people cannot both
 * be waiting on the same weekend, and declining or cancelling releases it.
 */
export const BLOCKING_STATUSES: BookingStatus[] = [
  BookingStatus.PENDING,
  BookingStatus.CONFIRMED,
];

type Client = Pick<Prisma.TransactionClient, 'booking'>;

/**
 * Bookings that hold any day between `start` and `end`, both ends included.
 * Two inclusive ranges overlap when each starts on or before the other ends.
 */
export function findOverlapping(
  client: Client,
  spaceId: string,
  start: IsoDate,
  end: IsoDate,
  excludeId?: string,
) {
  return client.booking.findMany({
    where: {
      spaceId,
      status: { in: BLOCKING_STATUSES },
      startDate: { lte: parseIsoDate(end) },
      endDate: { gte: parseIsoDate(start) },
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
    select: {
      id: true,
      reference: true,
      status: true,
      startDate: true,
      endDate: true,
    },
    orderBy: { startDate: 'asc' },
  });
}
