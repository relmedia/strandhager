"use client";

import { useMemo } from "react";

import Link from "next/link";
import { Cell, Pie, PieChart } from "recharts";

import { STATUS_LABELS } from "@/components/bookings/status-badge";
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
import type { BookingCounts, BookingStatus } from "@/types/booking";

/**
 * The same colours as the status badges, written out because the theme's chart
 * palette is greyscale and would tell the statuses apart by nothing at all.
 */
const STATUS_COLORS: Record<BookingStatus, string> = {
  PENDING: "oklch(0.769 0.188 70.08)",
  CONFIRMED: "oklch(0.696 0.17 162.48)",
  COMPLETED: "oklch(0.685 0.169 237.323)",
  DECLINED: "var(--muted-foreground)",
  CANCELLED: "var(--border)",
};

const ORDER: BookingStatus[] = [
  "PENDING",
  "CONFIRMED",
  "COMPLETED",
  "CANCELLED",
  "DECLINED",
];

const config = Object.fromEntries(
  ORDER.map((status) => [status, { label: STATUS_LABELS[status] }]),
) satisfies ChartConfig;

export function StatusChart({ counts }: { counts: BookingCounts }) {
  const slices = useMemo(
    () =>
      ORDER.filter((status) => counts[status] > 0).map((status) => ({
        status,
        label: STATUS_LABELS[status],
        count: counts[status],
      })),
    [counts],
  );

  const total = slices.reduce((sum, slice) => sum + slice.count, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Alle bookinger</CardTitle>
        <CardDescription>Hvordan forespørslene har endt opp.</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {total === 0 ? (
          <p className="py-12 text-center text-muted-foreground text-sm">
            Ingen bookinger ennå.
          </p>
        ) : (
          <>
            <div className="relative mx-auto aspect-square h-48">
              <ChartContainer config={config} className="size-full">
                <PieChart>
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent nameKey="label" hideLabel />}
                  />

                  <Pie
                    data={slices}
                    dataKey="count"
                    nameKey="label"
                    innerRadius="62%"
                    strokeWidth={2}
                  >
                    {slices.map((slice) => (
                      <Cell
                        key={slice.status}
                        fill={STATUS_COLORS[slice.status]}
                        stroke="var(--card)"
                      />
                    ))}
                  </Pie>
                </PieChart>
              </ChartContainer>

              {/* Sits in the hole of the ring, which is always dead centre. */}
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-semibold text-2xl tabular-nums">{total}</span>
                <span className="text-muted-foreground text-xs">
                  {total === 1 ? "booking" : "bookinger"}
                </span>
              </div>
            </div>

            <ul className="space-y-1.5">
              {slices.map((slice) => (
                <li key={slice.status}>
                  <Link
                    href={`/bokningar?status=${slice.status}`}
                    className="-mx-2 flex items-center gap-2 rounded-md px-2 py-1 text-sm transition-colors hover:bg-accent"
                  >
                    <span
                      className="size-2.5 shrink-0 rounded-[3px]"
                      style={{ background: STATUS_COLORS[slice.status] }}
                      aria-hidden
                    />
                    <span className="flex-1 truncate text-muted-foreground">
                      {slice.label}
                    </span>
                    <span className="tabular-nums">{slice.count}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </CardContent>
    </Card>
  );
}
