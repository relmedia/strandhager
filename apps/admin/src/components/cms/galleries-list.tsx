"use client";

import { useState } from "react";

import { ArrowRight, Plus } from "lucide-react";
import Link from "next/link";

import { ConfirmDelete } from "@/components/cms/confirm-delete";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { useGalleries } from "@/hooks/use-galleries";
import { mediaUrl } from "@/lib/media";
import { slugify } from "@/lib/slug";

export function GalleriesList() {
  const { galleries, error, saving, save } = useGalleries();
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState("");

  if (error) {
    return <p className="text-destructive text-sm">{error}</p>;
  }

  if (!galleries) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground text-sm">
        <Spinner className="size-4" />
        Laster gallerier …
      </div>
    );
  }

  const slug = slugify(title);
  const slugTaken = galleries.some((gallery) => gallery.slug === slug);

  async function create() {
    const ok = await save(
      [...(galleries ?? []), { slug, eyebrow: "Bildegalleri", title: title.trim(), images: [] }],
      `Galleriet "${title.trim()}" er opprettet.`,
    );
    if (ok) {
      setCreating(false);
      setTitle("");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground text-sm">
          {galleries.length} galleri{galleries.length === 1 ? "" : "er"}
        </p>
        <Button type="button" size="sm" onClick={() => setCreating(true)}>
          <Plus className="size-4" />
          Nytt galleri
        </Button>
      </div>

      <ul className="grid gap-4 md:grid-cols-2">
        {galleries.map((gallery) => (
          <li key={gallery.slug}>
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="flex items-center justify-between gap-2">
                  <Link
                    href={`/cms/galleri/${gallery.slug}`}
                    className="flex flex-1 items-center justify-between gap-2 hover:underline"
                  >
                    {gallery.title}
                    <ArrowRight className="size-4 text-muted-foreground" />
                  </Link>
                  <ConfirmDelete
                    label="Slett galleri"
                    title={`Slette "${gallery.title}"?`}
                    description={`Galleriet og rekkefølgen på ${gallery.images.length} bilde(r) forsvinner, og /galleri/${gallery.slug} slutter å virke. Bildefilene blir liggende på serveren.`}
                    previewSrc={
                      gallery.images[0] ? mediaUrl(gallery.images[0].src) : undefined
                    }
                    onConfirm={() =>
                      save(
                        galleries.filter((item) => item.slug !== gallery.slug),
                        `Galleriet "${gallery.title}" er slettet.`,
                      )
                    }
                  />
                </CardTitle>
                <CardDescription>
                  <span className="block font-mono text-xs">/galleri/{gallery.slug}</span>
                  {gallery.images.length} bilder
                </CardDescription>
              </CardHeader>
            </Card>
          </li>
        ))}
      </ul>

      <Dialog open={creating} onOpenChange={setCreating}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nytt galleri</DialogTitle>
            <DialogDescription>
              Gi galleriet et navn. Du kan laste opp bilder etterpå.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label>Tittel</Label>
            <Input
              value={title}
              placeholder="F.eks. Parsellene"
              onChange={(event) => setTitle(event.target.value)}
            />
            <p className="text-muted-foreground text-xs">
              {slug ? `Adresse: /galleri/${slug}` : "Adressen lages ut fra tittelen."}
              {slugTaken ? " — denne adressen er allerede i bruk." : ""}
            </p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setCreating(false)}>
              Avbryt
            </Button>
            <Button type="button" disabled={!slug || slugTaken || saving} onClick={create}>
              {saving ? <Spinner className="size-4" /> : null}
              Opprett
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
