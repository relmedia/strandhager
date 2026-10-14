/** Mirrors what the booking API returns. Dates are plain YYYY-MM-DD. */

export type BookingStatus =
  | "PENDING"
  | "CONFIRMED"
  | "DECLINED"
  | "CANCELLED"
  | "COMPLETED";

export type PaymentStatus = "UNPAID" | "PARTIALLY_PAID" | "PAID" | "REFUNDED";

export type Booking = {
  id: string;
  reference: string;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  /** Set when a Vipps payment exists, meaning a refund can go through Vipps. */
  paymentReference: string | null;
  startDate: string;
  endDate: string;
  days: number;
  guests: number;
  purpose: string | null;
  message: string | null;
  notes: string | null;
  dayTotal: number;
  cleaningFee: number;
  /** Whether the guest also bought the day before, for rigging. */
  setupOption: SetupOption;
  setupFee: number;
  /** The day held for rigging, or null when none was bought. */
  setupDate: string | null;
  /** The parsellant discount as it stood when the booking was made. */
  discountPercent: number;
  discountAmount: number;
  /** Utleier on this agreement, already resolved against the shared default. */
  landlord: { name: string; lines: string[] };
  total: number;
  cancelledAt: string | null;
  cancelledBy: "GUEST" | "ADMIN" | null;
  cancelReason: string | null;
  /** When the guest ticked the rental-terms box on the website. */
  termsAcceptedAt: string | null;
  /** The guest's hand-drawn signature as a PNG data URL. */
  signature: string | null;
  /** When the dashboard confirmed the booking — the utleier's electronic signature. */
  confirmedAt: string | null;
  /** Which administrator clicked confirm. */
  confirmedByName: string | null;
  createdAt: string;
  updatedAt: string;
  /** Secret in the guest's own booking link, so it can be resent. */
  cancelToken: string;
  /** Where the booking stands in Tripletex. */
  tripletex: {
    invoiceId: number | null;
    invoiceNumber: string | null;
    credited: boolean;
    paymentSynced: boolean;
    error: string | null;
    syncedAt: string | null;
  };
  space: { slug: string; name: string };
  guest: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
    company: string | null;
  };
};

/** Counts per booking status, plus refunded payments as its own figure. */
export type BookingCounts = Record<BookingStatus, number> & { REFUNDED: number };

export type Rate = {
  id: string;
  label: string;
  /** ISO weekdays: 1 is Monday through 7 is Sunday. */
  weekdays: number[];
  amount: number;
};

/** Whether a booking also holds the day before, for rigging. */
export type SetupOption = "NONE" | "HALF_DAY" | "FULL_DAY";

export type Space = {
  slug: string;
  name: string;
  description: string | null;
  maxGuests: number;
  cleaningFee: number;
  setupFullDayFee: number;
  setupHalfDayFee: number;
  /** Percentage off the whole total for a current plot owner. 0 switches it off. */
  parcelOwnerDiscountPercent: number;
  priceNote: string | null;
  noticeDays: number;
  /** The longest stretch of days a single booking may cover. */
  maxBookingDays: number;
  active: boolean;
  rates: Rate[];
  closedWeekdays: number[];
};

/** A stretch of days the space is closed, unrelated to any booking. */
export type Blackout = {
  id: string;
  startDate: string;
  endDate: string;
  days: number;
  reason: string | null;
  past: boolean;
  createdAt: string;
};

export type NewBlackout = {
  space: string;
  startDate: string;
  endDate: string;
  reason?: string;
};

export type BookingFilters = {
  status?: BookingStatus;
  paymentStatus?: PaymentStatus;
  from?: string;
  to?: string;
  q?: string;
  /** Row limit; the API caps it at 500 and defaults to 200. */
  take?: number;
};

export type BookingUpdate = {
  status?: BookingStatus;
  paymentStatus?: PaymentStatus;
  startDate?: string;
  endDate?: string;
  guests?: number;
  purpose?: string;
  notes?: string;
  cancelReason?: string;
  /** Sent along when confirming, recorded as the utleier's electronic signature. */
  confirmedByName?: string;
  /** Overrides utleier on this agreement only. */
  landlordName?: string;
  landlordLines?: string[];
};
