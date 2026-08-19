"use client";

import { Check, CloudUpload } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";

/** Where an auto-saving editor currently is in its save cycle. */
export type AutoSaveStatus = "idle" | "pending" | "saving" | "saved" | "error";

type SectionPanelProps = {
  title: string;
  description: string;
  children: React.ReactNode;
  /** Manual mode: shows a save button in the footer. */
  saving?: boolean;
  onSave?: () => void;
  /** Auto mode: shows the save status instead of a button. */
  status?: AutoSaveStatus;
};

export function SectionPanel({
  title,
  description,
  saving = false,
  onSave,
  status,
  children,
}: SectionPanelProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>{children}</CardContent>
      <CardFooter className="justify-end border-t">
        {onSave ? (
          <Button onClick={onSave} disabled={saving}>
            {saving ? <Spinner className="size-4" /> : null}
            Lagre endringer
          </Button>
        ) : (
          <SaveStatus status={status ?? "idle"} />
        )}
      </CardFooter>
    </Card>
  );
}

function SaveStatus({ status }: { status: AutoSaveStatus }) {
  if (status === "pending" || status === "saving") {
    return (
      <p className="flex items-center gap-2 text-muted-foreground text-sm">
        <Spinner className="size-4" />
        Lagrer …
      </p>
    );
  }

  if (status === "saved") {
    return (
      <p className="flex items-center gap-2 text-muted-foreground text-sm">
        <Check className="size-4 text-emerald-600" />
        Alle endringer er lagret og synlige på nettsiden.
      </p>
    );
  }

  if (status === "error") {
    return (
      <p className="text-destructive text-sm">
        Kunne ikke lagre. Endringene prøves lagret på nytt ved neste endring.
      </p>
    );
  }

  return (
    <p className="flex items-center gap-2 text-muted-foreground text-sm">
      <CloudUpload className="size-4" />
      Endringer lagres automatisk.
    </p>
  );
}
