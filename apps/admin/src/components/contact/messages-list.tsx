"use client";

import { useEffect, useState } from "react";

import { Inbox, Mail, Phone } from "lucide-react";
import { toast } from "sonner";

import { ConfirmDelete } from "@/components/cms/confirm-delete";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  deleteContactMessage,
  listContactMessages,
  updateContactMessage,
} from "@/lib/mail";
import type { ContactMessage } from "@/types/mail";

const dateFormat = new Intl.DateTimeFormat("nb-NO", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export function MessagesList() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  // Read from the list so the dialog reflects status changes right away.
  const open = messages.find((entry) => entry.id === openId) ?? null;

  useEffect(() => {
    listContactMessages()
      .then(setMessages)
      .catch((cause) => {
        setError(
          cause instanceof Error ? cause.message : "Klarte ikke å hente henvendelsene",
        );
      })
      .finally(() => setLoading(false));
  }, []);

  async function toggleStatus(entry: ContactMessage) {
    const status = entry.status === "NEW" ? "HANDLED" : "NEW";

    try {
      const updated = await updateContactMessage(entry.id, { status });
      setMessages((current) =>
        current.map((row) => (row.id === entry.id ? updated : row)),
      );
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "Klarte ikke å lagre");
    }
  }

  async function remove(entry: ContactMessage) {
    try {
      await deleteContactMessage(entry.id);
      setMessages((current) => current.filter((row) => row.id !== entry.id));
      toast.success("Henvendelsen er slettet");
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "Klarte ikke å slette");
    }
  }

  const unhandled = messages.filter((entry) => entry.status === "NEW").length;

  if (error) {
    return (
      <p className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-destructive text-sm">
        {error}
      </p>
    );
  }

  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className="h-14 w-full" />
        ))}
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed p-12 text-center">
        <Inbox className="size-8 text-muted-foreground" strokeWidth={1.5} />
        <p className="font-medium">Ingen henvendelser ennå</p>
        <p className="max-w-sm text-muted-foreground text-sm">
          Meldinger fra kontaktskjemaet på nettsiden havner her, og sendes samtidig til
          varslingsadressen under Innstillinger → E-post.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-muted-foreground text-sm">
        {unhandled === 0
          ? "Alle henvendelser er behandlet."
          : `${unhandled} ${unhandled === 1 ? "henvendelse venter" : "henvendelser venter"} på svar.`}
      </p>

      <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fra</TableHead>
              <TableHead>Melding</TableHead>
              <TableHead className="hidden md:table-cell">Mottatt</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-16" />
            </TableRow>
          </TableHeader>

          <TableBody>
            {messages.map((entry) => (
              <TableRow
                key={entry.id}
                onClick={() => setOpenId(entry.id)}
                className={`cursor-pointer ${entry.status === "HANDLED" ? "opacity-60" : ""}`}
              >
                <TableCell className="align-top">
                  <p className="font-medium">{entry.name}</p>
                  <a
                    href={`mailto:${entry.email}`}
                    onClick={(event) => event.stopPropagation()}
                    className="flex items-center gap-1.5 text-muted-foreground text-xs hover:underline"
                  >
                    <Mail className="size-3" />
                    {entry.email}
                  </a>
                  {entry.phone ? (
                    <a
                      href={`tel:${entry.phone.replace(/\s/g, "")}`}
                      onClick={(event) => event.stopPropagation()}
                      className="flex items-center gap-1.5 text-muted-foreground text-xs hover:underline"
                    >
                      <Phone className="size-3" />
                      {entry.phone}
                    </a>
                  ) : null}
                </TableCell>

                <TableCell className="align-top">
                  {entry.subject ? (
                    <p className="font-medium text-sm">{entry.subject}</p>
                  ) : null}
                  <p className="line-clamp-2 max-w-96 whitespace-normal text-muted-foreground text-sm">
                    {entry.message}
                  </p>
                  <span className="text-primary text-xs hover:underline">
                    Les hele meldingen
                  </span>
                </TableCell>

                <TableCell className="hidden align-top text-muted-foreground text-sm md:table-cell">
                  {dateFormat.format(new Date(entry.createdAt))}
                </TableCell>

                <TableCell className="align-top">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 hover:bg-transparent"
                    onClick={(event) => {
                      event.stopPropagation();
                      void toggleStatus(entry);
                    }}
                    title={
                      entry.status === "NEW"
                        ? "Merk som behandlet"
                        : "Merk som ubehandlet"
                    }
                  >
                    {entry.status === "NEW" ? (
                      <Badge>Ny</Badge>
                    ) : (
                      <Badge variant="secondary">Behandlet</Badge>
                    )}
                  </Button>
                </TableCell>

                <TableCell
                  className="align-top"
                  onClick={(event) => event.stopPropagation()}
                >
                  <div className="flex justify-end">
                    <ConfirmDelete
                      label={`Slett henvendelsen fra ${entry.name}`}
                      title="Slette henvendelsen?"
                      description={`Meldingen fra ${entry.name} slettes for godt.`}
                      confirmLabel="Slett"
                      onConfirm={() => void remove(entry)}
                    />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open !== null} onOpenChange={(next) => !next && setOpenId(null)}>
        {open ? (
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>{open.subject ?? "Henvendelse"}</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-1 text-sm">
                <p className="font-medium">{open.name}</p>
                <a
                  href={`mailto:${open.email}`}
                  className="flex items-center gap-1.5 text-muted-foreground hover:underline"
                >
                  <Mail className="size-3.5" />
                  {open.email}
                </a>
                {open.phone ? (
                  <a
                    href={`tel:${open.phone.replace(/\s/g, "")}`}
                    className="flex items-center gap-1.5 text-muted-foreground hover:underline"
                  >
                    <Phone className="size-3.5" />
                    {open.phone}
                  </a>
                ) : null}
                <p className="text-muted-foreground text-xs">
                  Mottatt {dateFormat.format(new Date(open.createdAt))}
                </p>
              </div>

              <div className="max-h-[50vh] overflow-y-auto rounded-lg bg-muted/50 p-4">
                <p className="whitespace-pre-wrap text-sm leading-relaxed">
                  {open.message}
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => void toggleStatus(open)}
                >
                  {open.status === "NEW"
                    ? "Merk som behandlet"
                    : "Merk som ubehandlet"}
                </Button>
                <Button asChild>
                  <a
                    href={`mailto:${open.email}?subject=${encodeURIComponent(`Re: ${open.subject ?? "Din henvendelse"}`)}`}
                  >
                    Svar på e-post
                  </a>
                </Button>
              </div>
            </div>
          </DialogContent>
        ) : null}
      </Dialog>
    </div>
  );
}
