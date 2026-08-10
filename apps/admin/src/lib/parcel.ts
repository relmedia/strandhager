import { apiFetch } from "@/lib/api";
import type {
  Ownership,
  OwnershipInput,
  OwnershipUpdate,
  Parcel,
  ParcelUpdate,
  Parcellant,
  ParcellantInput,
  ParcellantOwnership,
  WaitlistEntry,
  WaitlistInput,
  WaitlistUpdate,
} from "@/types/parcel";

export function listParcels() {
  return apiFetch<Parcel[]>("/parcels");
}

export function createParcel(input: { number: number; size?: number; notes?: string }) {
  return apiFetch<Parcel>("/parcels", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateParcel(id: string, patch: ParcelUpdate) {
  return apiFetch<Parcel>(`/parcels/${id}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
}

export function deleteParcel(id: string) {
  return apiFetch<{ id: string }>(`/parcels/${id}`, { method: "DELETE" });
}

export function listParcellants(q?: string) {
  return apiFetch<Parcellant[]>("/parcellants", { searchParams: { q } });
}

export function createParcellant(input: ParcellantInput) {
  return apiFetch<Parcellant>("/parcellants", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateParcellant(id: string, patch: Partial<ParcellantInput>) {
  return apiFetch<Parcellant>(`/parcellants/${id}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
}

export function deleteParcellant(id: string) {
  return apiFetch<{ id: string }>(`/parcellants/${id}`, { method: "DELETE" });
}

export function listOwnerships(parcelId: string) {
  return apiFetch<Ownership[]>(`/parcels/${parcelId}/ownerships`);
}

export function listParcellantOwnerships(parcellantId: string) {
  return apiFetch<ParcellantOwnership[]>(`/parcellants/${parcellantId}/ownerships`);
}

export function createOwnership(parcelId: string, input: OwnershipInput) {
  return apiFetch<Ownership>(`/parcels/${parcelId}/ownerships`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateOwnership(id: string, patch: OwnershipUpdate) {
  return apiFetch<Ownership>(`/ownerships/${id}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
}

export function deleteOwnership(id: string) {
  return apiFetch<{ id: string }>(`/ownerships/${id}`, { method: "DELETE" });
}

export function listWaitlist() {
  return apiFetch<WaitlistEntry[]>("/waitlist");
}

export function createWaitlistEntry(input: WaitlistInput) {
  return apiFetch<WaitlistEntry>("/waitlist", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateWaitlistEntry(id: string, patch: WaitlistUpdate) {
  return apiFetch<WaitlistEntry>(`/waitlist/${id}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
}

export function deleteWaitlistEntry(id: string) {
  return apiFetch<{ id: string }>(`/waitlist/${id}`, { method: "DELETE" });
}

/** Makes someone on the list a parsellant and hands them the plot. */
export function assignParcel(entryId: string, parcelId: string) {
  return apiFetch<{ parcellantId: string; parcelNumber: number }>(
    `/waitlist/${entryId}/parcel`,
    { method: "POST", body: JSON.stringify({ parcelId }) },
  );
}
