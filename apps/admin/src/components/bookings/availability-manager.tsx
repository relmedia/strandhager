"use client";

import { useMemo, useState } from "react";

import { ChevronLeft, ChevronRight, Lock } from "lucide-react";
import { toast } from "sonner";

import { ConfirmDelete } from "@/components/cms/confirm-delete";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useBlackouts } from "@/hooks/use-blackouts";
import { useBookings } from "@/hooks/use-bookings";
import {
  addMonths,
  daysBetween,
  eachDay,
  endOfMonth,
  formatMonth,
  isoWeekday,
  startOfMonth,
  todayString,
} from "@/lib/dates";
import { formatDateRange } from "@/lib/format";
import type { Blackout, Booking, BookingStatus } from "@/types/booking";

const WEEKDAYS = ["Man", "Tir", "Ons", "Tor", "Fre", "Lør", "Søn"];

/** Statuses that hold a date, and so stand in the way of closing it. */
const HOLDING: BookingStatus[] = ["PENDING", "CONFIRMED", "COMPLETED"];

type Selection = { start: string; end: string | null };

export function AvailabilityManager({ space }: { space: string }) {
  const today = todayString();
  const [month, setMonth] = useState(() => startOfMonth(today));
  const [selection, setSelection] = useState<Selection | null>(null);

  const range = useMemo(() => ({ from: month, to: endOfMonth(month) }), [month]);
  const bookings = useBookings(range);
  const blackouts = useBlackouts(space);

  /** Which day belongs to which closure, so a cell can name its reason. */
  const closedDays = useMemo(() => {
    const map = new Map<string, Blackout>();
    for (const blackout of blackouts.data) {
      for (const day of eachDay(blackout.startDate, blackout.endDate)) {
        map.set(day, blackout);
      }
    }
    return map;
  }, [blackouts.data]);

  const bookedDays = useMemo(() => {
    const map = new Map<string, Booking>();
    for (const booking of bookings.data) {
      if (!HOLDING.includes(booking.status)) continue;
      for (const day of eachDay(booking.startDate, booking.endDate)) {
        map.set(day, booking);
      }
    }
    return map;
  }, [bookings.data]);

  const taken = (day: string) => closedDays.has(day) || bookedDays.has(day);

  function handleSelect(day: string) {
    setSelection((current) => {
      // Nothing picked yet, or a finished range is being replaced.
      if (!current || current.end !== null) return { start: day, end: null };
      if (daysBetween(current.start, day) < 0) return { start: day, end: null };

      // A closure cannot straddle days that are already spoken for.
      const between = eachDay(current.start, day);
      if (between.some(taken)) return { start: day, end: null };

      return { start: current.start, end: day };
    });
  }

  async function close(reason: string) {
    if (!selection) return;

    const failure = await blackouts.add({
      startDate: selection.start,
      endDate: selection.end ?? selection.start,
      reason: reason || undefined,
    });

    if (failure) {
      toast.error(failure);
      return;
    }

    setSelection(null);
    toast.success("Dagene er stengt");
  }

  async function reopen(blackout: Blackout) {
    const failure = await blackouts.remove(blackout.id);
    if (failure) {
      toast.error(failure);
      return;
    }
    toast.success("Dagene er åpne igjen");
  }

  const loading = bookings.loading || blackouts.loading;
  const error = bookings.error ?? blackouts.error;
  const days = useMemo(() => eachDay(month, endOfMonth(month)), [month]);
  const leadingBlanks = isoWeekday(month) - 1;

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              aria-label="Forrige måned"
              onClick={() => setMonth(addMonths(month, -1))}
            >
              <ChevronLeft className="size-4" />
            </Button>

            <Button
              variant="outline"
              size="icon"
              aria-label="Neste måned"
              onClick={() => setMonth(addMonths(month, 1))}
            >
              <ChevronRight className="size-4" />
            </Button>

            <p aria-live="polite" className="font-medium text-lg capitalize">
              {formatMonth(month)}
            </p>

            <Button
              variant="ghost"
              size="sm"
              className="ml-auto"
              onClick={() => setMonth(startOfMonth(today))}
            >
              I dag
            </Button>
          </div>

          {error ? (
            <p className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-destructive text-sm">
              {error}
            </p>
          ) : null}

          {loading ? (
            <Skeleton className="h-96 w-full" />
          ) : (
            <div className="overflow-hidden rounded-lg border">
              <div className="grid grid-cols-7 border-b bg-muted/40">
                {WEEKDAYS.map((day) => (
                  <div
                    key={day}
                    className="px-2 py-2 text-center font-medium text-muted-foreground text-xs"
                  >
                    {day}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7">
                {Array.from({ length: leadingBlanks }, (_, index) => (
                  <div key={`blank-${index}`} className="aspect-square border-r border-b bg-muted/20" />
                ))}

                {days.map((day) => (
                  <DayCell
                    key={day}
                    day={day}
                    today={today}
                    blackout={closedDays.get(day)}
                    booking={bookedDays.get(day)}
                    selection={selection}
                    onSelect={handleSelect}
                  />
                ))}
              </div>
            </div>
          )}

          <ul className="flex flex-wrap gap-x-5 gap-y-2 text-muted-foreground text-xs">
            <Legend className="border bg-background">Ledig</Legend>
            <Legend className="bg-primary">Valgt</Legend>
            <Legend className="bg-destructive/20">Stengt</Legend>
            <Legend className="bg-emerald-100 dark:bg-emerald-500/20">Booket</Legend>
          </ul>
        </div>

        <CloseForm
          selection={selection}
          saving={blackouts.saving}
          onCancel={() => setSelection(null)}
          onSubmit={close}
        />
      </div>

      <ClosureList
        blackouts={blackouts.data}
        loading={blackouts.loading}
        onRemove={reopen}
      />
    </div>
  );
}

function Legend({ className, children }: { className: string; children: string }) {
  return (
    <li className="flex items-center gap-2">
      <span className={`size-3 rounded-[3px] ${className}`} aria-hidden />
      {children}
    </li>
  );
}

type DayState = "free" | "selected" | "closed" | "booked" | "past";

const CELL_STYLES: Record<DayState, string> = {
  free: "hover:bg-accent",
  selected: "bg-primary text-primary-foreground",
  closed: "bg-destructive/15 text-destructive",
  booked: "bg-emerald-100 text-emerald-900 dark:bg-emerald-500/20 dark:text-emerald-200",
  past: "bg-muted/30 text-muted-foreground/50",
};

function DayCell({
  day,
  today,
  blackout,
  booking,
  selection,
  onSelect,
}: {
  day: string;
  today: string;
  blackout?: Blackout;
  booking?: Booking;
  selection: Selection | null;
  onSelect: (day: string) => void;
}) {
  const state = dayState(day, today, blackout, booking, selection);
  const disabled = state === "closed" || state === "booked" || state === "past";

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onSelect(day)}
      title={dayTitle(state, blackout, booking)}
      aria-pressed={state === "selected"}
      className={`relative aspect-square border-r border-b text-sm transition-colors disabled:cursor-not-allowed ${CELL_STYLES[state]}`}
    >
      <span
        className={
          day === today && state !== "selected" ? "font-semibold underline underline-offset-4" : ""
        }
      >
        {Number(day.slice(8))}
      </span>
    </button>
  );
}

