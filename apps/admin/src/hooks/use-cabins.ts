"use client";

import { useEffect, useState } from "react";

import { apiFetch } from "@/lib/api";

export type Cabin = {
  id: string;
  name: string;
  slug: string;
  maxGuests?: number;
  active?: boolean;
};

export function useCabins() {
  const [data, setData] = useState<Cabin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    apiFetch<Cabin[]>("/cabins")
      .then((cabins) => {
        if (active) setData(cabins);
      })
      .catch((err: unknown) => {
        if (active) setError(err instanceof Error ? err.message : "Failed to load cabins");
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
