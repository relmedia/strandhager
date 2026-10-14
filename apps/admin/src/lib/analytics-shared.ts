// Types and pure helpers shared between server analytics queries and client
// components. Must stay free of server-only imports.

export type AnalyticsRange = "last-7-days" | "last-4-weeks" | "last-3-months" | "year-to-date";

export const RANGE_LABELS: Record<AnalyticsRange, string> = {
  "last-7-days": "siste 7 dager",
  "last-4-weeks": "siste 4 uker",
  "last-3-months": "siste 3 måneder",
  "year-to-date": "hittil i år",
};

export type KpiDatum = {
  title: string;
  value: string;
  change: number | null; // relative change vs previous period, e.g. 0.028
  previous: string | null;
  periodLabel: string;
};

export type TopPageRow = {
  path: string;
  views: number;
  visitors: number;
  share: number; // fraction of all pageviews
};

export type SourceRow = {
  source: string;
  visitors: number;
};

export type DailyPoint = {
  date: string; // ISO date
  pageviews: number;
  visitors: number;
};

export type RealtimePoint = {
  minute: string; // HH:mm label
  visitors: number;
};

export type CountryRow = {
  code: string; // ISO 3166-1 alpha-2
  name: string; // Norwegian display name
  visitors: number;
  share: number; // fraction of visitors with a known country
};

export type CityRow = {
  city: string;
  countryCode: string | null;
  visitors: number;
};

export type AnalyticsData = {
  kpis: KpiDatum[];
  daily: DailyPoint[];
  topPages: TopPageRow[];
  sources: SourceRow[];
  referrers: SourceRow[];
  countries: CountryRow[];
  cities: CityRow[];
  realtime: { points: RealtimePoint[]; visitors: number };
  periodLabel: string;
};

const compactFormatter = new Intl.NumberFormat("nb-NO", { notation: "compact", maximumFractionDigits: 1 });

export function formatCount(value: number): string {
  return compactFormatter.format(value);
}

export function parseAnalyticsRange(value: string | undefined): AnalyticsRange {
  if (value === "last-7-days" || value === "last-3-months" || value === "year-to-date") return value;
  return "last-4-weeks";
}
