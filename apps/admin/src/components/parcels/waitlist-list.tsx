"use client";

import { useState } from "react";

import { Globe, Hourglass, Mail, Pencil, Phone, Plus, Sprout } from "lucide-react";
import { toast } from "sonner";

import { ConfirmDelete } from "@/components/cms/confirm-delete";
import { WAITLIST_STATUS_LABELS, WaitlistStatusBadge } from "@/components/parcels/badges";
import {
  AssignParcelDialog,
  WaitlistDialog,
} from "@/components/parcels/waitlist-dialogs";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useParcels, useWaitlist } from "@/hooks/use-parcels";
import { assignParcel } from "@/lib/parcel";
import type { WaitlistEntry, WaitlistInput, WaitlistStatus } from "@/types/parcel";

const STATUSES: WaitlistStatus[] = ["WAITING", "OFFERED", "ACCEPTED", "DECLINED"];

const dateFormat = new Intl.DateTimeFormat("nb-NO", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

export function WaitlistList() {
  const waitlist = useWaitlist();
  const parcels = useParcels();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<WaitlistEntry | null>(null);
  const [assigning, setAssigning] = useState<WaitlistEntry | null>(null);

  const vacant = parcels.data.filter((parcel) => parcel.status === "VACANT");
  const waiting = waitlist.data.filter((entry) => entry.status === "WAITING").length;

  async function submit(input: WaitlistInput) {
    const failure = editing
      ? await waitlist.save(editing.id, input)
      : await waitlist.add(input);

    if (failure) {
      toast.error(failure);
      return;
    }

    setOpen(false);
    setEditing(null);
    toast.success(editing ? "Oppføringen er lagret" : "Lagt til på ventelisten");
  }

  async function setStatus(entry: WaitlistEntry, status: WaitlistStatus) {
    const failure = await waitlist.save(entry.id, { status });
    if (failure) toast.error(failure);
  }

  async function remove(entry: WaitlistEntry) {
    const failure = await waitlist.remove(entry.id);
    if (failure) {
      toast.error(failure);
      return;
    }
    toast.success("Fjernet fra ventelisten");
  }

  async function assign(parcelId: string) {
    if (!assigning) return;

    try {
      const result = await assignParcel(assigning.id, parcelId);
      setAssigning(null);
      // Both lists changed: a plot was let, and the queue moved up.
      await Promise.all([waitlist.reload(), parcels.reload()]);
      toast.success(`Parsell ${result.parcelNumber} er tildelt`);
    } catch (cause) {
      toast.error(
        cause instanceof Error ? cause.message : "Klarte ikke å tildele parsellen",
      );
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <p className="text-muted-foreground text-sm">
          {waiting === 0
            ? "Ingen står i kø akkurat nå."
            : `${waiting} står i kø, og ${vacant.length} ${
                vacant.length === 1 ? "parsell er ledig" : "parseller er ledige"
              }.`}
        </p>

        <Button
          className="ml-auto"
          onClick={() => {
            setEditing(null);
            setOpen(true);
          }}
        >
          <Plus className="size-4" />
          Legg til
        </Button>
      </div>

      {waitlist.error ? (
        <p className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-destructive text-sm">
          {waitlist.error}
        </p>
      ) : null}

      {waitlist.loading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="h-14 w-full" />
          ))}
        </div>
      ) : waitlist.data.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed p-12 text-center">
          <Hourglass className="size-8 text-muted-foreground" strokeWidth={1.5} />
          <p className="font-medium">Ventelisten er tom</p>
          <p className="max-w-sm text-muted-foreground text-sm">
            De som melder seg på via skjemaet på nettsiden havner her av seg selv.
            Ringer eller mailer noen i stedet, kan du legge dem inn her.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>Navn</TableHead>
                <TableHead>Kontakt</TableHead>
                <TableHead className="hidden md:table-cell">Meldte seg</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-32" />
              </TableRow>
            </TableHeader>

            <TableBody>
              {waitlist.data.map((entry) => (
                <TableRow key={entry.id} className={entry.position ? "" : "opacity-60"}>
                  <TableCell className="text-muted-foreground tabular-nums">
                    {entry.position ?? "—"}
                  </TableCell>

                  <TableCell>
                    <span className="flex flex-wrap items-center gap-2 font-medium">
                      {entry.firstName} {entry.lastName}
                      {entry.source === "WEBSITE" ? (
                        <span
                          title="Meldte seg på selv via skjemaet på nettsiden"
                          className="inline-flex items-center gap-1 rounded-full bg-sky-100 px-2 py-0.5 font-medium text-[0.65rem] text-sky-900 dark:bg-sky-500/15 dark:text-sky-300"
                        >
                          <Globe className="size-2.5" aria-hidden />
                          Fra nettsiden
                        </span>
                      ) : null}
                    </span>
                    {entry.message ? (
                      <p className="line-clamp-2 max-w-72 whitespace-normal text-muted-foreground text-xs">
                        {entry.message}
                      </p>
                    ) : null}
                  </TableCell>

                  <TableCell>
                    <a
                      href={`mailto:${entry.email}`}
                      className="flex items-center gap-1.5 text-sm hover:underline"
                    >
                      <Mail className="size-3.5 text-muted-foreground" />
                      {entry.email}
                    </a>
                    {entry.phone ? (
                      <a
                        href={`tel:${entry.phone.replace(/\s/g, "")}`}
                        className="flex items-center gap-1.5 text-muted-foreground text-xs hover:underline"
                      >
                        <Phone className="size-3.5" />
                        {entry.phone}
                      </a>
                    ) : null}
                  </TableCell>

                  <TableCell className="hidden text-muted-foreground text-sm md:table-cell">
                    {dateFormat.format(new Date(entry.createdAt))}
                  </TableCell>

                  <TableCell>
                    {entry.status === "ACCEPTED" ? (
                      <WaitlistStatusBadge status={entry.status} />
                    ) : (
                      <Select
                        value={entry.status}
                        onValueChange={(value) =>
                          void setStatus(entry, value as WaitlistStatus)
                        }
                      >
                        <SelectTrigger
                          size="sm"
                          className="text-xs"
                          aria-label={`Status for ${entry.firstName} ${entry.lastName}`}
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {STATUSES.filter((status) => status !== "ACCEPTED").map(
                            (status) => (
                              <SelectItem
                                key={status}
                                value={status}
                                className="text-xs"
                              >
                                {WAITLIST_STATUS_LABELS[status]}
                              </SelectItem>
                            ),
                          )}
                        </SelectContent>
                      </Select>
                    )}
                  </TableCell>

                  <TableCell>
                    <div className="flex justify-end">
                      {entry.status === "ACCEPTED" ? null : (
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`Gi ${entry.firstName} ${entry.lastName} en parsell`}
                          title="Tildel parsell"
                          onClick={() => setAssigning(entry)}
                        >
                          <Sprout className="size-4" />
                        </Button>
                      )}

                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Endre ${entry.firstName} ${entry.lastName}`}
                        onClick={() => {
                          setEditing(entry);
                          setOpen(true);
                        }}
                      >
                        <Pencil className="size-4" />
                      </Button>

                      <ConfirmDelete
                        label={`Fjern ${entry.firstName} ${entry.lastName}`}
                        title="Fjerne fra ventelisten?"
                        description={`${entry.firstName} ${entry.lastName} tas av listen, og de bak rykker opp.`}
                        confirmLabel="Fjern"
                        onConfirm={() => void remove(entry)}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <WaitlistDialog
        open={open}
        editing={editing}
        saving={waitlist.saving}
        onClose={() => {
          setOpen(false);
          setEditing(null);
        }}
        onSubmit={(input) => void submit(input)}
      />

      <AssignParcelDialog
        entry={assigning}
        parcels={vacant}
        saving={waitlist.saving}
        onClose={() => setAssigning(null)}
        onAssign={(parcelId) => void assign(parcelId)}
      />
    </div>
  );
}
