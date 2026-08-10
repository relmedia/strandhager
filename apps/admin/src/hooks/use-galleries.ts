"use client";

import { useCallback, useEffect, useState } from "react";

import { toast } from "sonner";

import { apiFetch } from "@/lib/api";
import type { GalleriesContent, Gallery } from "@/types/site-content";

/** Loads and saves the gallery list, which lives in a single CMS section. */
export function useGalleries() {
  const [galleries, setGalleries] = useState<Gallery[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;

    apiFetch<GalleriesContent>("/site-content/galleries")
      .then((content) => {
        if (active) setGalleries(content.galleries ?? []);
      })
      .catch(() => {
        if (active) setError("Kunne ikke laste galleriene. Sjekk at API-et kjører.");
      });

    return () => {
      active = false;
    };
  }, []);

  const save = useCallback(async (next: Gallery[], message = "Galleriet er lagret.") => {
    setSaving(true);
    try {
      await apiFetch("/site-content/galleries", {
        method: "PUT",
        body: JSON.stringify({ data: { galleries: next } }),
      });
      setGalleries(next);
      toast.success(message);
      return true;
    } catch {
      toast.error("Kunne ikke lagre. Prøv igjen.");
      return false;
    } finally {
      setSaving(false);
    }
  }, []);

  return { galleries, error, saving, save, setGalleries };
}
