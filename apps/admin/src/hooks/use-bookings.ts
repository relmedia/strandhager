"use client";

import { useCallback, useEffect, useState } from "react";

import {
  getBooking,
  getBookingCounts,
  listBookings,
  updateBooking,
} from "@/lib/booking";
import type {
  Booking,
  BookingCounts,
  BookingFilters,
  BookingUpdate,
} from "@/types/booking";

const EMPTY_COUNTS: BookingCounts = {
  PENDING: 0,
  CONFIRMED: 0,
  DECLINED: 0,
  CANCELLED: 0,
  COMPLETED: 0,
  REFUNDED: 0,
};

function message(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export function useBookings(filters: BookingFilters = {}) {
  const [data, setData] = useState<Booking[]>([]);
  const [counts, setCounts] = useState<BookingCounts>(EMPTY_COUNTS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters are recreated on every render, so depend on their contents.
  const { status, paymentStatus, from, to, q } = filters;

  const load = useCallback(async () => {
    setError(null);
    try {
      const [bookings, summary] = await Promise.all([
        listBookings({ status, paymentStatus, from, to, q: q || undefined }),
        getBookingCounts(),
      ]);
      setData(bookings);
      setCounts(summary);
    } catch (cause) {
      setError(message(cause, "Klarte ikke å hente bookingene"));
    } finally {
      setLoading(false);
    }
  }, [status, paymentStatus, from, to, q]);

  useEffect(() => {
    void load();
  }, [load]);

  return { data, counts, loading, error, reload: load };
}

export function useBooking(id: string) {
  const [data, setData] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      setData(await getBooking(id));
    } catch (cause) {
      setError(message(cause, "Klarte ikke å hente bookingen"));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  /** Applies a change and returns the error text, or null when it worked. */
  const save = useCallback(
    async (patch: BookingUpdate): Promise<string | null> => {
      setSaving(true);
      try {
        setData(await updateBooking(id, patch));
        return null;
      } catch (cause) {
        return message(cause, "Klarte ikke å lagre endringen");
      } finally {
        setSaving(false);
      }
    },
    [id],
  );

  return { data, loading, error, saving, save, reload: load };
}
