"use client";

import { useRef, useState } from "react";

import { ImageUp, X } from "lucide-react";
import { toast } from "sonner";

import { MediaLibraryPicker } from "@/components/cms/media-library-picker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { mediaUrl } from "@/lib/media";
import { uploadImage } from "@/lib/upload";

type ImageFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
};

export function ImageField({ label, value, onChange }: ImageFieldProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const previewSrc = mediaUrl(value);

  async function handleFile(file: File) {
    setUploading(true);
    try {
      const { url } = await uploadImage(file);
      onChange(url);
      toast.success("Bilde lastet opp");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Opplasting feilet");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex items-start gap-3">
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={previewSrc}
            alt=""
            className="h-16 w-24 shrink-0 rounded-md border object-cover"
          />
        ) : (
          <div className="flex h-16 w-24 shrink-0 items-center justify-center rounded-md border border-dashed text-muted-foreground text-xs">
            Ingen
          </div>
        )}
        <div className="flex w-full gap-2">
          <Input
            value={value}
            placeholder="/images/…"
            onChange={(event) => onChange(event.target.value)}
          />
          <Button
            type="button"
            variant="outline"
            disabled={uploading}
            onClick={() => fileRef.current?.click()}
          >
            {uploading ? <Spinner className="size-4" /> : <ImageUp className="size-4" />}
            Last opp
          </Button>
          <MediaLibraryPicker
            folder="alle"
            usedSrcs={[]}
            single
            triggerSize="default"
            triggerLabel="Velg fra media"
            title="Mediebiblioteket"
            description="Velg et bilde som allerede er lastet opp."
            onAdd={(images) => {
              if (images[0]) onChange(images[0].src);
            }}
          />
          {value ? (
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label="Fjern bildet"
              title="Fjern bildet"
              onClick={() => onChange("")}
            >
              <X className="size-4" />
            </Button>
          ) : null}
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) handleFile(file);
              event.target.value = "";
            }}
          />
        </div>
      </div>
    </div>
  );
}
