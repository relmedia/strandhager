"use client";

import { useEffect, useState } from "react";

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
import { Textarea } from "@/components/ui/textarea";
import type { Parcel, WaitlistEntry, WaitlistInput } from "@/types/parcel";

const EMPTY: WaitlistInput = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  message: "",
  notes: "",
};

function draftOf(entry: WaitlistEntry): WaitlistInput {
  return {
    firstName: entry.firstName,
    lastName: entry.lastName,
    email: entry.email,
    phone: entry.phone ?? "",
    message: entry.message ?? "",
    notes: entry.notes ?? "",
  };
}

export function WaitlistDialog({
  open,
  editing,
  saving,
  onClose,
  onSubmit,
}: {
  open: boolean;
  editing: WaitlistEntry | null;
  saving: boolean;
  onClose: () => void;
  onSubmit: (input: WaitlistInput) => void;
}) {
  const [draft, setDraft] = useState<WaitlistInput>(EMPTY);

  useEffect(() => {
    if (open) setDraft(editing ? draftOf(editing) : EMPTY);
  }, [open, editing]);

  const set = <K extends keyof WaitlistInput>(key: K, value: WaitlistInput[K]) =>
    setDraft((current) => ({ ...current, [key]: value }));

  const complete =
    draft.firstName.trim() !== "" &&
    draft.lastName.trim() !== "" &&
    draft.email.trim() !== "";

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? "Endre oppføring" : "Ny på ventelisten"}</DialogTitle>
          <DialogDescription>
            Plassen i køen følger datoen de meldte seg, så nye havner bakerst.
          </DialogDescription>
        </DialogHeader>

        <form
          id="waitlist-form"
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (complete) onSubmit(draft);
          }}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="wl-firstName">Fornavn</Label>
              <Input
                id="wl-firstName"
                required
                value={draft.firstName}
                onChange={(event) => set("firstName", event.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="wl-lastName">Etternavn</Label>
              <Input
                id="wl-lastName"
                required
                value={draft.lastName}
                onChange={(event) => set("lastName", event.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="wl-email">E-post</Label>
            <Input
              id="wl-email"
              type="email"
              required
              value={draft.email}
              onChange={(event) => set("email", event.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="wl-phone">
              Telefon <span className="text-muted-foreground">(valgfritt)</span>
            </Label>
            <Input
              id="wl-phone"
              type="tel"
              value={draft.phone ?? ""}
              onChange={(event) => set("phone", event.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="wl-message">Melding fra dem</Label>
            <Textarea
              id="wl-message"
              rows={2}
              value={draft.message ?? ""}
              onChange={(event) => set("message", event.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="wl-notes">Notater</Label>
            <Textarea
              id="wl-notes"
              rows={2}
              value={draft.notes ?? ""}
              placeholder="Bare synlig her i dashbordet."
              onChange={(event) => set("notes", event.target.value)}
            />
          </div>
        </form>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Avbryt
          </Button>
          <Button type="submit" form="waitlist-form" disabled={saving || !complete}>
            {editing ? "Lagre" : "Legg til"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function AssignParcelDialog({
  entry,
  parcels,
  saving,
  onClose,
  onAssign,
}: {
  /** Null closes the dialog. */
  entry: WaitlistEntry | null;
  /** Only the plots that are free to hand out. */
  parcels: Parcel[];
  saving: boolean;
  onClose: () => void;
  onAssign: (parcelId: string) => void;
}) {
  const [parcelId, setParcelId] = useState("");

  useEffect(() => {
    setParcelId(parcels[0]?.id ?? "");
  }, [parcels, entry]);

  if (!entry) return null;

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Gi {entry.firstName} {entry.lastName} en parsell
          </DialogTitle>
          <DialogDescription>
            De blir lagt inn som parsellant, får parsellen, og tas av ventelisten.
          </DialogDescription>
        </DialogHeader>

        {parcels.length === 0 ? (
          <p className="rounded-md border border-dashed p-6 text-center text-muted-foreground text-sm">
            Ingen parseller er ledige akkurat nå.
          </p>
        ) : (
          <div className="space-y-1.5">
            <Label htmlFor="assign-parcel">Ledig parsell</Label>
            <Select value={parcelId} onValueChange={setParcelId}>
              <SelectTrigger id="assign-parcel" className="w-full">
                <SelectValue placeholder="Velg parsell" />
              </SelectTrigger>
              <SelectContent>
                {parcels.map((parcel) => (
                  <SelectItem key={parcel.id} value={parcel.id}>
                    Parsell {parcel.number}
                    {parcel.size ? ` · ${parcel.size} m²` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Avbryt
          </Button>
          <Button
            disabled={saving || !parcelId}
            onClick={() => onAssign(parcelId)}
          >
            Tildel parsell
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