function dayState(
  day: string,
  today: string,
  blackout: Blackout | undefined,
  booking: Booking | undefined,
  selection: Selection | null,
): DayState {
  if (selection) {
    const end = selection.end ?? selection.start;
    if (daysBetween(selection.start, day) >= 0 && daysBetween(day, end) >= 0) {
      return "selected";
    }
  }

  if (blackout) return "closed";
  if (booking) return "booked";
  // Closing a day that has been and gone would change nothing.
  if (daysBetween(today, day) < 0) return "past";

  return "free";
}

function dayTitle(state: DayState, blackout?: Blackout, booking?: Booking): string {
  if (state === "closed") return blackout?.reason ?? "Stengt";
  if (state === "booked" && booking) {
    return `${booking.reference} · ${booking.guest.firstName} ${booking.guest.lastName}`;
  }
  if (state === "past") return "Datoen har vært";
  return "";
}

function CloseForm({
  selection,
  saving,
  onCancel,
  onSubmit,
}: {
  selection: Selection | null;
  saving: boolean;
  onCancel: () => void;
  onSubmit: (reason: string) => void;
}) {
  const [reason, setReason] = useState("");

  if (!selection) {
    return (
      <section className="space-y-3 rounded-lg border border-dashed p-5">
        <h2 className="font-medium">Steng dager</h2>
        <p className="text-muted-foreground text-sm">
          Trykk på en dag i kalenderen for å begynne, og på en dag til for å stenge en
          hel periode. Stengte dager kan ikke bookes av gjester.
        </p>
      </section>
    );
  }

  const start = selection.start;
  const end = selection.end ?? selection.start;
  const days = daysBetween(start, end) + 1;

  return (
    <section className="h-fit space-y-4 rounded-lg border p-5">
      <div className="space-y-1">
        <h2 className="font-medium">Steng dager</h2>
        <p className="text-muted-foreground text-sm">
          {formatDateRange(start, end)} · {days} {days === 1 ? "dag" : "dager"}
        </p>
      </div>

      {selection.end === null ? (
        <p className="text-muted-foreground text-sm">
          Trykk på en dag til for å stenge flere, eller stenging bare denne ene.
        </p>
      ) : null}

      <div className="space-y-1.5">
        <Label htmlFor="reason">Årsak</Label>
        <Input
          id="reason"
          value={reason}
          maxLength={200}
          placeholder="For eksempel: vedlikehold"
          onChange={(event) => setReason(event.target.value)}
        />
        <p className="text-muted-foreground text-xs">Vises bare her i dashbordet.</p>
      </div>

      <div className="flex gap-2">
        <Button
          disabled={saving}
          onClick={() => {
            onSubmit(reason.trim());
            setReason("");
          }}
        >
          <Lock className="size-4" />
          Steng {days === 1 ? "dagen" : "dagene"}
        </Button>
        <Button variant="ghost" disabled={saving} onClick={onCancel}>
          Avbryt
        </Button>
      </div>
    </section>
  );
}

