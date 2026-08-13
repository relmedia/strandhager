import { apiFetch } from "@/lib/api";
import type { GuestDetail, GuestRow } from "@/types/guest";

export function listGuests() {
  return apiFetch<GuestRow[]>("/guests", { cache: "no-store" });
}

export function getGuest(id: string) {
  return apiFetch<GuestDetail>(`/guests/${id}`, { cache: "no-store" });
}

export type GuestUpdate = {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  company?: string;
};

export function updateGuest(id: string, patch: GuestUpdate) {
  return apiFetch<GuestRow>(`/guests/${id}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
}
