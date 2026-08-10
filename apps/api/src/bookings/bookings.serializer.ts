import type { Booking, Guest, Space } from '@cabin/database';
import { daysBetween, toIsoDate } from '../common/dates';

export type BookingRecord = Booking & {
  space: Pick<Space, 'slug' | 'name'>;
  guest: Pick<Guest, 'firstName' | 'lastName' | 'email' | 'phone' | 'company'>;
};

/** Everything the dashboard shows, with dates flattened to YYYY-MM-DD. */
export function toAdminView(booking: BookingRecord) {
  const startDate = toIsoDate(booking.startDate);
  const endDate = toIsoDate(booking.endDate);

  return {
    id: booking.id,
    reference: booking.reference,
    status: booking.status,
    paymentStatus: booking.paymentStatus,
    startDate,
    endDate,
    days: daysBetween(startDate, endDate) + 1,
    guests: booking.guests,
    purpose: booking.purpose,
    message: booking.message,
    notes: booking.notes,
    dayTotal: booking.dayTotal,
    cleaningFee: booking.cleaningFee,
    total: booking.total,
    cancelledAt: booking.cancelledAt?.toISOString() ?? null,
    cancelledBy: booking.cancelledBy,
    cancelReason: booking.cancelReason,
    createdAt: booking.createdAt.toISOString(),
    updatedAt: booking.updatedAt.toISOString(),
    space: { slug: booking.space.slug, name: booking.space.name },
    guest: booking.guest,
    // So an administrator can send the guest their link again. Nothing else
    // stores it, and there is no email delivery yet.
    cancelToken: booking.cancelToken,
  };
}

/** What the guest may see: no internal notes, no database id, no token. */
export function toGuestView(booking: BookingRecord) {
  const { id, notes, cancelToken, ...rest } = toAdminView(booking);
  return rest;
}
