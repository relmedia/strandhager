"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { Copy, ImageUp, Images, Trash2 } from "lucide-react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { apiFetch } from "@/lib/api";
import { mediaUrl } from "@/lib/media";
import { deleteMedia, uploadImage } from "@/lib/upload";

type LibraryFile = {
  url: string;
  name: string;
  size: number;
};

const FOLDERS = [
  { value: "alle", label: "Alle" },
  { value: "galleri", label: "Galleri" },
  { value: "uploads", label: "Opplastet" },
] as const;

type Folder = (typeof FOLDERS)[number]["value"];

function formatBytes(size: number): string {
  if (size >= 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  if (size >= 1024) return `${Math.round(size / 1024)} kB`;
  return `${size} B`;
}

/**
 * The media library: every image stored on the server, with a picker-friendly
 * grid, folder filter and multi-file upload. Uploaded images can then be used
 * anywhere through the "Velg fra media" buttons in the editors.
 */
export function MediaLibrary() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [folder, setFolder] = useState<Folder>("alle");
  const [files, setFiles] = useState<LibraryFile[] | null>(null);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<LibraryFile | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [dragging, setDragging] = useState(false);
  // Enter/leave events fire for every child, so a depth counter tells apart
  // "left the drop zone" from "moved over a child element".
  const dragDepth = useRef(0);

  const load = useCallback(async (target: Folder) => {
    setFiles(null);
    try {
      const { files: found } = await apiFetch<{ files: LibraryFile[] }>(
        `/media/library?folder=${encodeURIComponent(target)}`,
      );
      setFiles(found);
    } catch {
      setFiles([]);
      toast.error("Kunne ikke lese mediebiblioteket.");
    }
  }, []);

  useEffect(() => {
    void load(folder);
  }, [folder, load]);

  /** Uploads the picked files one by one so each error is reported alone. */
  async function handleFiles(picked: File[]) {
    const list = picked.filter((file) => file.type.startsWith("image/"));
    if (list.length === 0) {
      toast.error("Ingen av filene er bilder");
      return;
    }
    setProgress({ done: 0, total: list.length });

    let failed = 0;
    for (const [index, file] of list.entries()) {
      try {
        await uploadImage(file);
      } catch {
        failed += 1;
        toast.error(`Kunne ikke laste opp «${file.name}»`);
      }
      setProgress({ done: index + 1, total: list.length });
    }

    setProgress(null);
    const uploaded = list.length - failed;
    if (uploaded > 0) {
      toast.success(uploaded === 1 ? "1 bilde lastet opp" : `${uploaded} bilder lastet opp`);
    }
    void load(folder);
  }

  async function copyUrl(file: LibraryFile) {
    await navigator.clipboard.writeText(mediaUrl(file.url));
    toast.success("Bildelenken er kopiert");
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteMedia(deleteTarget.url);
      toast.success(`«${deleteTarget.name}» er slettet`);
      setDeleteTarget(null);
      void load(folder);
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "Kunne ikke slette bildet");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div
      className="relative space-y-4"
      onDragEnter={(event) => {
        event.preventDefault();
        dragDepth.current += 1;
        setDragging(true);
      }}
      onDragOver={(event) => event.preventDefault()}
      onDragLeave={() => {
        dragDepth.current -= 1;
        if (dragDepth.current <= 0) {
          dragDepth.current = 0;
          setDragging(false);
        }
      }}
      onDrop={(event) => {
        event.preventDefault();
        dragDepth.current = 0;
        setDragging(false);
        if (progress === null && event.dataTransfer.files.length > 0) {
          void handleFiles([...event.dataTransfer.files]);
        }
      }}
    >
      {dragging ? (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-lg border-2 border-primary border-dashed bg-background/85">
          <p className="flex items-center gap-2 font-medium text-sm">
            <ImageUp className="size-5" />
            Slipp bildene her for å laste dem opp
          </p>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        {FOLDERS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => setFolder(option.value)}
            aria-pressed={option.value === folder}
            className={`rounded-full px-3.5 py-1.5 font-medium text-sm transition-colors ${
              option.value === folder
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-accent hover:text-foreground"
            }`}
          >
            {option.label}
          </button>
        ))}

        <div className="ml-auto">
          <Button
            type="button"
            disabled={progress !== null}
            onClick={() => fileRef.current?.click()}
          >
            {progress ? <Spinner className="size-4" /> : <ImageUp className="size-4" />}
            {progress
              ? `Laster opp ${progress.done} av ${progress.total} …`
              : "Last opp bilder"}
          </Button>
          <input
            ref={fileRef}
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp,image/avif"
            className="hidden"
            onChange={(event) => {
              if (event.target.files?.length) void handleFiles([...event.target.files]);
              event.target.value = "";
            }}
          />
        </div>
      </div>

      {files === null ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {Array.from({ length: 10 }, (_, index) => (
            <Skeleton key={index} className="h-40 w-full" />
          ))}
        </div>
      ) : files.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed p-12 text-center">
          <Images className="size-8 text-muted-foreground" strokeWidth={1.5} />
          <p className="font-medium">Ingen bilder her ennå</p>
          <p className="max-w-sm text-muted-foreground text-sm">
            Last opp bilder med knappen over, så kan de brukes overalt på nettsiden.
          </p>
        </div>
      ) : (
        <>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {files.map((file) => (
              <li
                key={file.url}
                className="group overflow-hidden rounded-lg border transition-colors hover:border-input"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={mediaUrl(file.url)}
                  alt=""
                  loading="lazy"
                  className="h-28 w-full object-cover"
                />
                <div className="flex items-center gap-1 px-2 py-1.5">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs" title={file.name}>
                      {file.name}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {formatBytes(file.size)}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-7 shrink-0"
                    aria-label="Kopier bildelenken"
                    title="Kopier bildelenken"
                    onClick={() => void copyUrl(file)}
                  >
                    <Copy className="size-3.5" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-7 shrink-0 text-muted-foreground hover:text-destructive"
                    aria-label="Slett bildet"
                    title="Slett bildet"
                    onClick={() => setDeleteTarget(file)}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>

          <p className="text-muted-foreground text-sm">
            {files.length === 1 ? "1 bilde" : `${files.length} bilder`}
          </p>
        </>
      )}

      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(next) => {
          if (!next) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Slette «{deleteTarget?.name}»?</AlertDialogTitle>
            <AlertDialogDescription>
              Bildet slettes permanent fra serveren. Hvis det er i bruk på nettsiden,
              vil det forsvinne derfra.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Avbryt</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleting}
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={(event) => {
                // Keep the dialog open while the delete request runs.
                event.preventDefault();
                void confirmDelete();
              }}
            >
              {deleting ? <Spinner className="size-4" /> : null}
              Slett bildet
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
