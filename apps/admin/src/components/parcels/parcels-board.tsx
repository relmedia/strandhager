"use client";

import { useMemo, useState } from "react";

import { toast } from "sonner";

import { PARCEL_STATUS_LABELS } from "@/components/parcels/badges";
import { ParcelDialog } from "@/components/parcels/parcel-dialog";
import { ParcelMap } from "@/components/parcels/parcel-map";
import { PARCEL_LOCATIONS } from "@/components/parcels/parcel-locations";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useParcellants, useParcels } from "@/hooks/use-parcels";
import type { Parcel, ParcelStatus, ParcelUpdate } from "@/types/parcel";

const FILTERS: { value: ParcelStatus | null; label: string; dot: string }[] = [
  { value: null, label: "Alle", dot: "bg-foreground/30" },
  { value: "OWNED", label: PARCEL_STATUS_LABELS.OWNED, dot: "bg-emerald-400" },
  { value: "VACANT", label: PARCEL_STATUS_LABELS.VACANT, dot: "bg-amber-200" },
  {
    value: "UNAVAILABLE",
    label: PARCEL_STATUS_LABELS.UNAVAILABLE,
    dot: "bg-slate-300",
  },
];

export function ParcelsBoard() {
  const parcels = useParcels();
  const parcellants = useParcellants();

  const [filter, setFilter] = useState<ParcelStatus | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Held by id rather than by value, so that editing the history — which can
  // change who owns the plot — leaves the open dialog showing the new owner
  // instead of the one it was opened with.
  const editing = useMemo(
    () => parcels.data.find((parcel) => parcel.id === editingId) ?? null,
    [parcels.data, editingId],
  );

  const counts = useMemo(() => {
    const tally: Record<ParcelStatus, number> = {
      OWNED: 0,
      VACANT: 0,
      UNAVAILABLE: 0,
    };
    for (const parcel of parcels.data) tally[parcel.status]++;
    return tally;
  }, [parcels.data]);

  // The map can only place plots that have an address. Anything else would
  // silently vanish, so it is listed under the map instead.
  const offMap = useMemo(() => {
    const placed = new Set(PARCEL_LOCATIONS.map((place) => place.number));
    return parcels.data.filter((parcel) => !placed.has(parcel.number));
  }, [parcels.data]);

  async function save(id: string, patch: ParcelUpdate) {
    const failure = await parcels.save(id, patch);
    if (failure) {
      toast.error(failure);
      return;
    }
    setEditingId(null);
    toast.success("Parsellen er lagret");
  }

  async function remove(parcel: Parcel) {
    const failure = await parcels.remove(parcel.id);
    if (failure) {
      toast.error(failure);
      return;
    }
    setEditingId(null);
    toast.success(`Parsell ${parcel.number} er slettet`);
  }

  if (parcels.loading) {
    return <Skeleton className="aspect-2/1 w-full rounded-xl" />;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {FILTERS.map((tab) => {
          const count = tab.value === null ? parcels.data.length : counts[tab.value];
          const active = tab.value === filter;

          return (
            <button
              key={tab.label}
              type="button"
              onClick={() => setFilter(tab.value)}
              aria-pressed={active}
              className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 font-medium text-sm transition-colors ${
                active
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-accent hover:text-foreground"
              }`}
            >
              <span
                className={`size-2.5 rounded-full ring-1 ring-black/10 ${tab.dot}`}
                aria-hidden
              />
              {tab.label}
              <span
                className={`tabular-nums text-xs ${active ? "opacity-80" : "opacity-60"}`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {parcels.error ? (
        <p className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-destructive text-sm">
          {parcels.error}
        </p>
      ) : null}

      <ParcelMap
        parcels={parcels.data}
        filter={filter}
        onSelect={(parcel) => setEditingId(parcel.id)}
      />

      <p className="text-muted-foreground text-xs">
        Kartet viser flyfoto av området. Dra for å flytte det, rull for å zoome, og
        velg en parsell for å se og endre hvem som eier den. Zoom inn for å se
        navnet på eieren.
      </p>

      {offMap.length > 0 ? (
        <div className="space-y-2 rounded-lg border border-dashed p-4">
          <p className="font-medium text-sm">Uten plass i kartet</p>
          <p className="text-muted-foreground text-xs">
            Disse parsellene finnes i databasen, men har ingen adresse i
            Strandhagane, så de kan ikke plasseres i kartet.
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            {offMap.map((parcel) => (
              <Button
                key={parcel.id}
                variant="outline"
                size="sm"
                onClick={() => setEditingId(parcel.id)}
              >
                Parsell {parcel.number}
              </Button>
            ))}
          </div>
        </div>
      ) : null}

      <ParcelDialog
        parcel={editing}
        parcellants={parcellants.data}
        saving={parcels.saving}
        onClose={() => setEditingId(null)}
        onSave={(id, patch) => void save(id, patch)}
        onDelete={(parcel) => void remove(parcel)}
        onHistoryChanged={() => void parcels.reload()}
      />
    </div>
  );
}
