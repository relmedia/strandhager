"use client";

import { useEffect, useState } from "react";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { ConfirmDelete } from "@/components/cms/confirm-delete";
import { ParcelStatusBadge } from "@/components/parcels/badges";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { OwnershipHistory } from "@/components/parcels/ownership-history";
import type { Parcel, ParcelUpdate, Parcellant } from "@/types/parcel";

/** An option cannot carry an empty value, so having no owner needs a stand-in. */
const NOBODY = "none";

type Draft = {
  ownerId: string;
  size: string;
  notes: string;
  available: boolean;
};

function draftOf(parcel: Parcel): Draft {
  return {
    ownerId: parcel.owner?.id ?? "",
    size: parcel.size === null ? "" : String(parcel.size),
    notes: parcel.notes ?? "",
    available: parcel.available,
  };
}

export function ParcelDialog({
  parcel,
  parcellants,
  saving,
  onClose,
  onSave,
  onDelete,
  onHistoryChanged,
}: {
  /** Null closes the dialog; the parcel being edited opens it. */
  parcel: Parcel | null;
  parcellants: Parcellant[];
  saving: boolean;
  onClose: () => void;
  onSave: (id: string, patch: ParcelUpdate) => void;
  onDelete: (parcel: Parcel) => void;
  /** Editing the history can change who rents the plot, so the map must follow. */
  onHistoryChanged: () => void;
}) {
  const [draft, setDraft] = useState<Draft | null>(null);

  // Start over each time a different plot is opened.
  useEffect(() => {
    setDraft(parcel ? draftOf(parcel) : null);
  }, [parcel]);

  if (!parcel || !draft) return null;

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) =>
    setDraft((current) => (current ? { ...current, [key]: value } : current));

  function submit() {
    if (!parcel || !draft) return;

    onSave(parcel.id, {
      ownerId: draft.ownerId || null,
      size: draft.size ? Number(draft.size) : undefined,
      notes: draft.notes,
      available: draft.available,
    });
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      {/* Roomier than the default dialog, with space for the details still to
          come and a tall enough panel that the history rarely needs scrolling. */}
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            Parsell {parcel.number}
            <ParcelStatusBadge status={parcel.status} />
          </DialogTitle>
          <DialogDescription>
            Hvem som eier plassen, og hva som er verdt å huske om den.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="details">
          <TabsList className="w-full">
            <TabsTrigger value="details" className="flex-1">
              Detaljer
            </TabsTrigger>
            <TabsTrigger value="history" className="flex-1">
              Historikk
            </TabsTrigger>
          </TabsList>

          <TabsContent
            value="details"
            className="grid max-h-[60vh] gap-4 overflow-y-auto pt-3 sm:grid-cols-2"
          >
            <div className="space-y-1.5">
              <Label htmlFor="owner">Eier</Label>
              <Select
                value={draft.ownerId || NOBODY}
                onValueChange={(value) =>
                  set("ownerId", value === NOBODY ? "" : value)
                }
              >
                <SelectTrigger id="owner" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NOBODY}>Ingen – parsellen er ledig</SelectItem>
                  {parcellants.map((person) => (
                    <SelectItem key={person.id} value={person.id}>
                      {`${person.lastName}, ${person.firstName}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {parcellants.length === 0 ? (
                <p className="text-muted-foreground text-xs">
                  Det finnes ingen parsellanter ennå. Legg dem inn under
                  Parsellanter først.
                </p>
              ) : (
                <Link
                  href="/parsellanter"
                  className="inline-flex items-center gap-1 text-muted-foreground text-xs hover:text-foreground hover:underline"
                >
                  Se alle parsellanter
                  <ArrowUpRight className="size-3" />
                </Link>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="size">Størrelse i m²</Label>
              <Input
                id="size"
                type="number"
                min={1}
                value={draft.size}
                onChange={(event) => set("size", event.target.value)}
              />
            </div>

            <label className="flex items-start gap-3 rounded-md border p-3 sm:col-span-2">
              <input
                type="checkbox"
                className="mt-0.5 size-4"
                checked={!draft.available}
                onChange={(event) => set("available", !event.target.checked)}
              />
              <span className="space-y-0.5">
                <span className="block font-medium text-sm">
                  Hold parsellen tilbake
                </span>
                <span className="block text-muted-foreground text-xs">
                  Merkes som utilgjengelig, for eksempel mens det gjøres
                  grunnarbeid.
                </span>
              </span>
            </label>

            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="parcel-notes">Notater</Label>
              <Textarea
                id="parcel-notes"
                rows={4}
                value={draft.notes}
                placeholder="Bare synlig her i dashbordet."
                onChange={(event) => set("notes", event.target.value)}
              />
            </div>
          </TabsContent>

          <TabsContent
            value="history"
            className="max-h-[60vh] overflow-y-auto pt-3 pr-1"
          >
            <OwnershipHistory
              parcelId={parcel.id}
              parcellants={parcellants}
              onChanged={onHistoryChanged}
            />
          </TabsContent>
        </Tabs>

        <DialogFooter className="sm:justify-between">
          <ConfirmDelete
            label="Slett parsellen"
            title={`Slette parsell ${parcel.number}?`}
            description="Parsellen forsvinner for godt. Skal den bare tas ut av salg, hold den tilbake i stedet."
            confirmLabel="Slett"
            onConfirm={() => onDelete(parcel)}
          />

          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Avbryt
            </Button>
            <Button disabled={saving} onClick={submit}>
              Lagre
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
