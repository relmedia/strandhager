"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { addMonths, todayString } from "@/lib/dates";
import { getBookingCounts, listBookings } from "@/lib/booking";
import { buildDashboard, type Dashboard } from "@/lib/stats";
import type { Booking, BookingCounts } from "@/types/booking";

const EMPTY_COUNTS: BookingCounts = {
  PENDING: 0,
  CONFIRMED: 0,
  DECLINED: 0,
  CANCELLED: 0,
  COMPLETED: 0,
};

/**
 * Everything the front page shows, from one pass over the bookings. The window
 * reaches back to the start of last year so this year can be held up against
 * it, and a year forward to cover what is already booked.
 */
export function useDashboard() {
  const today = todayString();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [counts, setCounts] = useState<BookingCounts>(EMPTY_COUNTS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [list, summary] = await Promise.all([
        listBookings({
          from: `${Number(today.slice(0, 4)) - 1}-01-01`,
          to: addMonths(today, 12),
          take: 500,
        }),
        getBookingCounts(),
      ]);
      setBookings(list);
      setCounts(summary);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Klarte ikke å hente tallene");
    } finally {
      setLoading(false);
    }
  }, [today]);

  useEffect(() => {
    void load();
  }, [load]);

  const data: Dashboard = useMemo(
    () => buildDashboard(bookings, today),
    [bookings, today],
  );

  return { data, counts, loading, error, reload: load };
}
