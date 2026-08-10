/**
 * Helpers for whole calendar days. Felleshuset is rented per day, so every date
 * in the booking domain is a plain YYYY-MM-DD with no time or offset attached.
 * Dates are held as UTC midnight internally, which is also how Postgres `date`
 * columns come back through Prisma.
 */

export type IsoDate = string;

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** The venue is in Norway, so "today" has to be Norwegian today, not UTC today. */
const osloDate = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Europe/Oslo',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

export function isIsoDate(value: unknown): value is IsoDate {
  if (typeof value !== 'string' || !ISO_DATE.test(value)) return false;
  // Rejects real-looking but impossible dates such as 2026-02-30.
  return toIsoDate(new Date(`${value}T00:00:00.000Z`)) === value;
}

export function parseIsoDate(value: IsoDate): Date {
  return new Date(`${value}T00:00:00.000Z`);
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

/** Whole days from `from` to `to`, negative when `to` comes first. */
export function daysBetween(from: IsoDate, to: IsoDate): number {
  const ms = parseIsoDate(to).getTime() - parseIsoDate(from).getTime();
  return Math.round(ms / 86_400_000);
}

/** Every day from `start` to `end`, both ends included. */
export function eachDay(start: IsoDate, end: IsoDate): IsoDate[] {
  const days: IsoDate[] = [];
  for (let day = start; daysBetween(day, end) >= 0; day = addDays(day, 1)) {
    days.push(day);
  }
  return days;
}

/** ISO weekday: 1 is Monday through 7 is Sunday, matching `Rate.weekdays`. */
export function isoWeekday(date: IsoDate): number {
  return parseIsoDate(date).getUTCDay() || 7;
}
