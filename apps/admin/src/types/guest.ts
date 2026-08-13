/** Mirrors what the guests API returns. Dates are plain YYYY-MM-DD. */

import type { BookingStatus, PaymentStatus } from "@/types/booking";

export type GuestRow = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  company: string | null;
  createdAt: string;
  bookingCount: number;
  lastStay: { startDate: string; endDate: string } | null;
  /** Sum of confirmed and completed bookings, in whole NOK. */
  totalSpent: number;
};

export type GuestBooking = {
  id: string;
  reference: string;
  startDate: string;
  endDate: string;
  guests: number;
  purpose: string | null;
  total: number;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  space: { slug: string; name: string };
};

export type GuestDetail = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  company: string | null;
  createdAt: string;
  totalSpent: number;
  bookings: GuestBooking[];
};
