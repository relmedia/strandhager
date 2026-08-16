import { apiFetch } from "@/lib/api";
import type {
  Blackout,
  Booking,
  BookingCounts,
  BookingFilters,
  BookingUpdate,
  NewBlackout,
  Space,
} from "@/types/booking";

export function listBookings(filters: BookingFilters = {}) {
  return apiFetch<Booking[]>("/bookings", { searchParams: { ...filters } });
}

export function getBooking(id: string) {
  return apiFetch<Booking>(`/bookings/${id}`);
}

export function getBookingCounts(space?: string) {
  return apiFetch<BookingCounts>("/bookings/summary", { searchParams: { space } });
}

export type ManualBooking = {
  space: string;
  startDate: string;
  endDate: string;
  guests: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  company?: string;
  purpose?: string;
  notes?: string;
  /** Whether the guest gets the confirmation e-mail. */
  notify: boolean;
  confirmedByName?: string;
};

/** Enters a confirmed booking by hand, on behalf of a guest. */
export function createManualBooking(input: ManualBooking) {
  return apiFetch<Booking>("/bookings/manual", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export type SpaceAvailability = {
  /** Nothing can be booked before this date (notice period). */
  minDate: string;
  bookedDates: string[];
  closedDates: string[];
};

/** Booked and closed days in a window, for the manual-booking calendar. */
export function getAvailability(space: string, from: string, to: string) {
  return apiFetch<SpaceAvailability>("/availability", {
    searchParams: { space, from, to },
  });
}

export type PriceQuote = {
  days: { date: string; price: number }[];
  dayTotal: number;
  cleaningFee: number;
  total: number;
};

export function getQuote(space: string, from: string, to: string) {
  return apiFetch<PriceQuote>("/pricing/quote", {
    searchParams: { space, from, to },
  });
}

export function updateBooking(id: string, patch: BookingUpdate) {
  return apiFetch<Booking>(`/bookings/${id}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
}

export function deleteBooking(id: string) {
  return apiFetch<{ id: string }>(`/bookings/${id}`, { method: "DELETE" });
}

/** Sends the full amount back to the guest through Vipps. */
export function refundBooking(id: string) {
  return apiFetch<Booking>(`/payments/bookings/${id}/refund`, { method: "POST" });
}

export function listBlackouts(space: string, from?: string) {
  return apiFetch<Blackout[]>("/blackouts", { searchParams: { space, from } });
}

export function createBlackout(input: NewBlackout) {
  return apiFetch<Blackout>("/blackouts", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function deleteBlackout(id: string) {
  return apiFetch<{ id: string }>(`/blackouts/${id}`, { method: "DELETE" });
}

export function getSpace(slug: string) {
  return apiFetch<Space>(`/spaces/${slug}`);
}

export function updateSpace(
  slug: string,
  patch: Partial<Omit<Space, "slug" | "rates" | "closedWeekdays">> & {
    rates?: { label: string; weekdays: number[]; amount: number }[];
  },
) {
  return apiFetch<Space>(`/spaces/${slug}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
}
