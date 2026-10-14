import { apiFetch } from "@/lib/api";
import type {
  TripletexOptions,
  TripletexSettings,
  TripletexSettingsUpdate,
} from "@/types/tripletex";

export function getTripletexSettings() {
  return apiFetch<TripletexSettings>("/tripletex/settings");
}

export function updateTripletexSettings(patch: TripletexSettingsUpdate) {
  return apiFetch<TripletexSettings>("/tripletex/settings", {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
}

export function testTripletexConnection() {
  return apiFetch<{ ok: boolean; message: string }>("/tripletex/test", { method: "POST" });
}

export function getTripletexOptions() {
  return apiFetch<TripletexOptions>("/tripletex/options");
}

/** Sends a booking to Tripletex now, or tries again after a failure. */
export function syncBookingToTripletex(bookingId: string) {
  return apiFetch<{ ok: boolean; error: string | null }>(`/tripletex/bookings/${bookingId}/sync`, {
    method: "POST",
  });
}
