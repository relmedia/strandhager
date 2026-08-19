"use client";

import { useCallback, useEffect, useState } from "react";

import { Check, FolderOpen } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { apiFetch } from "@/lib/api";
import { mediaUrl } from "@/lib/media";
import { readDimensionsFromUrl } from "@/lib/upload";

type LibraryFile = {
  url: string;
  name: string;
  size: number;
};

export type PickedImage = {
  src: string;
  width: number;
  height: number;
};

type MediaLibraryPickerProps = {
  /** Folder on the server to browse, e.g. "galleri". */
  folder: string;
  /** Paths already in use, shown as unavailable. */
  usedSrcs: readonly string[];
  onAdd: (images: PickedImage[]) => void;
  triggerLabel?: string;
  title?: string;
  description?: string;
  /** Pick exactly one image instead of a multi-selection. */
  single?: boolean;
  triggerSize?: React.ComponentProps<typeof Button>["size"];
};

export function MediaLibraryPicker({
  folder,
  usedSrcs,
  onAdd,
  triggerLabel = "Legg til fra mappen",
  title = "Bilder i mappen",
  description = "Bilder som allerede ligger på serveren. Velg dem du vil legge til igjen.",
  single = false,
  triggerSize = "sm",
}: MediaLibraryPickerProps) {
  const [open, setOpen] = useState(false);
  const [files, setFiles] = useState<LibraryFile[] | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [adding, setAdding] = useState(false);

  const load = useCallback(async () => {
    setFiles(null);
    try {
      const { files: found } = await apiFetch<{ files: LibraryFile[] }>(
        `/media/library?folder=${encodeURIComponent(folder)}`,
      );
      setFiles(found);
    } catch {
      setFiles([]);
      toast.error("Kunne ikke lese mappen.");
    }
  }, [folder]);

  useEffect(() => {
    if (open) {
      setSelected([]);
      void load();
    }
  }, [open, load]);

  const used = new Set(usedSrcs);
  const available = files?.filter((file) => !used.has(file.url)) ?? [];

  async function addSelected() {
    setAdding(true);
    try {
      const picked = await Promise.all(
        selected.map(async (src) => ({ src, ...(await readDimensionsFromUrl(mediaUrl(src))) })),
      );
      onAdd(picked);
      if (!single) toast.success(`${picked.length} bilde(r) lagt til`);
      setOpen(false);
    } finally {
      setAdding(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size={triggerSize}>
          <FolderOpen className="size-4" />
          {triggerLabel}
        </Button>
      </DialogTrigger>

      <DialogContent className="max-h-[85vh] overflow-hidden sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="-mx-1 max-h-[55vh] overflow-y-auto px-1">
          {files === null ? (
            <div className="flex items-center gap-2 py-10 text-muted-foreground text-sm">
              <Spinner className="size-4" />
              Leser mappen …
            </div>
          ) : available.length === 0 ? (
            <p className="py-10 text-center text-muted-foreground text-sm">
              {files.length === 0
                ? "Ingen bilder i mappen ennå."
                : "Alle bildene i mappen er allerede i bruk."}
            </p>
          ) : (
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {available.map((file) => {
                const isSelected = selected.includes(file.url);

                return (
                  <li key={file.url}>
                    <button
                      type="button"
                      aria-pressed={isSelected}
                      onClick={() =>
                        setSelected((current) =>
                          current.includes(file.url)
                            ? current.filter((src) => src !== file.url)
                            : single
                              ? [file.url]
                              : [...current, file.url],
                        )
                      }
                      className={`group relative block w-full overflow-hidden rounded-lg border text-left transition-colors ${
                        isSelected ? "border-primary ring-2 ring-primary/30" : "hover:border-input"
                      }`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={mediaUrl(file.url)}
                        alt=""
                        loading="lazy"
                        className="h-24 w-full object-cover"
                      />
                      {isSelected ? (
                        <span className="absolute top-1.5 right-1.5 flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                          <Check className="size-3" strokeWidth={3} />
                        </span>
                      ) : null}
                      <span className="block truncate px-2 py-1.5 text-muted-foreground text-xs">
                        {file.name}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <DialogFooter className="items-center sm:justify-between">
          <p className="text-muted-foreground text-sm">
            {selected.length > 0
              ? `${selected.length} valgt`
              : `${available.length} tilgjengelig`}
          </p>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Avbryt
            </Button>
            <Button
              type="button"
              disabled={selected.length === 0 || adding}
              onClick={addSelected}
            >
              {adding ? <Spinner className="size-4" /> : null}
              {single ? "Velg" : "Legg til"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
