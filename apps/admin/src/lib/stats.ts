/**
 * Turns the raw booking list into the handful of numbers the dashboard shows.
 * Pure on purpose: everything here is derived from one fetch, so the figures
 * on screen can never disagree with each other.
 *
 * Dates are plain YYYY-MM-DD, which compare correctly as strings.
 */

import { addMonths, startOfMonth } from "@/lib/dates";
import type { Booking, BookingStatus } from "@/types/booking";

/** Bookings that count as income: agreed to, and not called off. */
const EARNING: BookingStatus[] = ["CONFIRMED", "COMPLETED"];

/** Bookings still holding a date, and so worth showing as what is coming up. */
const LIVE: BookingStatus[] = ["PENDING", "CONFIRMED"];

/** How much of the chart looks back at what has been, and forward at what is booked. */
const MONTHS_BACK = 8;
const MONTHS_AHEAD = 3;

const monthLabel = new Intl.DateTimeFormat("nb-NO", {
  month: "short",
  timeZone: "UTC",
});

export type MonthPoint = {
  /** YYYY-MM, used as the chart key. */
  month: string;
  label: string;
  revenue: number;
  days: number;
  /** Months that have not happened yet, drawn lighter. */
  future: boolean;
};

export type Dashboard = {
  /** Requests waiting for an answer. */
  pending: number;
  /** How long the oldest of them has been waiting, in days. */
  waitingDays: number | null;
  /** Confirmed and requested rentals from today on, soonest first. */
  upcoming: Booking[];
  upcomingValue: number;
  revenue: Comparison;
  days: Comparison;
  months: MonthPoint[];
  /** False when there is nothing to show yet, so the page can say so. */
  hasBookings: boolean;
};

/** A figure for this year so far, next to the same stretch of last year. */
export type Comparison = {
  value: number;
  previous: number;
  /** Percentage change, or null when last year gives nothing to compare with. */
  change: number | null;
};

export function buildDashboard(bookings: Booking[], today: string): Dashboard {
  const earning = bookings.filter((booking) => EARNING.includes(booking.status));

  const yearStart = `${today.slice(0, 4)}-01-01`;
  const lastYearStart = `${Number(today.slice(0, 4)) - 1}-01-01`;
  const sameDayLastYear = `${Number(today.slice(0, 4)) - 1}${today.slice(4)}`;

  const soFar = earning.filter((b) => within(b.startDate, yearStart, today));
  const lastYear = earning.filter((b) =>
    within(b.startDate, lastYearStart, sameDayLastYear),
  );

  const upcoming = bookings
    .filter((b) => LIVE.includes(b.status) && b.endDate >= today)
    .sort((a, b) => a.startDate.localeCompare(b.startDate));

  const waiting = upcoming.filter((b) => b.status === "PENDING");

  return {
    pending: waiting.length,
    waitingDays: waiting.length > 0 ? oldestWait(waiting) : null,
    upcoming,
    upcomingValue: upcoming
      .filter((b) => b.status === "CONFIRMED")
      .reduce((sum, b) => sum + b.total, 0),
    revenue: compare(sum(soFar, "total"), sum(lastYear, "total")),
    days: compare(sum(soFar, "days"), sum(lastYear, "days")),
    months: monthlyPoints(earning, today),
    hasBookings: bookings.length > 0,
  };
}

function monthlyPoints(earning: Booking[], today: string): MonthPoint[] {
  const thisMonth = startOfMonth(today);
  const points: MonthPoint[] = [];

  for (let offset = -MONTHS_BACK; offset <= MONTHS_AHEAD; offset++) {
    const first = addMonths(thisMonth, offset);
    const month = first.slice(0, 7);

    // A rental belongs to the month it starts in, which is how a single
    // invoice is thought about even when the days straddle a month end.
    const inMonth = earning.filter((booking) => booking.startDate.startsWith(month));

    points.push({
      month,
      label: monthLabel.format(new Date(`${first}T00:00:00.000Z`)).replace(".", ""),
      revenue: sum(inMonth, "total"),
      days: sum(inMonth, "days"),
      future: offset > 0,
    });
  }

  return points;
}

function compare(value: number, previous: number): Comparison {
  return {
    value,
    previous,
    // Growth from nothing is not a percentage anyone can act on.
    change: previous > 0 ? Math.round(((value - previous) / previous) * 100) : null,
  };
}

function sum(bookings: Booking[], field: "total" | "days"): number {
  return bookings.reduce((total, booking) => total + booking[field], 0);
}

function oldestWait(waiting: Booking[]): number {
  const oldest = waiting.reduce((first, booking) =>
    booking.createdAt < first.createdAt ? booking : first,
  );

  const ms = Date.now() - new Date(oldest.createdAt).getTime();
  return Math.max(0, Math.floor(ms / 86_400_000));
}

function within(date: string, from: string, to: string): boolean {
  return date >= from && date <= to;
}
