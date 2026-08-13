import { apiFetch } from "@/lib/api";
import type { GuestDetail, GuestRow } from "@/types/guest";

export function listGuests() {
  return apiFetch<GuestRow[]>("/guests", { cache: "no-store" });
}

export function getGuest(id: string) {
  return apiFetch<GuestDetail>(`/guests/${id}`, { cache: "no-store" });
}
