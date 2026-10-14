import {
  type AnalyticsData,
  type AnalyticsRange,
  type CityRow,
  type CountryRow,
  type KpiDatum,
  RANGE_LABELS,
  type RealtimePoint,
  type SourceRow,
  type TopPageRow,
  formatCount,
} from "@/lib/analytics-shared";
import { apiFetch } from "@/lib/api";

type Summary = { pageviews: number; visitors: number; sessions: number; engagedSessions: number };

/** The raw figures from GET /analytics; everything shown is derived here. */
type AnalyticsReport = {
  summary: Summary;
  previous: Summary;
  daily: { date: string; pageviews: number; visitors: number }[];
  topPages: { path: string; views: number; visitors: number }[];
  referrers: { referrer: string | null; visitors: number; views: number }[];
  realtime: {
    windowMinutes: number;
    points: { minute: string; visitors: number }[];
    visitors: number;
  };
  countries: { code: string; visitors: number }[];
  cities: { city: string; countryCode: string | null; visitors: number }[];
  bookings: number;
  previousBookings: number;
};

const countryNames = new Intl.DisplayNames(["nb"], { type: "region" });

function countryDisplayName(code: string): string {
  try {
    return countryNames.of(code) ?? code;
  } catch {
    return code;
  }
}

const SEARCH_PATTERN = /google|bing|duckduckgo|ecosia|yahoo|qwant|startpage|kvasir/i;
const SOCIAL_PATTERN =
  /facebook|instagram|linkedin|t\.co|twitter|x\.com|pinterest|tiktok|youtube|snapchat|reddit|threads/i;

function formatPercent(value: number): string {
  return `${(value * 100).toLocaleString("nb-NO", { maximumFractionDigits: 1 })} %`;
}

function relativeChange(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return (current - previous) / previous;
}

function categorizeSources(referrers: AnalyticsReport["referrers"]): SourceRow[] {
  const buckets = new Map<string, number>([
    ["Direkte", 0],
    ["Søk", 0],
    ["Sosiale medier", 0],
    ["Henvisning", 0],
  ]);

  for (const row of referrers) {
    let bucket = "Henvisning";
    if (row.referrer === null) bucket = "Direkte";
    else if (SEARCH_PATTERN.test(row.referrer)) bucket = "Søk";
    else if (SOCIAL_PATTERN.test(row.referrer)) bucket = "Sosiale medier";
    buckets.set(bucket, (buckets.get(bucket) ?? 0) + row.visitors);
  }

  return [...buckets.entries()]
    .map(([source, visitors]) => ({ source, visitors }))
    .filter((row) => row.visitors > 0)
    .sort((a, b) => b.visitors - a.visitors);
}

/** One bar per minute, oldest first, with empty minutes filled in. */
function fillRealtimeSeries(realtime: AnalyticsReport["realtime"]): RealtimePoint[] {
  const byMinute = new Map(
    realtime.points.map((point) => [new Date(point.minute).getTime(), point.visitors]),
  );
  const points: RealtimePoint[] = [];
  const now = Date.now();

  for (let i = realtime.windowMinutes - 1; i >= 0; i--) {
    const stamp = new Date(now - i * 60_000);
    stamp.setSeconds(0, 0);
    const label = stamp.toLocaleTimeString("nb-NO", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Europe/Oslo",
    });
    points.push({ minute: label, visitors: byMinute.get(stamp.getTime()) ?? 0 });
  }

  return points;
}

export async function getAnalytics(range: AnalyticsRange): Promise<AnalyticsData> {
  const report = await apiFetch<AnalyticsReport>("/analytics", {
    searchParams: { range },
    cache: "no-store",
  });
  const { summary, previous, bookings, previousBookings } = report;
  const periodLabel = RANGE_LABELS[range];

  const engagementRate = summary.sessions > 0 ? summary.engagedSessions / summary.sessions : 0;
  const prevEngagementRate =
    previous.sessions > 0 ? previous.engagedSessions / previous.sessions : 0;
  const conversionRate = summary.sessions > 0 ? bookings / summary.sessions : 0;
  const prevConversionRate = previous.sessions > 0 ? previousBookings / previous.sessions : 0;

  const countKpi = (title: string, key: keyof Summary): KpiDatum => ({
    title,
    value: formatCount(summary[key]),
    change: relativeChange(summary[key], previous[key]),
    previous: previous[key] > 0 ? formatCount(previous[key]) : null,
    periodLabel,
  });

  const kpis: KpiDatum[] = [
    countKpi("Unike besøkende", "visitors"),
    countKpi("Økter", "sessions"),
    countKpi("Sidevisninger", "pageviews"),
    {
      title: "Engasjement",
      value: formatPercent(engagementRate),
      change: relativeChange(engagementRate, prevEngagementRate),
      previous: prevEngagementRate > 0 ? formatPercent(prevEngagementRate) : null,
      periodLabel,
    },
    {
      title: "Bookinger",
      value: String(bookings),
      change: relativeChange(bookings, previousBookings),
      previous:
        previousBookings > 0 ? `${previousBookings} (${formatPercent(prevConversionRate)})` : null,
      periodLabel: `${formatPercent(conversionRate)} av økter · ${periodLabel}`,
    },
  ];

  const topPages: TopPageRow[] = report.topPages.map((row) => ({
    ...row,
    share: summary.pageviews > 0 ? row.views / summary.pageviews : 0,
  }));

  const referrers: SourceRow[] = report.referrers
    .filter((row) => row.referrer !== null)
    .slice(0, 5)
    .map((row) => ({ source: row.referrer as string, visitors: row.visitors }));

  const countryTotal = report.countries.reduce((sum, row) => sum + row.visitors, 0);
  const countries: CountryRow[] = report.countries.map((row) => ({
    code: row.code,
    name: countryDisplayName(row.code),
    visitors: row.visitors,
    share: countryTotal > 0 ? row.visitors / countryTotal : 0,
  }));

  const cities: CityRow[] = report.cities;

  return {
    kpis,
    daily: report.daily,
    topPages,
    sources: categorizeSources(report.referrers),
    referrers,
    countries,
    cities,
    realtime: {
      points: fillRealtimeSeries(report.realtime),
      visitors: report.realtime.visitors,
    },
    periodLabel,
  };
}
