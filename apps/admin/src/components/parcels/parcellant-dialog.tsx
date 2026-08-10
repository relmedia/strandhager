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
import { Textarea } from "@/components/ui/textarea";
import type { Parcellant, ParcellantInput } from "@/types/parcel";

const EMPTY: ParcellantInput = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  address: "",
  notes: "",
};

function draftOf(person: Parcellant): ParcellantInput {
  return {
    firstName: person.firstName,
    lastName: person.lastName,
    email: person.email,
    phone: person.phone ?? "",
    address: person.address ?? "",
    notes: person.notes ?? "",
  };
}

export function ParcellantDialog({
  open,
  editing,
  saving,
  onClose,
  onSubmit,
}: {
  open: boolean;
  /** The person being changed, or null when adding someone new. */
  editing: Parcellant | null;
  saving: boolean;
  onClose: () => void;
  onSubmit: (input: ParcellantInput) => void;
}) {
  const [draft, setDraft] = useState<ParcellantInput>(EMPTY);

  useEffect(() => {
    if (open) setDraft(editing ? draftOf(editing) : EMPTY);
  }, [open, editing]);

  const set = <K extends keyof ParcellantInput>(key: K, value: ParcellantInput[K]) =>
    setDraft((current) => ({ ...current, [key]: value }));

  const complete =
    draft.firstName.trim() !== "" &&
    draft.lastName.trim() !== "" &&
    draft.email.trim() !== "";

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {editing ? "Endre parsellant" : "Ny parsellant"}
          </DialogTitle>
          <DialogDescription>
            Kontaktopplysningene til den som eier. Parsellen tildeles under
            Parseller.
          </DialogDescription>
        </DialogHeader>

        <form
          id="parcellant-form"
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (complete) onSubmit(draft);
          }}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              id="firstName"
              label="Fornavn"
              value={draft.firstName}
              onChange={(value) => set("firstName", value)}
              required
            />
            <Field
              id="lastName"
              label="Etternavn"
              value={draft.lastName}
              onChange={(value) => set("lastName", value)}
              required
            />
          </div>

          <Field
            id="email"
            label="E-post"
            type="email"
            value={draft.email}
            onChange={(value) => set("email", value)}
            required
          />

          <Field
            id="phone"
            label="Telefon"
            type="tel"
            value={draft.phone ?? ""}
            onChange={(value) => set("phone", value)}
          />

          <Field
            id="address"
            label="Adresse"
            value={draft.address ?? ""}
            onChange={(value) => set("address", value)}
          />

          <div className="space-y-1.5">
            <Label htmlFor="notes">Notater</Label>
            <Textarea
              id="notes"
              rows={3}
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
          <Button type="submit" form="parcellant-form" disabled={saving || !complete}>
            {editing ? "Lagre" : "Legg til"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  type = "text",
  required,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>
        {label}
        {required ? null : <span className="text-muted-foreground"> (valgfritt)</span>}
      </Label>
      <Input
        id={id}
        type={type}
        value={value}
        required={required}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}
