"use client";

import { useMemo, useState } from "react";

import { History, Mail, Pencil, Phone, Plus, Search, Users } from "lucide-react";
import { toast } from "sonner";

import { ConfirmDelete } from "@/components/cms/confirm-delete";
import { ParcellantDialog } from "@/components/parcels/parcellant-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useParcellants } from "@/hooks/use-parcels";
import type { Parcellant, ParcellantInput } from "@/types/parcel";

export function ParcellantsList() {
  const parcellants = useParcellants();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Parcellant | null>(null);

  // Filtered here rather than at the API, since the whole list is small and
  // this keeps the search instant.
  const shown = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return parcellants.data;

    return parcellants.data.filter((person) =>
      `${person.firstName} ${person.lastName} ${person.email}`
        .toLowerCase()
        .includes(needle),
    );
  }, [parcellants.data, query]);

  async function submit(input: ParcellantInput) {
    const failure = editing
      ? await parcellants.save(editing.id, input)
      : await parcellants.add(input);

    if (failure) {
      toast.error(failure);
      return;
    }

    setOpen(false);
    setEditing(null);
    toast.success(editing ? "Parsellanten er lagret" : "Parsellanten er lagt til");
  }

  async function remove(person: Parcellant) {
    const failure = await parcellants.remove(person.id);
    if (failure) {
      toast.error(failure);
      return;
    }
    toast.success("Parsellanten er slettet");
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <div className="relative min-w-0 flex-1 sm:max-w-xs">
          <Search className="-translate-y-1/2 absolute top-1/2 left-3 size-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Søk på navn eller e-post"
            className="pl-9"
          />
        </div>

        <Button
          className="ml-auto"
          onClick={() => {
            setEditing(null);
            setOpen(true);
          }}
        >
          <Plus className="size-4" />
          Ny parsellant
        </Button>
      </div>

      {parcellants.error ? (
        <p className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-destructive text-sm">
          {parcellants.error}
        </p>
      ) : null}

      {parcellants.loading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="h-14 w-full" />
          ))}
        </div>
      ) : shown.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed p-12 text-center">
          <Users className="size-8 text-muted-foreground" strokeWidth={1.5} />
          <p className="font-medium">
            {query ? `Ingen treff på «${query}»` : "Ingen parsellanter ennå"}
          </p>
          <p className="max-w-sm text-muted-foreground text-sm">
            {query
              ? "Prøv et annet søk."
              : "Legg inn de som eier parseller, så kan du tildele dem en plass under Parseller."}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Navn</TableHead>
                <TableHead>Kontakt</TableHead>
                <TableHead className="hidden lg:table-cell">Adresse</TableHead>
                <TableHead>Parsell</TableHead>
                <TableHead className="w-24" />
              </TableRow>
            </TableHeader>

            <TableBody>
              {shown.map((person) => (
                <TableRow key={person.id}>
                  <TableCell className="font-medium">
                    {person.firstName} {person.lastName}
                  </TableCell>

                  <TableCell>
                    <a
                      href={`mailto:${person.email}`}
                      className="flex items-center gap-1.5 text-sm hover:underline"
                    >
                      <Mail className="size-3.5 text-muted-foreground" />
                      {person.email}
                    </a>
                    {person.phone ? (
                      <a
                        href={`tel:${person.phone.replace(/\s/g, "")}`}
                        className="flex items-center gap-1.5 text-muted-foreground text-xs hover:underline"
                      >
                        <Phone className="size-3.5" />
                        {person.phone}
                      </a>
                    ) : null}
                  </TableCell>

                  <TableCell className="hidden text-muted-foreground lg:table-cell">
                    {person.address ?? "—"}
                  </TableCell>

                  <TableCell>
                    <ParcelsOwned person={person} />
                  </TableCell>

                  <TableCell>
                    <div className="flex justify-end">
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Endre ${person.firstName} ${person.lastName}`}
                        onClick={() => {
                          setEditing(person);
                          setOpen(true);
                        }}
                      >
                        <Pencil className="size-4" />
                      </Button>

                      <ConfirmDelete
                        label={`Slett ${person.firstName} ${person.lastName}`}
                        title="Slette parsellanten?"
                        description={
                          person.history.length > 0
                            ? `${person.firstName} ${person.lastName} står i historikken til parsell ${[
                                ...new Set(
                                  person.history.map((spell) => spell.parcel.number),
                                ),
                              ].join(
                                ", ",
                              )}, og kan ikke slettes uten at periodene fjernes først.`
                            : `${person.firstName} ${person.lastName} slettes for godt.`
                        }
                        confirmLabel="Slett"
                        onConfirm={() => void remove(person)}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <ParcellantDialog
        open={open}
        editing={editing}
        saving={parcellants.saving}
        onClose={() => {
          setOpen(false);
          setEditing(null);
        }}
        onSubmit={(input) => void submit(input)}
      />
    </div>
  );
}

/**
 * Which plots they own now, and which they used to. The years are worth
 * showing, since somebody who sold up long ago reads differently from somebody
 * who left last season.
 */
function ParcelsOwned({ person }: { person: Parcellant }) {
  const past = person.history.filter((spell) => spell.endedAt !== null);

  if (person.parcels.length === 0 && past.length === 0) {
    return <span className="text-muted-foreground text-sm">Ingen</span>;
  }

  return (
    <div className="space-y-1">
      {person.parcels.length > 0 ? (
        <div className="flex flex-wrap gap-1">
          {person.parcels.map((parcel) => (
            <Badge key={parcel.id} variant="outline">
              {parcel.number}
            </Badge>
          ))}
        </div>
      ) : (
        <span className="text-muted-foreground text-sm">Ingen nå</span>
      )}

      {past.length > 0 ? (
        <p className="flex items-center gap-1 text-muted-foreground text-xs">
          <History className="size-3 shrink-0" aria-hidden />
          Tidligere{" "}
          {past
            .map(
              (spell) =>
                `${spell.parcel.number} (${spell.startedAt.slice(0, 4)}–${spell.endedAt!.slice(0, 4)})`,
            )
            .join(", ")}
        </p>
      ) : null}
    </div>
  );
}
