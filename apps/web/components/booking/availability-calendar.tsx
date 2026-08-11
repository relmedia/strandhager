"use client";

import { useMemo } from "react";

import { ChevronLeft, ChevronRight } from "lucide-react";

import { WEEKDAY_INITIALS, type Availability } from "@/lib/booking";
import {
  addDays,
  addMonths,
  daysBetween,
  eachDay,
  endOfMonth,
  formatFullDay,
  formatMonth,
  isoWeekday,
  startOfMonth,
  type IsoDate,
} from "@/lib/dates";

export type Selection = { start: IsoDate; end: IsoDate | null };

type CalendarProps = {
  month: IsoDate;
  onMonthChange: (month: IsoDate) => void;
  availability: Availability | null;
  selection: Selection | null;
  onSelect: (date: IsoDate) => void;
  /** How many months of calendar exist, counted from the current month. */
  monthsAhead: number;
  /** The longest range that may be picked, in days. */
  maxDays: number;
};

export function AvailabilityCalendar({
  month,
  onMonthChange,
  availability,
  selection,
  onSelect,
  monthsAhead,
  maxDays,
}: CalendarProps) {
  const firstMonth = startOfMonth(availability?.minDate ?? month);
  const lastMonth = addMonths(firstMonth, monthsAhead - 1);

  const canGoBack = daysBetween(firstMonth, month) > 0;
  const canGoForward = daysBetween(month, lastMonth) > 0;

  return (
    <div>
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => onMonthChange(addMonths(month, -1))}
          disabled={!canGoBack}
          aria-label="Forrige måned"
          className="grid size-9 place-items-center rounded-full text-ink-muted transition-colors hover:bg-ink/5 hover:text-ink disabled:pointer-events-none disabled:opacity-30"
        >
          <ChevronLeft className="size-4" strokeWidth={1.75} />
        </button>

        <p
          aria-live="polite"
          className="font-display text-ink text-lg capitalize md:text-xl"
        >
          {formatMonth(month)}
        </p>

        <button
          type="button"
          onClick={() => onMonthChange(addMonths(month, 1))}
          disabled={!canGoForward}
          aria-label="Neste måned"
          className="grid size-9 place-items-center rounded-full text-ink-muted transition-colors hover:bg-ink/5 hover:text-ink disabled:pointer-events-none disabled:opacity-30"
        >
          <ChevronRight className="size-4" strokeWidth={1.75} />
        </button>
      </div>

      <MonthGrid
        month={month}
        availability={availability}
        selection={selection}
        onSelect={onSelect}
        maxDays={maxDays}
      />

      <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-ink-muted text-xs">
        <Legend className="bg-white ring-1 ring-ink/15">Ledig</Legend>
        <Legend className="bg-brand">Valgt</Legend>
        <Legend className="bg-ink/10">Opptatt</Legend>
        <Legend className="border border-ink/30 border-dashed">Stengt</Legend>
      </ul>
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

type DayState =
  | "loading"
  | "available"
  | "booked"
  /** Shut by the owners, for a holiday or maintenance. */
  | "blocked"
  /** A weekday with no price, so it is never on offer. */
  | "closed"
  | "past"
  /** Too far from the chosen start day: the range would exceed the limit. */
  | "tooFar"
  | "selected"
  | "edge";

function MonthGrid({
  month,
  availability,
  selection,
  onSelect,
  maxDays,
}: Pick<
  CalendarProps,
  "month" | "availability" | "selection" | "onSelect" | "maxDays"
>) {
  const days = useMemo(() => eachDay(month, endOfMonth(month)), [month]);
  const booked = useMemo(
    () => new Set(availability?.bookedDates ?? []),
    [availability],
  );
  const closedWeekdays = useMemo(
    () => new Set(availability?.closedWeekdays ?? []),
    [availability],
  );
  const closedDates = useMemo(
    () => new Set(availability?.closedDates ?? []),
    [availability],
  );

  // Monday-first grid, so a month starting on Wednesday needs two blanks.
  const leadingBlanks = isoWeekday(month) - 1;

  return (
    <>
      <div className="mt-5 grid grid-cols-7 gap-1 text-center">
        {WEEKDAY_INITIALS.map((initial, index) => (
          <abbr
            key={index}
            title={
              ["Mandag", "Tirsdag", "Onsdag", "Torsdag", "Fredag", "Lørdag", "Søndag"][
                index
              ]
            }
            className="pb-2 font-medium text-[0.7rem] text-ink-muted/70 uppercase tracking-wider no-underline"
          >
            {initial}
          </abbr>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: leadingBlanks }, (_, index) => (
          <span key={`blank-${index}`} aria-hidden />
        ))}

        {days.map((date) => (
          <DayCell
            key={date}
            date={date}
            state={dayState(
              date,
              availability,
              booked,
              closedWeekdays,
              closedDates,
              selection,
              maxDays,
            )}
            onSelect={onSelect}
            maxDays={maxDays}
          />
        ))}
      </div>
    </>
  );
}

function dayState(
  date: IsoDate,
  availability: Availability | null,
  booked: Set<IsoDate>,
  closedWeekdays: Set<number>,
  closedDates: Set<IsoDate>,
  selection: Selection | null,
  maxDays: number,
): DayState {
  // Until the booked days are known, no day may be picked: an already taken
  // day would otherwise look free for as long as the request takes.
  if (!availability) return "loading";

  if (selection) {
    const end = selection.end ?? selection.start;
    if (date === selection.start || date === end) return "edge";
    if (daysBetween(selection.start, date) > 0 && daysBetween(date, end) > 0) {
      return "selected";
    }
  }

  if (booked.has(date)) return "booked";
  if (closedWeekdays.has(isoWeekday(date))) return "closed";
  // Whatever else the server has shut is a deliberate closure, and reads as
  // such rather than as a day that was never on offer.
  if (closedDates.has(date)) return "blocked";
  if (daysBetween(availability.minDate, date) < 0) return "past";

  // While the guest is picking an end day, everything past the longest
  // allowed range is off the table. Days before the start stay pickable,
  // since clicking one simply restarts the selection there.
  if (
    selection?.end === null &&
    daysBetween(selection.start, date) >= maxDays
  ) {
    return "tooFar";
  }

  return "available";
}

const CELL_STYLES: Record<DayState, string> = {
  loading: "animate-pulse bg-ink/5 text-transparent",
  available:
    "bg-white text-ink ring-1 ring-ink/10 hover:ring-brand hover:text-brand-deep",
  edge: "bg-brand-deep text-white ring-1 ring-brand-deep",
  selected: "bg-brand text-white ring-1 ring-brand",
  booked: "bg-ink/10 text-ink-muted/50 line-through",
  blocked: "border border-ink/25 border-dashed bg-transparent text-ink-muted/40",
  closed: "bg-transparent text-ink-muted/30",
  past: "bg-transparent text-ink-muted/30",
  tooFar: "bg-transparent text-ink-muted/30 ring-1 ring-ink/5",
};

const UNAVAILABLE: DayState[] = [
  "loading",
  "booked",
  "blocked",
  "closed",
  "past",
  "tooFar",
];

function DayCell({
  date,
  state,
  onSelect,
  maxDays,
}: {
  date: IsoDate;
  state: DayState;
  onSelect: (date: IsoDate) => void;
  maxDays: number;
}) {
  const disabled = UNAVAILABLE.includes(state);
  const label = formatFullDay(date);

  /** How each unavailable day is read out; anything else can simply be picked. */
  const hints: Partial<Record<DayState, string>> = {
    booked: "opptatt",
    blocked: "stengt",
    closed: "ikke til leie",
    past: "for tidlig å booke",
    tooFar: `utenfor grensen på ${maxDays} dager`,
  };

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onSelect(date)}
      aria-hidden={state === "loading"}
      aria-label={`${label} – ${hints[state] ?? "velg denne dagen"}`}
      aria-pressed={state === "edge" || state === "selected"}
      title={state === "tooFar" ? `Maks ${maxDays} dager per booking` : undefined}
      className={`aspect-square rounded-[4px] text-sm transition-all duration-150 disabled:cursor-not-allowed ${CELL_STYLES[state]}`}
    >
      {Number(date.slice(8))}
    </button>
  );
}

/** Extends or restarts the selection when a day is clicked. */
export function nextSelection(
  current: Selection | null,
  date: IsoDate,
  unavailable: Set<IsoDate>,
  maxDays: number,
): Selection {
  // Nothing chosen yet, or a complete range is being replaced.
  if (!current || current.end !== null) {
    return { start: date, end: null };
  }

  if (daysBetween(current.start, date) < 0) {
    return { start: date, end: null };
  }

  // Longer than the house rules allow; the calendar disables these days, so
  // this is only a backstop against stale state.
  if (daysBetween(current.start, date) >= maxDays) {
    return { start: date, end: null };
  }

  // A range may not jump over a day that is taken or shut.
  const spans = eachDay(addDays(current.start, 1), date);
  if (spans.some((day) => unavailable.has(day))) {
    return { start: date, end: null };
  }

  return { start: current.start, end: date };
}
