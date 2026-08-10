"use client";

import { RefreshCw } from "lucide-react";

import { RevenueChart } from "@/components/dashboard/revenue-chart";
import { StatCards } from "@/components/dashboard/stat-cards";
import { StatusChart } from "@/components/dashboard/status-chart";
import { UpcomingBookings } from "@/components/dashboard/upcoming-bookings";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useDashboard } from "@/hooks/use-dashboard";

export function DashboardOverview() {
  const { data, counts, loading, error, reload } = useDashboard();

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="h-32 w-full" />
          ))}
        </div>
        <div className="grid gap-4 xl:grid-cols-3">
          <Skeleton className="h-96 w-full xl:col-span-2" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error ? (
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-destructive text-sm">
          <span className="flex-1">{error}</span>
          <Button variant="outline" size="sm" onClick={() => void reload()}>
            <RefreshCw className="size-4" />
            Prøv igjen
          </Button>
        </div>
      ) : null}

      <StatCards data={data} />

      <div className="grid gap-4 xl:grid-cols-3">
        <RevenueChart months={data.months} />
        <StatusChart counts={counts} />
      </div>

      <UpcomingBookings bookings={data.upcoming} />
    </div>
  );
}
