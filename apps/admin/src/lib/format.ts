/** Norwegian formatting for the dashboard, on plain YYYY-MM-DD dates. */

const UTC = { timeZone: "UTC" } as const;

const dayMonth = new Intl.DateTimeFormat("nb-NO", {
  day: "numeric",
  month: "short",
  ...UTC,
});

const fullDate = new Intl.DateTimeFormat("nb-NO", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
  ...UTC,
});

const shortDate = new Intl.DateTimeFormat("nb-NO", {
  day: "numeric",
  month: "short",
  year: "numeric",
  ...UTC,
});

const dateTime = new Intl.DateTimeFormat("nb-NO", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Oslo",
});

const money = new Intl.NumberFormat("nb-NO", {
  style: "currency",
  currency: "NOK",
  maximumFractionDigits: 0,
});

function asDate(date: string): Date {
  return new Date(`${date}T00:00:00.000Z`);
}

export function formatDate(date: string): string {
  return dayMonth.format(asDate(date));
}

export function formatFullDate(date: string): string {
  return fullDate.format(asDate(date));
}

/** "12. aug" for one day, "12. aug – 14. aug 2026" for a range. */
export function formatDateRange(start: string, end: string): string {
  const year = end.slice(0, 4);
  if (start === end) return `${formatDate(start)} ${year}`;
  return `${formatDate(start)} – ${formatDate(end)} ${year}`;
}

/** "12. mar. 2015", for dates where the year matters. */
export function formatShortDate(date: string): string {
  return shortDate.format(asDate(date));
}

/**
 * Roughly how long something lasted, as "5 år" or "8 md.". Meant for reading at
 * a glance beside the dates themselves, so it rounds rather than counting days.
 */
export function formatDuration(start: string, end: string | null): string {
  const from = asDate(start);
  const to = end ? asDate(end) : new Date();

  const months = Math.max(
    0,
    (to.getUTCFullYear() - from.getUTCFullYear()) * 12 +
      to.getUTCMonth() -
      from.getUTCMonth() -
      (to.getUTCDate() < from.getUTCDate() ? 1 : 0),
  );

  if (months < 1) return "under en måned";
  if (months < 12) return `${months} md.`;

  const years = Math.floor(months / 12);
  const rest = months % 12;

  return rest === 0 ? `${years} år` : `${years} år ${rest} md.`;
}

export function formatTimestamp(iso: string): string {
  return dateTime.format(new Date(iso));
}

export function formatMoney(amount: number): string {
  return money.format(amount);
}

/** "12 500" as "12,5k", for chart axes where the full figure will not fit. */
export function formatCompactMoney(amount: number): string {
  if (amount === 0) return "0";
  if (amount < 1000) return String(amount);
  return `${new Intl.NumberFormat("nb-NO", { maximumFractionDigits: 1 }).format(amount / 1000)}k`;
}
