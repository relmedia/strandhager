import type { Booking, Guest, Space } from '@cabin/database';
import { daysBetween, toIsoDate } from '../common/dates';
import { landlordFor } from './landlord';

export type BookingRecord = Booking & {
  space: Pick<Space, 'slug' | 'name'>;
  guest: Pick<Guest, 'id' | 'firstName' | 'lastName' | 'email' | 'phone' | 'company'>;
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
    // Set when a Vipps payment was created; tells the dashboard a refund
    // can go through Vipps.
    paymentReference: booking.paymentReference,
    startDate,
    endDate,
    days: daysBetween(startDate, endDate) + 1,
    guests: booking.guests,
    purpose: booking.purpose,
    message: booking.message,
    notes: booking.notes,
    dayTotal: booking.dayTotal,
    cleaningFee: booking.cleaningFee,
    setupOption: booking.setupOption,
    setupFee: booking.setupFee,
    /** The day held for setting up, or null when none was bought. */
    setupDate:
      booking.setupOption === 'NONE' || !booking.blockedFrom
        ? null
        : toIsoDate(booking.blockedFrom),
    discountPercent: booking.discountPercent,
    discountAmount: booking.discountAmount,
    // Already resolved against the shared default, so nothing downstream has
    // to know the fallback exists.
    landlord: landlordFor(booking),
    total: booking.total,
    cancelledAt: booking.cancelledAt?.toISOString() ?? null,
    cancelledBy: booking.cancelledBy,
    cancelReason: booking.cancelReason,
    termsAcceptedAt: booking.termsAcceptedAt?.toISOString() ?? null,
    signature: booking.signature,
    confirmedAt: booking.confirmedAt?.toISOString() ?? null,
    confirmedByName: booking.confirmedByName,
    createdAt: booking.createdAt.toISOString(),
    updatedAt: booking.updatedAt.toISOString(),
    space: { slug: booking.space.slug, name: booking.space.name },
    guest: booking.guest,
    // So an administrator can send the guest their link again. Nothing else
    // stores it, and there is no email delivery yet.
    cancelToken: booking.cancelToken,
    tripletex: {
      invoiceId: booking.tripletexInvoiceId,
      invoiceNumber: booking.tripletexInvoiceNumber,
      credited: booking.tripletexCreditNoteId !== null,
      paymentSynced: booking.tripletexPaymentSynced,
      error: booking.tripletexError,
      syncedAt: booking.tripletexSyncedAt?.toISOString() ?? null,
    },
  };
}

/** What the guest may see: no internal notes, no database id, no token. */
/**
 * What a guest sees through their own booking link.
 *
 * An allow-list on purpose: anything added to the admin view later stays in
 * the dashboard unless it is named here. It mirrors the website's own Booking
 * type (apps/web/lib/booking.ts).
 */
export function toGuestView(booking: BookingRecord) {
  const view = toAdminView(booking);
  return {
    reference: view.reference,
    status: view.status,
    paymentStatus: view.paymentStatus,
    startDate: view.startDate,
    endDate: view.endDate,
    days: view.days,
    guests: view.guests,
    purpose: view.purpose,
    message: view.message,
    dayTotal: view.dayTotal,
    cleaningFee: view.cleaningFee,
    setupOption: view.setupOption,
    setupFee: view.setupFee,
    setupDate: view.setupDate,
    discountPercent: view.discountPercent,
    discountAmount: view.discountAmount,
    total: view.total,
    cancelledAt: view.cancelledAt,
    cancelReason: view.cancelReason,
    createdAt: view.createdAt,
    space: view.space,
    guest: {
      firstName: view.guest.firstName,
      lastName: view.guest.lastName,
      email: view.guest.email,
      phone: view.guest.phone,
      company: view.guest.company,
    },
  };
}
