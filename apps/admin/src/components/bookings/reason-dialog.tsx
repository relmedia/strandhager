"use client";

import { useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type ReasonDialogProps = {
  trigger: ReactNode;
  title: string;
  description: string;
  confirmLabel: string;
  /** Shown above the free-text box, e.g. "Grunn (valgfritt)". */
  fieldLabel?: string;
  placeholder?: string;
  destructive?: boolean;
  onConfirm: (reason: string) => void;
};

/** Confirms an action while collecting an optional note about why. */
export function ReasonDialog({
  trigger,
  title,
  description,
  confirmLabel,
  fieldLabel = "Grunn (valgfritt)",
  placeholder,
  destructive,
  onConfirm,
}: ReasonDialogProps) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");

  function confirm() {
    onConfirm(reason.trim());
    setReason("");
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor="reason">{fieldLabel}</Label>
          <Textarea
            id="reason"
            rows={3}
            value={reason}
            placeholder={placeholder}
            onChange={(event) => setReason(event.target.value)}
          />
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Avbryt</Button>
          </DialogClose>
          <Button variant={destructive ? "destructive" : "default"} onClick={confirm}>
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
