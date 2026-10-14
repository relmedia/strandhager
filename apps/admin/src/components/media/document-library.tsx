"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { Copy, ExternalLink, FileText, FileUp, Trash2 } from "lucide-react";
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
import { deleteMedia, uploadDocument } from "@/lib/upload";

type LibraryFile = {
  url: string;
  name: string;
  size: number;
};

function formatBytes(size: number): string {
  if (size >= 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  if (size >= 1024) return `${Math.round(size / 1024)} kB`;
  return `${size} B`;
}

const isPdf = (file: File) =>
  file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");

/**
 * The document library: every PDF under /dokumenter, whether it came in through
 * a CMS PDF field, a parcel's document tab or this page.
 */
export function DocumentLibrary() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<LibraryFile[] | null>(null);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<LibraryFile | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [dragging, setDragging] = useState(false);
  // Enter/leave events fire for every child, so a depth counter tells apart
  // "left the drop zone" from "moved over a child element".
  const dragDepth = useRef(0);

  const load = useCallback(async () => {
    setFiles(null);
    try {
      const { files: found } = await apiFetch<{ files: LibraryFile[] }>(
        "/media/library?folder=dokumenter",
      );
      setFiles(found);
    } catch {
      setFiles([]);
      toast.error("Kunne ikke lese dokumentbiblioteket.");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  /** Uploads the picked files one by one so each error is reported alone. */
  async function handleFiles(picked: File[]) {
    const list = picked.filter(isPdf);
    if (list.length === 0) {
      toast.error("Ingen av filene er PDF-er");
      return;
    }
    setProgress({ done: 0, total: list.length });

    let failed = 0;
    for (const [index, file] of list.entries()) {
      try {
        await uploadDocument(file);
      } catch {
        failed += 1;
        toast.error(`Kunne ikke laste opp «${file.name}»`);
      }
      setProgress({ done: index + 1, total: list.length });
    }

    setProgress(null);
    const uploaded = list.length - failed;
    if (uploaded > 0) {
      toast.success(
        uploaded === 1 ? "1 dokument lastet opp" : `${uploaded} dokumenter lastet opp`,
      );
    }
    void load();
  }

  async function copyUrl(file: LibraryFile) {
    await navigator.clipboard.writeText(mediaUrl(file.url));
    toast.success("Dokumentlenken er kopiert");
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteMedia(deleteTarget.url);
      toast.success(`«${deleteTarget.name}» er slettet`);
      setDeleteTarget(null);
      void load();
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "Kunne ikke slette dokumentet");
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
            <FileUp className="size-5" />
            Slipp PDF-ene her for å laste dem opp
          </p>
        </div>
      ) : null}

      <div className="flex justify-end">
        <Button type="button" disabled={progress !== null} onClick={() => fileRef.current?.click()}>
          {progress ? <Spinner className="size-4" /> : <FileUp className="size-4" />}
          {progress ? `Laster opp ${progress.done} av ${progress.total} …` : "Last opp PDF"}
        </Button>
        <input
          ref={fileRef}
          type="file"
          multiple
          accept="application/pdf,.pdf"
          className="hidden"
          onChange={(event) => {
            if (event.target.files?.length) void handleFiles([...event.target.files]);
            event.target.value = "";
          }}
        />
      </div>

      {files === null ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }, (_, index) => (
            <Skeleton key={index} className="h-14 w-full" />
          ))}
        </div>
      ) : files.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed p-12 text-center">
          <FileText className="size-8 text-muted-foreground" strokeWidth={1.5} />
          <p className="font-medium">Ingen dokumenter her ennå</p>
          <p className="max-w-sm text-muted-foreground text-sm">
            Last opp PDF-er med knappen over, eller dra dem inn hit.
          </p>
        </div>
      ) : (
        <>
          <ul className="divide-y rounded-lg border">
            {files.map((file) => (
              <li
                key={file.url}
                className="flex items-center gap-3 px-3 py-2.5 transition-colors hover:bg-muted/60"
              >
                <FileText className="size-5 shrink-0 text-muted-foreground" strokeWidth={1.5} />
                <div className="min-w-0 flex-1">
                  <a
                    href={mediaUrl(file.url)}
                    target="_blank"
                    rel="noreferrer"
                    className="block truncate font-medium text-sm hover:underline"
                    title={file.name}
                  >
                    {file.name}
                  </a>
                  <p className="text-muted-foreground text-xs">{formatBytes(file.size)}</p>
                </div>
                <Button
                  asChild
                  variant="ghost"
                  size="icon"
                  className="size-8 shrink-0"
                  aria-label="Åpne dokumentet"
                  title="Åpne dokumentet"
                >
                  <a href={mediaUrl(file.url)} target="_blank" rel="noreferrer">
                    <ExternalLink className="size-4" />
                  </a>
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-8 shrink-0"
                  aria-label="Kopier dokumentlenken"
                  title="Kopier dokumentlenken"
                  onClick={() => void copyUrl(file)}
                >
                  <Copy className="size-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-8 shrink-0 text-muted-foreground hover:text-destructive"
                  aria-label="Slett dokumentet"
                  title="Slett dokumentet"
                  onClick={() => setDeleteTarget(file)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </li>
            ))}
          </ul>

          <p className="text-muted-foreground text-sm">
            {files.length === 1 ? "1 dokument" : `${files.length} dokumenter`}
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
              Dokumentet slettes permanent fra serveren. Hvis det er lenket til fra
              nettsiden eller en parsell, vil lenken slutte å virke.
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
              Slett dokumentet
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
