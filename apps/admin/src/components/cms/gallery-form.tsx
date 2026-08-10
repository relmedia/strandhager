"use client";

import { useRef, useState } from "react";

import { ChevronLeft, ChevronRight, ImageUp } from "lucide-react";
import { toast } from "sonner";

import { ConfirmDelete } from "@/components/cms/confirm-delete";
import { TextField } from "@/components/cms/fields";
import { MediaLibraryPicker } from "@/components/cms/media-library-picker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { mediaUrl } from "@/lib/media";
import { slugify } from "@/lib/slug";
import { uploadImage } from "@/lib/upload";
import type { Gallery } from "@/types/site-content";

type GalleryFormProps = {
  value: Gallery;
  onChange: (value: Gallery) => void;
};

export function GalleryForm({ value, onChange }: GalleryFormProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const images = value.images;
  const setImages = (next: Gallery["images"]) => onChange({ ...value, images: next });

  async function addFiles(files: File[]) {
    setUploading(true);
    try {
      const uploaded = await Promise.all(
        files.map(async (file) => {
          const { url, width, height } = await uploadImage(file);
          return { src: url, width, height, alt: "" };
        }),
      );
      setImages([...images, ...uploaded]);
      toast.success(`${uploaded.length} bilde(r) lastet opp`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Opplasting feilet");
    } finally {
      setUploading(false);
    }
  }

  function move(index: number, delta: number) {
    const target = index + delta;
    if (target < 0 || target >= images.length) return;
    const next = [...images];
    [next[index], next[target]] = [next[target], next[index]];
    setImages(next);
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <TextField
          label="Overlinje"
          value={value.eyebrow}
          onChange={(v) => onChange({ ...value, eyebrow: v })}
        />
        <TextField
          label="Tittel"
          value={value.title}
          onChange={(v) => onChange({ ...value, title: v })}
        />
      </div>

      <TextField
        label="Adresse (slug)"
        value={value.slug}
        onChange={(v) => onChange({ ...value, slug: slugify(v) })}
        hint={`Galleriet ligger på /galleri/${value.slug || "…"}. Endrer du denne, slutter gamle lenker å virke.`}
      />

      <Separator />

      <div className="flex flex-wrap items-center justify-between gap-2">
        <Label className="text-base">Bilder ({images.length})</Label>
        <div className="flex gap-2">
          <MediaLibraryPicker
            folder="alle"
            usedSrcs={images.map((image) => image.src)}
            onAdd={(picked) =>
              setImages([...images, ...picked.map((image) => ({ ...image, alt: "" }))])
            }
            triggerLabel="Legg til fra mappen"
            description="Bilder som allerede ligger på serveren. Her finner du igjen bilder du har fjernet tidligere."
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={uploading}
            onClick={() => fileRef.current?.click()}
          >
            {uploading ? <Spinner className="size-4" /> : <ImageUp className="size-4" />}
            Last opp nye bilder
          </Button>
        </div>
        <input
          ref={fileRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,image/avif"
          className="hidden"
          onChange={(event) => {
            const files = Array.from(event.target.files ?? []);
            if (files.length) addFiles(files);
            event.target.value = "";
          }}
        />
      </div>

      <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {images.map((image, index) => {
          const preview = mediaUrl(image.src);
          const filename = image.src.split("/").pop();

          return (
            <li key={image.src} className="space-y-3 rounded-lg border p-3">
              <div className="flex gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={preview} alt="" className="h-20 w-28 shrink-0 rounded-md object-cover" />
                <div className="flex min-w-0 flex-1 flex-col justify-between">
                  <p className="truncate text-muted-foreground text-xs">
                    {index + 1}. {filename}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {image.width} × {image.height}
                  </p>
                  <div className="flex gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label="Flytt til venstre"
                      disabled={index === 0}
                      onClick={() => move(index, -1)}
                    >
                      <ChevronLeft className="size-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label="Flytt til høyre"
                      disabled={index === images.length - 1}
                      onClick={() => move(index, 1)}
                    >
                      <ChevronRight className="size-4" />
                    </Button>
                    <ConfirmDelete
                      label="Fjern bilde"
                      title={`Fjerne bilde ${index + 1}?`}
                      description={`${filename} tas ut av galleriet når du lagrer. Selve filen blir liggende, så du kan legge den til igjen senere.`}
                      previewSrc={preview}
                      onConfirm={() => setImages(images.filter((_, i) => i !== index))}
                    />
                  </div>
                </div>
              </div>
              <Input
                value={image.alt}
                placeholder="Alternativ tekst"
                onChange={(event) =>
                  setImages(
                    images.map((img, i) =>
                      i === index ? { ...img, alt: event.target.value } : img,
                    ),
                  )
                }
              />
            </li>
          );
        })}
      </ul>
    </div>
  );
}
