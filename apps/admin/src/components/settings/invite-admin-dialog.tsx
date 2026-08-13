"use client";

import { useState, type FormEvent } from "react";

import { useRouter } from "next/navigation";

import { Copy, LoaderCircle, UserPlus } from "lucide-react";
import { toast } from "sonner";

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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { inviteAdminUser } from "@/server/auth-actions";

type Invited = {
  email: string;
  emailed: boolean;
  tempPassword?: string;
  mailError?: string;
  allowlisted: boolean;
};

export function InviteAdminDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [invited, setInvited] = useState<Invited | null>(null);

  function reset() {
    setName("");
    setEmail("");
    setInvited(null);
  }

  async function submit(event: FormEvent) {
    event.preventDefault();

    setSaving(true);
    const result = await inviteAdminUser(name, email);
    setSaving(false);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    setInvited({
      email: email.trim().toLowerCase(),
      emailed: result.emailed,
      tempPassword: result.tempPassword,
      mailError: result.mailError,
      allowlisted: result.allowlisted,
    });
    router.refresh();
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        setOpen(value);
        if (!value) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button>
          <UserPlus />
          Legg til bruker
        </Button>
      </DialogTrigger>

      <DialogContent>
        {invited ? (
          <>
            <DialogHeader>
              <DialogTitle>Brukeren er opprettet</DialogTitle>
              <DialogDescription>
                {invited.emailed
                  ? `${invited.email} har fått en e-post med nettadressen til dashbordet og et midlertidig passord. Ved første innlogging må de velge sitt eget passord.`
                  : "E-posten kunne ikke sendes, så du må gi brukeren det midlertidige passordet selv. Ved første innlogging må de velge sitt eget passord."}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3">
              {invited.mailError ? (
                <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-800 text-sm">
                  {invited.mailError}
                </p>
              ) : null}

              {invited.tempPassword ? (
                <div className="space-y-1.5">
                  <Label>Midlertidig passord</Label>
                  <div className="flex items-center gap-2">
                    <Input readOnly value={invited.tempPassword} className="font-mono" />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      aria-label="Kopier midlertidig passord"
                      onClick={() => {
                        navigator.clipboard
                          .writeText(invited.tempPassword ?? "")
                          .then(() => toast.success("Passordet er kopiert."))
                          .catch(() => toast.error("Klarte ikke å kopiere."));
                      }}
                    >
                      <Copy />
                    </Button>
                  </div>
                  <p className="text-muted-foreground text-xs">
                    Vises bare nå — det lagres ikke i klartekst.
                  </p>
                </div>
              ) : null}

              {!invited.allowlisted ? (
                <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900 text-sm">
                  Husk å legge {invited.email} til i ADMIN_ALLOWED_EMAILS i miljøvariablene,
                  ellers slipper ikke brukeren inn.
                </p>
              ) : null}
            </div>

            <DialogFooter>
              <DialogClose asChild>
                <Button type="button">Ferdig</Button>
              </DialogClose>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Legg til bruker</DialogTitle>
              <DialogDescription>
                Brukeren får en e-post med nettadressen til dashbordet og et midlertidig
                passord, og må velge sitt eget passord ved første innlogging.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={submit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="invite-name">Navn</Label>
                <Input
                  id="invite-name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Kari Nordmann"
                  disabled={saving}
                  required
                  minLength={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="invite-email">E-postadresse</Label>
                <Input
                  id="invite-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="kari@eksempel.no"
                  disabled={saving}
                  required
                />
              </div>

              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="outline" disabled={saving}>
                    Avbryt
                  </Button>
                </DialogClose>
                <Button type="submit" disabled={saving || !name.trim() || !email.trim()}>
                  {saving ? <LoaderCircle className="size-4 animate-spin" /> : null}
                  Opprett og send invitasjon
                </Button>
              </DialogFooter>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
