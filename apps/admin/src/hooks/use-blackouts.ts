"use client";

import { useCallback, useEffect, useState } from "react";

import { createBlackout, deleteBlackout, listBlackouts } from "@/lib/booking";
import type { Blackout, NewBlackout } from "@/types/booking";

function message(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

/**
 * Every closure for a space from `from` onwards. Kept whole rather than per
 * month, so paging the calendar does not refetch.
 */
export function useBlackouts(space: string, from?: string) {
  const [data, setData] = useState<Blackout[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      setData(await listBlackouts(space, from));
    } catch (cause) {
      setError(message(cause, "Klarte ikke å hente stengte dager"));
    } finally {
      setLoading(false);
    }
  }, [space, from]);

  useEffect(() => {
    void load();
  }, [load]);

  /** Both return the error text, or null when the change went through. */
  const add = useCallback(
    async (input: Omit<NewBlackout, "space">): Promise<string | null> => {
      setSaving(true);
      try {
        const created = await createBlackout({ ...input, space });
        setData((current) =>
          [...current, created].sort((a, b) => a.startDate.localeCompare(b.startDate)),
        );
        return null;
      } catch (cause) {
        return message(cause, "Klarte ikke å stenge dagene");
      } finally {
        setSaving(false);
      }
    },
    [space],
  );

  const remove = useCallback(async (id: string): Promise<string | null> => {
    setSaving(true);
    try {
      await deleteBlackout(id);
      setData((current) => current.filter((blackout) => blackout.id !== id));
      return null;
    } catch (cause) {
      return message(cause, "Klarte ikke å åpne dagene igjen");
    } finally {
      setSaving(false);
    }
  }, []);

  return { data, loading, error, saving, add, remove, reload: load };
}
