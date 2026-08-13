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
