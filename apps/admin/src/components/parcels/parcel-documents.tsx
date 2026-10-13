"use client";

import { useRef, useState } from "react";

import { FileText, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { addParcelDocument, deleteParcelDocument } from "@/lib/parcel";
import { mediaUrl } from "@/lib/media";
import { deleteMedia, uploadDocument } from "@/lib/upload";
import type { Parcel } from "@/types/parcel";

/**
 * The papers the board keeps on one plot: drawings, signed contracts, notes
 * from an inspection.
 *
 * Uploading is two steps on purpose — the file goes to /media first, then the
 * resulting address is recorded against the plot. That is how the existing PDF
 * field works, and it keeps the size and type limits in the one place that
 * already enforces them.
 */
export function ParcelDocuments({
  parcel,
  onChanged,
}: {
  parcel: Parcel;
  /** The parcel comes back from the API with its new document list. */
  onChanged: (parcel: Parcel) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);

  async function handleFiles(files: FileList) {
    setUploading(true);

    try {
      // One at a time, so a failure part-way still leaves the earlier ones
      // attached rather than losing the lot.
      let latest = parcel;
      for (const file of Array.from(files)) {
        const { url } = await uploadDocument(file);
        latest = await addParcelDocument(parcel.id, { title: file.name, url });
      }
      onChanged(latest);
      toast.success(
        files.length === 1 ? "Dokumentet er lastet opp" : `${files.length} dokumenter lastet opp`,
      );
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "Opplastingen feilet");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function remove(id: string, url: string) {
    setRemoving(id);

    try {
      const updated = await deleteParcelDocument(parcel.id, id);
      onChanged(updated);
      // The row is what matters; a file left behind in storage is untidy but
      // harmless, so a failure here must not look like the delete failed.
      await deleteMedia(url).catch(() => undefined);
      toast.success("Dokumentet er slettet");
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "Klarte ikke å slette dokumentet");
    } finally {
      setRemoving(null);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-muted-foreground text-sm">
          Tegninger, kontrakter og annet som hører til parsellen. Kun PDF, maks 25 MB.
        </p>

        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={uploading}
          onClick={() => fileRef.current?.click()}
        >
          {uploading ? <Spinner className="size-4" /> : <Upload className="size-4" />}
          Last opp
        </Button>

        <input
          ref={fileRef}
          type="file"
          accept="application/pdf,.pdf"
          multiple
          hidden
          onChange={(event) => {
            const { files } = event.target;
            if (files?.length) void handleFiles(files);
          }}
        />
      </div>

      {parcel.documents.length === 0 ? (
        <p className="rounded-lg border border-dashed p-6 text-center text-muted-foreground text-sm">
          Ingen dokumenter på denne parsellen ennå.
        </p>
      ) : (
        <ul className="divide-y rounded-lg border">
          {parcel.documents.map((doc) => (
            <li key={doc.id} className="flex items-center gap-3 p-3">
              <FileText className="size-4 shrink-0 text-muted-foreground" />

              <a
                href={mediaUrl(doc.url)}
                target="_blank"
                rel="noreferrer noopener"
                className="min-w-0 flex-1 truncate text-sm hover:underline"
                title={doc.title}
              >
                {doc.title}
              </a>

              <span className="shrink-0 text-muted-foreground text-xs tabular-nums">
                {new Date(doc.createdAt).toLocaleDateString("nb-NO")}
              </span>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={`Slett ${doc.title}`}
                disabled={removing === doc.id}
                onClick={() => void remove(doc.id, doc.url)}
              >
                {removing === doc.id ? (
                  <Spinner className="size-4" />
                ) : (
                  <Trash2 className="size-4" />
                )}
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
