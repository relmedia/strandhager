/**
 * Who the agreement names as the letting party.
 *
 * A booking may carry its own copy — see `Booking.landlordName` — which is what
 * the dashboard's pen writes. Anything without one falls back to this, so old
 * agreements and new ones read the same until somebody deliberately changes a
 * single agreement.
 *
 * Kept per booking rather than as one global setting on purpose: an agreement
 * the guest has already signed should not quietly change wording months later
 * because a phone number was updated. It follows the same reasoning as the
 * price snapshot on `Booking.dayTotal`.
 */
export const DEFAULT_LANDLORD = {
  name: 'Ølberg strandhager ved hagestyret',
  lines: ['felleshuset@strandhager.no', '957 82 508'],
};

export type Landlord = { name: string; lines: string[] };

/** The booking's own details when it has them, otherwise the shared default. */
export function landlordFor(booking: {
  landlordName: string | null;
  landlordLines: string[];
}): Landlord {
  return {
    name: booking.landlordName?.trim() || DEFAULT_LANDLORD.name,
    lines: booking.landlordLines.length > 0 ? booking.landlordLines : DEFAULT_LANDLORD.lines,
  };
}
