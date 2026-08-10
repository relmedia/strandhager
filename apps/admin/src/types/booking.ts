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
  startDate: string;
  endDate: string;
  days: number;
  guests: number;
  purpose: string | null;
  message: string | null;
  notes: string | null;
  dayTotal: number;
  cleaningFee: number;
  total: number;
  cancelledAt: string | null;
  cancelledBy: "GUEST" | "ADMIN" | null;
  cancelReason: string | null;
  createdAt: string;
  updatedAt: string;
  /** Secret in the guest's own booking link, so it can be resent. */
  cancelToken: string;
  space: { slug: string; name: string };
  guest: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
    company: string | null;
  };
};

export type BookingCounts = Record<BookingStatus, number>;

export type Rate = {
  id: string;
  label: string;
  /** ISO weekdays: 1 is Monday through 7 is Sunday. */
  weekdays: number[];
  amount: number;
};

export type Space = {
  slug: string;
  name: string;
  description: string | null;
  maxGuests: number;
  cleaningFee: number;
  priceNote: string | null;
  noticeDays: number;
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
};
