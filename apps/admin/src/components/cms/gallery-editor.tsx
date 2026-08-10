"use client";

import { useEffect, useState } from "react";

import { useRouter } from "next/navigation";

import { GalleryForm } from "@/components/cms/gallery-form";
import { SectionPanel } from "@/components/cms/section-panel";
import { Spinner } from "@/components/ui/spinner";
import { useGalleries } from "@/hooks/use-galleries";
import type { Gallery } from "@/types/site-content";

export function GalleryEditor({ slug }: { slug: string }) {
  const router = useRouter();
  const { galleries, error, saving, save } = useGalleries();
  const [draft, setDraft] = useState<Gallery | null>(null);

  const stored = galleries?.find((gallery) => gallery.slug === slug);

  useEffect(() => {
    if (stored) setDraft(stored);
  }, [stored]);

  if (error) {
    return <p className="text-destructive text-sm">{error}</p>;
  }

  if (!galleries || !draft) {
    if (galleries && !stored) {
      return <p className="text-destructive text-sm">Fant ikke galleriet "{slug}".</p>;
    }
    return (
      <div className="flex items-center gap-2 text-muted-foreground text-sm">
        <Spinner className="size-4" />
        Laster galleri …
      </div>
    );
  }

  async function onSave() {
    if (!draft || !galleries) return;

    const ok = await save(
      galleries.map((gallery) => (gallery.slug === slug ? draft : gallery)),
      `"${draft.title}" er lagret. Endringene er synlige på nettsiden.`,
    );

    // The slug is part of the URL, so follow it when the editor renamed it.
    if (ok && draft.slug !== slug) {
      router.replace(`/cms/galleri/${draft.slug}`);
    }
  }

  return (
    <SectionPanel
      title={draft.title || "Uten tittel"}
      description="Last opp bilder, sorter dem og skriv alternativ tekst."
      saving={saving}
      onSave={onSave}
    >
      <GalleryForm value={draft} onChange={setDraft} />
    </SectionPanel>
  );
}
