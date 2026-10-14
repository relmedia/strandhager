import { AnalyticsKpiStrip } from "@/components/reports/analytics-kpi-strip";
import { AnalyticsToolbar } from "@/components/reports/analytics-toolbar";
import { RealtimeVisitors } from "@/components/reports/realtime-visitors";
import { TopLocations } from "@/components/reports/top-locations";
import { TopPages } from "@/components/reports/top-pages";
import { TopTrafficSources } from "@/components/reports/top-traffic-sources";
import { TrafficChart } from "@/components/reports/traffic-chart";
import { getAnalytics } from "@/lib/analytics";
import { formatCount, parseAnalyticsRange } from "@/lib/analytics-shared";

// Country flag classes (flag:XX) used by the geography card.
import "@/styles/flag-icons/flags.css";

export default async function Page({ searchParams }: { searchParams: Promise<{ range?: string }> }) {
  const { range: rangeParam } = await searchParams;
  const range = parseAnalyticsRange(rangeParam);
  const analytics = await getAnalytics(range);

  const toChartData = (rows: { source: string; visitors: number }[]) =>
    rows.map((row) => ({ ...row, label: formatCount(row.visitors) }));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-2">
          <h1 className="font-semibold text-2xl tracking-tight">Rapporter</h1>
          <p className="text-muted-foreground text-sm">
            Trafikk, engasjement og bookinger på nettsiden samlet på ett sted.
          </p>
        </div>

        <AnalyticsToolbar />
      </div>

      <AnalyticsKpiStrip kpis={analytics.kpis} />

      <div className="grid grid-cols-1 items-stretch gap-4 xl:grid-cols-12">
        <div className="xl:col-span-7">
          <TrafficChart data={analytics.daily} />
        </div>
        <div className="xl:col-span-5">
          <RealtimeVisitors points={analytics.realtime.points} visitors={analytics.realtime.visitors} />
        </div>
      </div>

      <div className="grid grid-cols-1 items-stretch gap-4 xl:grid-cols-12">
        <div className="xl:col-span-7">
          <TopPages pages={analytics.topPages} />
        </div>
        <div className="xl:col-span-5 xl:col-start-8">
          <TopTrafficSources
            sources={toChartData(analytics.sources)}
            referrers={toChartData(analytics.referrers)}
          />
        </div>
      </div>

      <TopLocations countries={analytics.countries} cities={analytics.cities} />
    </div>
  );
}
