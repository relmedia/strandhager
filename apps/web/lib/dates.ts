/**
 * Whole calendar days as plain YYYY-MM-DD strings, matching how the booking
 * API talks about dates. Everything is computed in UTC so a date never shifts
 * a day when the visitor is in another time zone.
 */

export type IsoDate = string;

const osloDate = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Europe/Oslo",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export function parseIsoDate(date: IsoDate): Date {
  return new Date(`${date}T00:00:00.000Z`);
}

export function toIsoDate(date: Date): IsoDate {
  return date.toISOString().slice(0, 10);
}

export function todayIso(): IsoDate {
  return osloDate.format(new Date());
}

export function addDays(date: IsoDate, days: number): IsoDate {
  const next = parseIsoDate(date);
  next.setUTCDate(next.getUTCDate() + days);
  return toIsoDate(next);
}

export function daysBetween(from: IsoDate, to: IsoDate): number {
  return Math.round((parseIsoDate(to).getTime() - parseIsoDate(from).getTime()) / 86_400_000);
}

export function eachDay(start: IsoDate, end: IsoDate): IsoDate[] {
  const days: IsoDate[] = [];
  for (let day = start; daysBetween(day, end) >= 0; day = addDays(day, 1)) {
    days.push(day);
  }
  return days;
}

/** 1 is Monday through 7 is Sunday. */
export function isoWeekday(date: IsoDate): number {
  return parseIsoDate(date).getUTCDay() || 7;
}

/** The first of the month a date falls in, e.g. "2026-08-17" to "2026-08-01". */
export function startOfMonth(date: IsoDate): IsoDate {
  return `${date.slice(0, 7)}-01`;
}

export function addMonths(date: IsoDate, months: number): IsoDate {
  const next = parseIsoDate(startOfMonth(date));
  next.setUTCMonth(next.getUTCMonth() + months);
  return toIsoDate(next);
}

export function endOfMonth(date: IsoDate): IsoDate {
  return addDays(addMonths(date, 1), -1);
}

const monthLabel = new Intl.DateTimeFormat("nb-NO", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

const dayLabel = new Intl.DateTimeFormat("nb-NO", {
  day: "numeric",
  month: "long",
  timeZone: "UTC",
});

const fullLabel = new Intl.DateTimeFormat("nb-NO", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

export function formatMonth(date: IsoDate): string {
  return monthLabel.format(parseIsoDate(date));
}

export function formatDay(date: IsoDate): string {
  return dayLabel.format(parseIsoDate(date));
}

export function formatFullDay(date: IsoDate): string {
  return fullLabel.format(parseIsoDate(date));
}

/** "12. august 2026" for one day, "12.–14. august 2026" for a range. */
export function formatRange(start: IsoDate, end: IsoDate): string {
  if (start === end) return fullLabel.format(parseIsoDate(start));
  return `${formatDay(start)} – ${formatDay(end)} ${end.slice(0, 4)}`;
}

const currency = new Intl.NumberFormat("nb-NO", {
  style: "currency",
  currency: "NOK",
  maximumFractionDigits: 0,
});

export function formatPrice(amount: number): string {
  return currency.format(amount);
}
