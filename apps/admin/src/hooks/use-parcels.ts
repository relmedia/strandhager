"use client";

import { useCallback, useEffect, useState } from "react";

import {
  createParcel,
  createParcellant,
  createWaitlistEntry,
  deleteParcel,
  deleteParcellant,
  deleteWaitlistEntry,
  listParcellants,
  listParcels,
  listWaitlist,
  updateParcel,
  updateParcellant,
  updateWaitlistEntry,
} from "@/lib/parcel";
import type {
  Parcel,
  ParcelUpdate,
  Parcellant,
  ParcellantInput,
  WaitlistEntry,
  WaitlistInput,
  WaitlistUpdate,
} from "@/types/parcel";

function message(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

/**
 * The three lists behave identically: load once, then add, change or remove a
 * row and get back either nothing or the text explaining why it did not work.
 */
function useCollection<T extends { id: string }, TCreate, TUpdate>(
  fetchAll: () => Promise<T[]>,
  actions: {
    create: (input: TCreate) => Promise<T>;
    update: (id: string, patch: TUpdate) => Promise<T>;
    remove: (id: string) => Promise<unknown>;
  },
  sort: (a: T, b: T) => number,
  errors: { load: string; save: string; remove: string },
  /**
   * For lists where a row's contents depend on the other rows, such as a place
   * in a queue. Patching one row locally would leave the rest stale.
   */
  reloadAfterChange = false,
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      setData(await fetchAll());
    } catch (cause) {
      setError(message(cause, errors.load));
    } finally {
      setLoading(false);
    }
    // The callers pass literals, so depending on them would reload endlessly.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const add = useCallback(
    async (input: TCreate): Promise<string | null> => {
      setSaving(true);
      try {
        const created = await actions.create(input);
        if (reloadAfterChange) await load();
        else setData((current) => [...current, created].sort(sort));
        return null;
      } catch (cause) {
        return message(cause, errors.save);
      } finally {
        setSaving(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const save = useCallback(
    async (id: string, patch: TUpdate): Promise<string | null> => {
      setSaving(true);
      try {
        const updated = await actions.update(id, patch);
        if (reloadAfterChange) await load();
        else {
          setData((current) =>
            current.map((row) => (row.id === id ? updated : row)).sort(sort),
          );
        }
        return null;
      } catch (cause) {
        return message(cause, errors.save);
      } finally {
        setSaving(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const remove = useCallback(
    async (id: string): Promise<string | null> => {
      setSaving(true);
      try {
        await actions.remove(id);
        if (reloadAfterChange) await load();
        else setData((current) => current.filter((row) => row.id !== id));
        return null;
      } catch (cause) {
        return message(cause, errors.remove);
      } finally {
        setSaving(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  return { data, loading, error, saving, add, save, remove, reload: load };
}

export function useParcels() {
  return useCollection<Parcel, { number: number; size?: number; notes?: string }, ParcelUpdate>(
    listParcels,
    { create: createParcel, update: updateParcel, remove: deleteParcel },
    (a, b) => a.number - b.number,
    {
      load: "Klarte ikke å hente parsellene",
      save: "Klarte ikke å lagre parsellen",
      remove: "Klarte ikke å slette parsellen",
    },
  );
}

export function useParcellants() {
  return useCollection<Parcellant, ParcellantInput, Partial<ParcellantInput>>(
    () => listParcellants(),
    { create: createParcellant, update: updateParcellant, remove: deleteParcellant },
    (a, b) =>
      a.lastName.localeCompare(b.lastName, "nb") ||
      a.firstName.localeCompare(b.firstName, "nb"),
    {
      load: "Klarte ikke å hente parsellantene",
      save: "Klarte ikke å lagre parsellanten",
      remove: "Klarte ikke å slette parsellanten",
    },
  );
}

export function useWaitlist() {
  return useCollection<WaitlistEntry, WaitlistInput, WaitlistUpdate>(
    listWaitlist,
    {
      create: createWaitlistEntry,
      update: updateWaitlistEntry,
      remove: deleteWaitlistEntry,
    },
    (a, b) => a.createdAt.localeCompare(b.createdAt),
    {
      load: "Klarte ikke å hente ventelisten",
      save: "Klarte ikke å lagre oppføringen",
      remove: "Klarte ikke å fjerne oppføringen",
    },
    true,
  );
}
