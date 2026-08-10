"use client";

import type { ReactNode } from "react";

import { Trash2, TriangleAlert } from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

type ConfirmDeleteProps = {
  /** Accessible name for the trash trigger, e.g. "Fjern bilde". */
  label: string;
  title: string;
  description: ReactNode;
  onConfirm: () => void;
  confirmLabel?: string;
  /** Thumbnail shown in the dialog so the user can see what they are removing. */
  previewSrc?: string;
};

export function ConfirmDelete({
  label,
  title,
  description,
  onConfirm,
  confirmLabel = "Fjern",
  previewSrc,
}: ConfirmDeleteProps) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button type="button" variant="ghost" size="icon" aria-label={label}>
          <Trash2 className="size-4" />
        </Button>
      </AlertDialogTrigger>

      <AlertDialogContent>
        <AlertDialogHeader>
          {previewSrc ? (
            // biome-ignore lint/performance/noImgElement: preview points at the public site, not a Next route
            <img
              src={previewSrc}
              alt=""
              className="mb-2 h-28 w-full rounded-md object-cover sm:h-32"
            />
          ) : (
            <AlertDialogMedia className="bg-destructive/10 text-destructive">
              <TriangleAlert />
            </AlertDialogMedia>
          )}
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel>Avbryt</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={onConfirm}>
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
