"use client";

import { useRef, useState } from "react";

import { FileText, Upload } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { mediaUrl } from "@/lib/media";
import { uploadDocument } from "@/lib/upload";

type PdfFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
};

export function PdfField({ label, value, onChange }: PdfFieldProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFile(file: File) {
    setUploading(true);
    try {
      const { url } = await uploadDocument(file);
      onChange(url);
      toast.success("PDF lastet opp");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Opplasting feilet");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex gap-2">
        <Input
          value={value}
          placeholder="/dokumenter/…"
          onChange={(event) => onChange(event.target.value)}
        />
        <Button
          type="button"
          variant="outline"
          disabled={uploading}
          onClick={() => fileRef.current?.click()}
        >
          {uploading ? <Spinner className="size-4" /> : <Upload className="size-4" />}
          Last opp
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) handleFile(file);
            event.target.value = "";
          }}
        />
      </div>
      {value ? (
        <a
          href={mediaUrl(value)}
          target="_blank"
          rel="noreferrer noopener"
          className="inline-flex items-center gap-2 text-muted-foreground text-xs underline-offset-4 hover:text-foreground hover:underline"
        >
          <FileText className="size-3.5" aria-hidden />
          Åpne PDF-en
        </a>
      ) : null}
    </div>
  );
}
