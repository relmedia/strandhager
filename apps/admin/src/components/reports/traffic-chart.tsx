"use client";

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import type { DailyPoint } from "@/lib/analytics-shared";

const chartConfig = {
  pageviews: {
    color: "var(--chart-1)",
    label: "Sidevisninger",
  },
  visitors: {
    color: "var(--chart-3)",
    label: "Besøkende",
  },
} satisfies ChartConfig;

function formatDay(iso: string): string {
  return new Date(`${iso}T12:00:00`).toLocaleDateString("nb-NO", { day: "numeric", month: "short" });
}

export function TrafficChart({ data }: { data: DailyPoint[] }) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="font-normal">Besøk over tid</CardTitle>
      </CardHeader>

      <CardContent>
        <ChartContainer config={chartConfig} className="h-68 w-full">
          <AreaChart data={data} margin={{ bottom: 0, left: 0, right: 12, top: 4 }}>
            <defs>
              <linearGradient id="fillPageviews" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-pageviews)" stopOpacity={0.4} />
                <stop offset="95%" stopColor="var(--color-pageviews)" stopOpacity={0.05} />
              </linearGradient>
              <linearGradient id="fillVisitors" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-visitors)" stopOpacity={0.4} />
                <stop offset="95%" stopColor="var(--color-visitors)" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tickMargin={10}
              minTickGap={32}
              tickFormatter={formatDay}
            />
            <YAxis axisLine={false} allowDecimals={false} tickLine={false} tickMargin={10} width={34} />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent labelFormatter={(value) => formatDay(String(value))} indicator="line" />}
            />
            <Area
              dataKey="pageviews"
              fill="url(#fillPageviews)"
              stroke="var(--color-pageviews)"
              strokeWidth={2}
              type="monotone"
            />
            <Area
              dataKey="visitors"
              fill="url(#fillVisitors)"
              stroke="var(--color-visitors)"
              strokeWidth={2}
              type="monotone"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
