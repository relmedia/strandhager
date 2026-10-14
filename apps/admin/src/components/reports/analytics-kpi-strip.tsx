import { ArrowDownRight, ArrowUpRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { KpiDatum } from "@/lib/analytics-shared";

function ChangeBadge({ change }: { change: number | null }) {
  if (change === null) return null;

  const percent = `${Math.abs(change * 100).toLocaleString("nb-NO", { maximumFractionDigits: 1 })} %`;

  if (change < 0) {
    return (
      <Badge className="bg-destructive/10 text-destructive">
        <ArrowDownRight />
        {percent}
      </Badge>
    );
  }

  return (
    <Badge className="bg-green-500/10 text-green-700 dark:bg-green-500/15 dark:text-green-300">
      <ArrowUpRight />
      {percent}
    </Badge>
  );
}

export function AnalyticsKpiStrip({ kpis }: { kpis: KpiDatum[] }) {
  return (
    <div className="overflow-hidden rounded-xl bg-card shadow-xs ring-1 ring-foreground/10">
      <div className="grid divide-y *:data-[slot=card]:rounded-none *:data-[slot=card]:ring-0 md:grid-cols-2 md:divide-x md:divide-y-0 xl:grid-cols-5">
        {kpis.map((kpi) => (
          <Card key={kpi.title}>
            <CardHeader>
              <CardTitle className="font-normal text-sm">{kpi.title}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex items-center justify-between gap-4">
                <div className="text-2xl leading-none tracking-tight">{kpi.value}</div>
                <ChangeBadge change={kpi.change} />
              </div>

              <div className="flex items-center gap-2 text-muted-foreground text-xs">
                {kpi.previous !== null && (
                  <>
                    <span>
                      fra <span className="text-foreground">{kpi.previous}</span>
                    </span>
                    <span>•</span>
                  </>
                )}
                <span>{kpi.periodLabel}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