function ClosureList({
  blackouts,
  loading,
  onRemove,
}: {
  blackouts: Blackout[];
  loading: boolean;
  onRemove: (blackout: Blackout) => void;
}) {
  const upcoming = blackouts.filter((blackout) => !blackout.past);

  return (
    <section className="space-y-3">
      <h2 className="font-medium">Kommende stengninger</h2>

      {loading ? <Skeleton className="h-20 w-full" /> : null}

      {!loading && upcoming.length === 0 ? (
        <p className="rounded-lg border border-dashed p-6 text-center text-muted-foreground text-sm">
          Ingen dager er stengt framover.
        </p>
      ) : null}

      {upcoming.length > 0 ? (
        <ul className="divide-y rounded-lg border">
          {upcoming.map((blackout) => (
            <li key={blackout.id} className="flex items-center gap-4 p-4">
              <div className="min-w-0 flex-1">
                <p className="font-medium text-sm">
                  {formatDateRange(blackout.startDate, blackout.endDate)}
                </p>
                <p className="truncate text-muted-foreground text-sm">
                  {blackout.days} {blackout.days === 1 ? "dag" : "dager"}
                  {blackout.reason ? ` · ${blackout.reason}` : ""}
                </p>
              </div>

              <ConfirmDelete
                label="Åpne dagene igjen"
                title="Åpne dagene igjen?"
                description={`${formatDateRange(blackout.startDate, blackout.endDate)} blir tilgjengelig for booking med én gang.`}
                confirmLabel="Åpne igjen"
                onConfirm={() => onRemove(blackout)}
              />
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
