"use client";

import { useEffect, useState } from "react";

import { apiFetch } from "@/lib/api";

export type Guest = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
};

export function useGuests() {
  const [data, setData] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    apiFetch<Guest[]>("/guests")
      .then((guests) => {
        if (active) setData(guests);
      })
      .catch((err: unknown) => {
        if (active) setError(err instanceof Error ? err.message : "Failed to load guests");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return { data, loading, error };
}
