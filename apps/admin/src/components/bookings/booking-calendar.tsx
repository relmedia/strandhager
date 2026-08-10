"use client";

import { useMemo, useState } from "react";

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { STATUS_LABELS } from "@/components/bookings/status-badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useBookings } from "@/hooks/use-bookings";
import {
  addMonths,
  eachDay,
  endOfMonth,
  formatMonth,
  isoWeekday,
  startOfMonth,
  todayString,
} from "@/lib/dates";
import { formatMoney } from "@/lib/format";
import type { Booking, BookingStatus } from "@/types/booking";

const WEEKDAYS = ["Man", "Tir", "Ons", "Tor", "Fre", "Lør", "Søn"];

/** Only bookings that actually hold a date are worth drawing. */
const SHOWN: BookingStatus[] = ["PENDING", "CONFIRMED", "COMPLETED"];

const CHIP_STYLES: Record<BookingStatus, string> = {
  PENDING: "bg-amber-100 text-amber-900 dark:bg-amber-500/20 dark:text-amber-200",
  CONFIRMED:
    "bg-emerald-100 text-emerald-900 dark:bg-emerald-500/20 dark:text-emerald-200",
  COMPLETED: "bg-sky-100 text-sky-900 dark:bg-sky-500/20 dark:text-sky-200",
  DECLINED: "bg-muted text-muted-foreground",
  CANCELLED: "bg-muted text-muted-foreground",
};

export function BookingCalendar() {
  const [month, setMonth] = useState(() => startOfMonth(todayString()));

  const range = useMemo(
    () => ({ from: month, to: endOfMonth(month) }),
    [month],
  );

  const { data, loading, error } = useBookings(range);

  /** One entry per day, so a multi-day booking shows on each of its days. */
  const byDay = useMemo(() => {
    const map = new Map<string, Booking[]>();

    for (const booking of data) {
      if (!SHOWN.includes(booking.status)) continue;

      for (const day of eachDay(booking.startDate, booking.endDate)) {
        const existing = map.get(day);
        if (existing) existing.push(booking);
        else map.set(day, [booking]);
      }
    }

    return map;
  }, [data]);

  const days = useMemo(() => eachDay(month, endOfMonth(month)), [month]);
  const today = todayString();
  const leadingBlanks = isoWeekday(month) - 1;

  return (
    <div className="space-y-4">
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
        <Skeleton className="h-[32rem] w-full" />
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
              <div key={`blank-${index}`} className="min-h-24 border-r border-b bg-muted/20" />
            ))}

            {days.map((day) => (
              <DayCell
                key={day}
                day={day}
                today={today}
                bookings={byDay.get(day) ?? []}
              />
            ))}
          </div>
        </div>
      )}

      <ul className="flex flex-wrap gap-x-5 gap-y-2 text-muted-foreground text-xs">
        {SHOWN.map((status) => (
          <li key={status} className="flex items-center gap-2">
            <span className={`size-3 rounded-[3px] ${CHIP_STYLES[status]}`} aria-hidden />
            {STATUS_LABELS[status]}
          </li>
        ))}
      </ul>
    </div>
  );
}

function DayCell({
  day,
  today,
  bookings,
}: {
  day: string;
  today: string;
  bookings: Booking[];
}) {
  const isToday = day === today;

  return (
    <div className="min-h-24 space-y-1 border-r border-b p-1.5 last:border-r-0">
      <span
        className={`inline-grid size-6 place-items-center rounded-full text-xs ${
          isToday ? "bg-primary font-medium text-primary-foreground" : "text-muted-foreground"
        }`}
      >
        {Number(day.slice(8))}
      </span>

      {bookings.map((booking) => (
        <Link
          key={booking.id}
          href={`/bokningar/${booking.id}`}
          title={`${booking.guest.firstName} ${booking.guest.lastName} · ${booking.guests} personer · ${formatMoney(booking.total)}`}
          className={`block truncate rounded px-1.5 py-1 text-xs transition-opacity hover:opacity-80 ${CHIP_STYLES[booking.status]}`}
        >
          {booking.guest.lastName || booking.guest.firstName}
        </Link>
      ))}
    </div>
  );
}
