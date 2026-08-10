"use client";

import { useState } from "react";

import { Check, Pencil, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useOwnerships } from "@/hooks/use-ownerships";
import { formatDuration, formatShortDate } from "@/lib/format";
import type { Parcellant, Ownership, OwnershipInput } from "@/types/parcel";

type Draft = {
  parcellantId: string;
  startedAt: string;
  endedAt: string;
  notes: string;
};

const BLANK: Draft = { parcellantId: "", startedAt: "", endedAt: "", notes: "" };

function draftOf(spell: Ownership): Draft {
  return {
    parcellantId: spell.parcellant.id,
    startedAt: spell.startedAt,
    endedAt: spell.endedAt ?? "",
    notes: spell.notes ?? "",
  };
}

/**
 * Everyone who has owned this plot, newest first, with the present owner at the
 * top. Past owners can be added here too, since most of the history predates
 * the dashboard and has to be typed in from the old records.
 */
export function OwnershipHistory({
  parcelId,
  parcellants,
  onChanged,
}: {
  parcelId: string;
  parcellants: Parcellant[];
  /** The plot's own owner follows the open spell, so the board must refresh. */
  onChanged: () => void;
}) {
  const history = useOwnerships(parcelId);

  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>(BLANK);

  function startAdding() {
    setEditing(null);
    setDraft(BLANK);
    setAdding(true);
  }

  function startEditing(spell: Ownership) {
    setAdding(false);
    setDraft(draftOf(spell));
    setEditing(spell.id);
  }

  function cancel() {
    setAdding(false);
    setEditing(null);
    setDraft(BLANK);
  }

  async function submit() {
    if (!draft.parcellantId || !draft.startedAt) {
      toast.error("Velg hvem som eide, og fra når");
      return;
    }

    const input: OwnershipInput = {
      parcellantId: draft.parcellantId,
      startedAt: draft.startedAt,
      endedAt: draft.endedAt || null,
      notes: draft.notes,
    };

    const failure = editing
      ? await history.save(editing, input)
      : await history.add(input);

    if (failure) {
      toast.error(failure);
      return;
    }

    cancel();
    onChanged();
    toast.success(editing ? "Eierperioden er lagret" : "Eierperioden er lagt til");
  }

  async function remove(spell: Ownership) {
    const failure = await history.remove(spell.id);

    if (failure) {
      toast.error(failure);
      return;
    }

    onChanged();
    toast.success("Eierperioden er fjernet");
  }

  if (history.loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-14 w-full rounded-lg" />
        <Skeleton className="h-14 w-full rounded-lg" />
      </div>
    );
  }

  const form = (
    <div className="space-y-3 rounded-lg border bg-muted/40 p-3">
      <div className="space-y-1.5">
        <Label htmlFor="spell-person">Hvem eide</Label>
        <Select
          value={draft.parcellantId}
          onValueChange={(value) =>
            setDraft((current) => ({ ...current, parcellantId: value }))
          }
        >
          <SelectTrigger id="spell-person" className="w-full">
            <SelectValue placeholder="Velg parsellant" />
          </SelectTrigger>
          <SelectContent>
            {parcellants.map((person) => (
              <SelectItem key={person.id} value={person.id}>
                {`${person.lastName}, ${person.firstName}`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="spell-from">Fra</Label>
          <Input
            id="spell-from"
            type="date"
            value={draft.startedAt}
            onChange={(event) =>
              setDraft((current) => ({ ...current, startedAt: event.target.value }))
            }
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="spell-to">Til</Label>
          <Input
            id="spell-to"
            type="date"
            value={draft.endedAt}
            onChange={(event) =>
              setDraft((current) => ({ ...current, endedAt: event.target.value }))
            }
          />
          <p className="text-muted-foreground text-xs">
            La stå tom hvis de eier den nå.
          </p>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="spell-notes">Notat</Label>
        <Textarea
          id="spell-notes"
          rows={2}
          value={draft.notes}
          placeholder="For eksempel hvorfor de ga den fra seg."
          onChange={(event) =>
            setDraft((current) => ({ ...current, notes: event.target.value }))
          }
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={cancel}>
          <X className="size-4" />
          Avbryt
        </Button>
        <Button size="sm" disabled={history.saving} onClick={() => void submit()}>
          <Check className="size-4" />
          Lagre
        </Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-3">
      {history.error ? (
        <p className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-destructive text-sm">
          {history.error}
        </p>
      ) : null}

      {history.data.length === 0 && !adding ? (
        <div className="rounded-lg border border-dashed p-6 text-center">
          <p className="font-medium text-sm">Ingen eiere er registrert</p>
          <p className="mt-1 text-muted-foreground text-xs">
            Legg inn tidligere eiere her, så følger historikken parsellen
            videre.
          </p>
          <Button variant="outline" size="sm" className="mt-3" onClick={startAdding}>
            <Plus className="size-4" />
            Legg til eier
          </Button>
        </div>
      ) : null}

      {history.data.length > 0 ? (
        <ol className="relative space-y-1">
          {/* The rail sits under the dots, inside the list, so a scrolling
              panel cannot clip it. */}
          <span
            className="absolute top-3 bottom-3 left-[5px] w-px bg-border"
            aria-hidden
          />

          {history.data.map((spell) => {
            const current = spell.endedAt === null;

            if (editing === spell.id) {
              return (
                <li key={spell.id} className="py-1">
                  {form}
                </li>
              );
            }

            return (
              <li key={spell.id} className="group relative py-2 pl-6">
                <span
                  className={`absolute top-3.5 left-0 size-2.5 rounded-full ring-4 ring-background ${
                    current ? "bg-emerald-500" : "bg-muted-foreground/40"
                  }`}
                  aria-hidden
                />

                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="flex flex-wrap items-center gap-2 font-medium text-sm">
                      {spell.parcellant.firstName} {spell.parcellant.lastName}
                      {current ? (
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 font-medium text-[0.65rem] text-emerald-900 dark:bg-emerald-500/15 dark:text-emerald-300">
                          Eier nå
                        </span>
                      ) : null}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {formatShortDate(spell.startedAt)} –{" "}
                      {spell.endedAt ? formatShortDate(spell.endedAt) : "i dag"}
                      <span className="mx-1.5">·</span>
                      {formatDuration(spell.startedAt, spell.endedAt)}
                    </p>
                    {spell.notes ? (
                      <p className="mt-1 text-muted-foreground text-xs italic">
                        {spell.notes}
                      </p>
                    ) : null}
                  </div>

                  <div className="flex shrink-0 gap-0.5 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7"
                      aria-label={`Endre eierperioden til ${spell.parcellant.firstName} ${spell.parcellant.lastName}`}
                      onClick={() => startEditing(spell)}
                    >
                      <Pencil className="size-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7 text-muted-foreground hover:text-destructive"
                      aria-label={`Fjern eierperioden til ${spell.parcellant.firstName} ${spell.parcellant.lastName}`}
                      disabled={history.saving}
                      onClick={() => void remove(spell)}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      ) : null}

      {adding ? form : null}

      {!adding && history.data.length > 0 ? (
        <Button variant="outline" size="sm" onClick={startAdding}>
          <Plus className="size-4" />
          Legg til tidligere eier
        </Button>
      ) : null}
    </div>
  );
}
