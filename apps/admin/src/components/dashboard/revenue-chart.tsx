"use client";

import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { formatCompactMoney, formatMoney } from "@/lib/format";
import type { MonthPoint } from "@/lib/stats";

// The preset chart palette is greyscale, so the bars borrow the theme accent.
const config = {
  revenue: { label: "Inntekt", color: "var(--primary)" },
} satisfies ChartConfig;

export function RevenueChart({ months }: { months: MonthPoint[] }) {
  const total = months.reduce((sum, point) => sum + point.revenue, 0);

  return (
    <Card className="xl:col-span-2">
      <CardHeader>
        <CardTitle>Inntekt per måned</CardTitle>
        <CardDescription>
          Bekreftede og gjennomførte leier, plassert i måneden de starter.
          {total > 0 ? ` Til sammen ${formatMoney(total)} i perioden.` : ""}
        </CardDescription>
      </CardHeader>

      <CardContent>
        <ChartContainer config={config} className="aspect-auto h-64 w-full">
          <BarChart data={months} margin={{ left: 4, right: 4, top: 8 }}>
            <CartesianGrid vertical={false} />

            <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} />

            <YAxis
              tickLine={false}
              axisLine={false}
              width={44}
              tickFormatter={(value: number) => formatCompactMoney(value)}
            />

            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  labelFormatter={(_, payload) => monthTitle(payload)}
                  formatter={(value) => (
                    <span className="tabular-nums">{formatMoney(Number(value))}</span>
                  )}
                />
              }
            />

            <Bar dataKey="revenue" radius={4}>
              {months.map((point) => (
                <Cell
                  key={point.month}
                  fill="var(--color-revenue)"
                  // Months still to come are already booked but not yet earned.
                  fillOpacity={point.future ? 0.35 : 1}
                />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>

        {months.some((point) => point.future && point.revenue > 0) ? (
          <p className="mt-3 flex items-center gap-2 text-muted-foreground text-xs">
            <span
              className="size-3 rounded-[3px] bg-[var(--color-revenue)] opacity-35"
              aria-hidden
            />
            Lyse søyler er måneder som ikke har vært ennå
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}

/** Recharts hands the tooltip the whole row, so the month and days come along. */
function monthTitle(payload: readonly { payload?: MonthPoint }[] | undefined): string {
  const point = payload?.[0]?.payload;
  if (!point) return "";

  const days = point.days === 1 ? "1 dag" : `${point.days} dager`;
  return `${point.label} ${point.month.slice(0, 4)} · ${days}`;
}
