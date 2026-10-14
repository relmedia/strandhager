"use client";

import * as React from "react";

import { useRouter } from "next/navigation";

import { Bar, BarChart, type BarShapeProps, XAxis, YAxis } from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import type { RealtimePoint } from "@/lib/analytics-shared";

const REFRESH_INTERVAL_MS = 60_000;

const chartConfig = {
  visitors: {
    color: "var(--chart-3)",
    label: "Besøkende",
  },
} satisfies ChartConfig;

function RealtimeBarShape(props: BarShapeProps & { maxVisitors: number }) {
  const { height, maxVisitors, payload, width, x, y } = props;
  const barPayload = payload as RealtimePoint | undefined;
  const barHeightValue = Number(height);
  const barWidthValue = Number(width);
  const xValue = Number(x);
  const yValue = Number(y);
  const visitors = barPayload?.visitors ?? 0;
  const fill = "var(--color-visitors)";
  const fillOpacity = maxVisitors > 0 && visitors >= maxVisitors ? 0.95 : 0.4;
  const baselineFill = visitors === 0 ? "var(--destructive)" : fill;
  const baselineOpacity = visitors === 0 ? 1 : fillOpacity;
  const baselineY = yValue + barHeightValue - 2;
  const barGap = 4;
  const barHeight = Math.max(0, barHeightValue - barGap);

  return (
    <g>
      <rect
        x={xValue}
        y={baselineY}
        width={barWidthValue}
        height={2}
        rx={1}
        fill={baselineFill}
        fillOpacity={baselineOpacity}
      />
      {visitors > 0 && barHeight > 0 ? (
        <rect
          x={xValue}
          y={yValue}
          width={barWidthValue}
          height={barHeight}
          rx={2}
          fill={fill}
          fillOpacity={fillOpacity}
        />
      ) : null}
    </g>
  );
}

export function RealtimeVisitors({ points, visitors }: { points: RealtimePoint[]; visitors: number }) {
  const router = useRouter();

  React.useEffect(() => {
    const interval = setInterval(() => router.refresh(), REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [router]);

  const maxVisitors = Math.max(...points.map((point) => point.visitors), 0);
  const domainMax = Math.max(4, Math.ceil(maxVisitors * 1.1));

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="font-normal">Besøkende akkurat nå</CardTitle>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        <div className="flex items-end justify-between">
          <div className="flex items-baseline gap-1">
            <span className="text-2xl tabular-nums leading-none tracking-tight">{visitors}</span>
            <span className="text-muted-foreground text-sm">siste 30 min</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-green-500 opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-green-500" />
            </span>
            <span>Direkte</span>
          </div>
        </div>
        <ChartContainer config={chartConfig} className="h-36 w-full">
          <BarChart data={points} margin={{ bottom: 0, left: 0, right: 0, top: 0 }} barCategoryGap={3}>
            <XAxis dataKey="minute" hide />
            <YAxis hide domain={[0, domainMax]} />
            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
            <Bar
              dataKey="visitors"
              fill="var(--color-visitors)"
              shape={(props: BarShapeProps) => <RealtimeBarShape {...props} maxVisitors={maxVisitors} />}
            />
          </BarChart>
        </ChartContainer>
        <p className="text-muted-foreground text-xs">Unike besøkende per minutt. Oppdateres automatisk hvert minutt.</p>
      </CardContent>
    </Card>
  );
}
