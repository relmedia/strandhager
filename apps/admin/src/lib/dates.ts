/** Day arithmetic on plain YYYY-MM-DD strings, computed in UTC. */

export function parseDate(date: string): Date {
  return new Date(`${date}T00:00:00.000Z`);
}

export function toDateString(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function todayString(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Oslo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export function addDays(date: string, days: number): string {
  const next = parseDate(date);
  next.setUTCDate(next.getUTCDate() + days);
  return toDateString(next);
}

export function daysBetween(from: string, to: string): number {
  return Math.round((parseDate(to).getTime() - parseDate(from).getTime()) / 86_400_000);
}

export function eachDay(start: string, end: string): string[] {
  const days: string[] = [];
  for (let day = start; daysBetween(day, end) >= 0; day = addDays(day, 1)) {
    days.push(day);
  }
  return days;
}

/** 1 is Monday through 7 is Sunday. */
export function isoWeekday(date: string): number {
  return parseDate(date).getUTCDay() || 7;
}

export function startOfMonth(date: string): string {
  return `${date.slice(0, 7)}-01`;
}

export function addMonths(date: string, months: number): string {
  const next = parseDate(startOfMonth(date));
  next.setUTCMonth(next.getUTCMonth() + months);
  return toDateString(next);
}

export function endOfMonth(date: string): string {
  return addDays(addMonths(date, 1), -1);
}

export function formatMonth(date: string): string {
  return new Intl.DateTimeFormat("nb-NO", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(parseDate(date));
}
