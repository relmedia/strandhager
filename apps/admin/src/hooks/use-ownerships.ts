"use client";

import { useCallback, useEffect, useState } from "react";

import {
  createOwnership,
  deleteOwnership,
  listOwnerships,
  updateOwnership,
} from "@/lib/parcel";
import type { Ownership, OwnershipInput, OwnershipUpdate } from "@/types/parcel";

function message(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

/**
 * Everyone who has owned one plot. The whole list is reloaded after a change
 * because ending one spell can start another, and the order depends on dates.
 */
export function useOwnerships(parcelId: string | null) {
  const [data, setData] = useState<Ownership[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!parcelId) {
      setData([]);
      return;
    }

    setLoading(true);
    try {
      setData(await listOwnerships(parcelId));
      setError(null);
    } catch (cause) {
      setError(message(cause, "Klarte ikke å hente historikken"));
    } finally {
      setLoading(false);
    }
  }, [parcelId]);

  useEffect(() => {
    void load();
  }, [load]);

  const add = useCallback(
    async (input: OwnershipInput): Promise<string | null> => {
      if (!parcelId) return null;

      setSaving(true);
      try {
        await createOwnership(parcelId, input);
        await load();
        return null;
      } catch (cause) {
        return message(cause, "Klarte ikke å lagre eierperioden");
      } finally {
        setSaving(false);
      }
    },
    [parcelId, load],
  );

  const save = useCallback(
    async (id: string, patch: OwnershipUpdate): Promise<string | null> => {
      setSaving(true);
      try {
        await updateOwnership(id, patch);
        await load();
        return null;
      } catch (cause) {
        return message(cause, "Klarte ikke å lagre eierperioden");
      } finally {
        setSaving(false);
      }
    },
    [load],
  );

  const remove = useCallback(
    async (id: string): Promise<string | null> => {
      setSaving(true);
      try {
        await deleteOwnership(id);
        await load();
        return null;
      } catch (cause) {
        return message(cause, "Klarte ikke å fjerne eierperioden");
      } finally {
        setSaving(false);
      }
    },
    [load],
  );

  return { data, loading, saving, error, add, save, remove, reload: load };
}
