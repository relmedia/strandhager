"use client";

import { useEffect, useState } from "react";

import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Ban,
  Building2,
  Check,
  CircleSlash,
  Copy,
  Mail,
  PartyPopper,
  Pencil,
  Phone,
  Printer,
  RotateCcw,
  Undo2,
  User,
} from "lucide-react";
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

import { ConfirmDelete } from "@/components/cms/confirm-delete";
import { BookingDocument } from "@/components/bookings/booking-document";
import { ReasonDialog } from "@/components/bookings/reason-dialog";
import {
  PaymentBadge,
  STATUS_LABELS,
  StatusBadge,
} from "@/components/bookings/status-badge";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useBooking } from "@/hooks/use-bookings";
import { deleteBooking, refundBooking } from "@/lib/booking";
import { updateGuest } from "@/lib/guest";
import { formatMoney, formatTimestamp } from "@/lib/format";
import { WEB_URL } from "@/lib/media";
import type { Booking, BookingStatus, BookingUpdate } from "@/types/booking";

export function BookingDetail({ id, adminName }: { id: string; adminName: string }) {
  const router = useRouter();
  const { data, loading, error, saving, save, reload } = useBooking(id);

  async function apply(patch: BookingUpdate, success: string) {
    const failure = await save(patch);
    if (failure) {
      toast.error(failure);
      return;
    }
    toast.success(success);
  }

  async function remove() {
    try {
      await deleteBooking(id);
      toast.success("Bookingen er slettet");
      router.push("/bokningar");
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "Klarte ikke å slette");
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="space-y-4">
        <BackLink />
        <p className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-destructive text-sm">
          {error ?? "Fant ingen booking med denne id-en."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-3 print:hidden">
        <BackLink />

        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-semibold text-2xl tracking-tight">
            {data.guest.firstName} {data.guest.lastName}
          </h1>
          <StatusBadge status={data.status} />
          <PaymentBadge status={data.paymentStatus} />
        </div>

        <p className="text-muted-foreground text-sm">
          Referanse{" "}
          <span className="font-mono tracking-wider">{data.reference}</span> · sendt inn{" "}
          {formatTimestamp(data.createdAt)}
          {data.termsAcceptedAt
            ? ` · leievilkårene godtatt ${formatTimestamp(data.termsAcceptedAt)}`
            : null}
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 print:hidden">
        <StatusActions booking={data} saving={saving} adminName={adminName} onApply={apply} />
        <Button variant="outline" onClick={() => window.print()}>
          <Printer className="size-4" />
          Skriv ut
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-3 print:block">
        <div className="space-y-4 lg:col-span-2">
          <BookingDocument booking={data} />

          {data.cancelledAt ? (
            <div className="rounded-md border border-destructive/30 bg-destructive/5 p-4 print:hidden">
              <p className="font-medium text-destructive text-sm">
                {STATUS_LABELS[data.status]}{" "}
                {data.cancelledBy === "GUEST" ? "av gjesten" : "av dere"} den{" "}
                {formatTimestamp(data.cancelledAt)}
              </p>
              {data.cancelReason ? (
                <p className="mt-1.5 text-muted-foreground text-sm">{data.cancelReason}</p>
              ) : null}
            </div>
          ) : null}

          <section className="rounded-lg border p-5 print:hidden">
            <Notes booking={data} saving={saving} onApply={apply} />
          </section>
        </div>

        <div className="space-y-4 print:hidden">
          <section className="space-y-3 rounded-lg border p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-medium">Kontakt</h2>
              <EditContact booking={data} onSaved={() => void reload()} />
            </div>

            <p className="flex items-center gap-2 text-sm">
              <User className="size-4 text-muted-foreground" />
              {data.guest.firstName} {data.guest.lastName}
            </p>

            <ContactLink
              href={`mailto:${data.guest.email}`}
              icon={<Mail className="size-4" />}
            >
              {data.guest.email}
            </ContactLink>

            {data.guest.phone ? (
              <ContactLink
                href={`tel:${data.guest.phone.replace(/\s/g, "")}`}
                icon={<Phone className="size-4" />}
              >
                {data.guest.phone}
              </ContactLink>
            ) : null}

            {data.guest.company ? (
              <p className="flex items-center gap-2 text-muted-foreground text-sm">
                <Building2 className="size-4" />
                {data.guest.company}
              </p>
            ) : null}

            <GuestLink booking={data} />
          </section>

          <section className="space-y-3 rounded-lg border p-5">
            <h2 className="font-medium">Pris</h2>

            <dl className="space-y-2 text-sm">
              <Line label={`Leie, ${data.days} dager`} amount={data.dayTotal} />
              {data.cleaningFee > 0 ? (
                <Line label="Utvask" amount={data.cleaningFee} />
              ) : null}
              <div className="flex items-baseline justify-between border-t pt-2 font-medium">
                <dt>Totalt</dt>
                <dd className="tabular-nums">{formatMoney(data.total)}</dd>
              </div>
            </dl>

            <div className="flex items-center justify-between border-t pt-3">
              <span className="text-muted-foreground text-sm">Betaling</span>
              <PaymentBadge status={data.paymentStatus} />
            </div>

            {data.paymentStatus === "PAID" && data.paymentReference ? (
              <RefundVipps booking={data} onDone={() => void reload()} />
            ) : null}

            {!data.paymentReference ? (
              <ManualPayment booking={data} saving={saving} onApply={apply} />
            ) : null}
          </section>

          <section className="space-y-3 rounded-lg border border-destructive/30 p-5">
            <h2 className="font-medium">Slett bookingen</h2>
            <p className="text-muted-foreground text-sm">
              Fjerner den for godt. Vil du bare frigjøre datoene, avbestill i stedet.
            </p>
            <ConfirmDelete
              label="Slett booking"
              title="Slette bookingen?"
              description={`Bookingen ${data.reference} for ${data.guest.firstName} ${data.guest.lastName} slettes for godt. Dette kan ikke angres.`}
              confirmLabel="Slett"
              onConfirm={remove}
            />
          </section>
        </div>
      </div>
    </div>
  );
}

type ApplyFn = (patch: BookingUpdate, success: string) => void | Promise<void>;

function StatusActions({
  booking,
  saving,
  adminName,
  onApply,
}: {
  booking: Booking;
  saving: boolean;
  adminName: string;
  onApply: ApplyFn;
}) {
  const set = (status: BookingStatus, success: string, cancelReason?: string) =>
    onApply(
      {
        status,
        cancelReason,
        // Confirming signs the agreement electronically on the utleier's behalf.
        ...(status === "CONFIRMED" && adminName ? { confirmedByName: adminName } : {}),
      },
      success,
    );

  const actions: Record<BookingStatus, React.ReactNode> = {
    PENDING: (
      <>
        <Button disabled={saving} onClick={() => set("CONFIRMED", "Bookingen er bekreftet")}>
          <Check className="size-4" />
          Bekreft
        </Button>
        <ReasonDialog
          trigger={
            <Button variant="outline" disabled={saving}>
              <Ban className="size-4" />
              Avslå
            </Button>
          }
          title="Avslå forespørselen?"
          description="Datoene blir ledige igjen med én gang."
          placeholder="For eksempel: lokalet er allerede lovet bort denne helgen."
          confirmLabel="Avslå"
          destructive
          onConfirm={(reason) => set("DECLINED", "Forespørselen er avslått", reason)}
        />
      </>
    ),
    CONFIRMED: (
      <>
        <Button
          variant="outline"
          disabled={saving}
          onClick={() => set("COMPLETED", "Markert som gjennomført")}
        >
          <PartyPopper className="size-4" />
          Marker som gjennomført
        </Button>
        <ReasonDialog
          trigger={
            <Button variant="outline" disabled={saving}>
              <CircleSlash className="size-4" />
              Avbestill
            </Button>
          }
          title="Avbestille bookingen?"
          description="Datoene blir ledige igjen med én gang."
          confirmLabel="Avbestill"
          destructive
          onConfirm={(reason) => set("CANCELLED", "Bookingen er avbestilt", reason)}
        />
      </>
    ),
    DECLINED: <Restore saving={saving} onRestore={set} />,
    CANCELLED: <Restore saving={saving} onRestore={set} />,
    COMPLETED: (
      <p className="text-muted-foreground text-sm">
        Denne leien er gjennomført og trenger ikke mer oppfølging.
      </p>
    ),
  };

  return <div className="flex flex-wrap gap-2">{actions[booking.status]}</div>;
}

/**
 * The pen next to «Kontakt»: corrects the guest's contact details. The
 * changes are saved on the guest record, so they apply to all their bookings
 * and to the guest register.
 */
function EditContact({ booking, onSaved }: { booking: Booking; onSaved: () => void }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(() => initialForm(booking));

  function initialForm(source: Booking) {
    return {
      firstName: source.guest.firstName,
      lastName: source.guest.lastName,
      email: source.guest.email,
      phone: source.guest.phone ?? "",
      company: source.guest.company ?? "",
    };
  }

  function openChange(next: boolean) {
    // Start fresh from the booking every time, discarding stale edits.
    if (next) setForm(initialForm(booking));
    setOpen(next);
  }

  const set = (field: keyof typeof form) => (event: React.ChangeEvent<HTMLInputElement>) =>
    setForm((current) => ({ ...current, [field]: event.target.value }));

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    try {
      await updateGuest(booking.guest.id, form);
      toast.success("Kontaktinformasjonen er oppdatert");
      setOpen(false);
      onSaved();
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "Klarte ikke å lagre endringene");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={openChange}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Endre kontaktinformasjon">
          <Pencil className="size-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Endre kontaktinformasjon</DialogTitle>
          <DialogDescription>
            Endringene lagres på gjesten og gjelder alle bookingene deres.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="contact-first">Fornavn</Label>
              <Input
                id="contact-first"
                value={form.firstName}
                onChange={set("firstName")}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="contact-last">Etternavn</Label>
              <Input
                id="contact-last"
                value={form.lastName}
                onChange={set("lastName")}
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="contact-email">E-post</Label>
            <Input
              id="contact-email"
              type="email"
              value={form.email}
              onChange={set("email")}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="contact-phone">Telefon</Label>
            <Input id="contact-phone" value={form.phone} onChange={set("phone")} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="contact-company">Firma</Label>
            <Input id="contact-company" value={form.company} onChange={set("company")} />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={saving}>
              {saving ? "Lagrer …" : "Lagre"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Fallback for bookings paid outside Vipps (bank transfer, cash): the badge
 * follows what the administrator marks here. Vipps-paid bookings never show
 * this — their status is driven by Vipps' own payment events.
 */
function ManualPayment({
  booking,
  saving,
  onApply,
}: {
  booking: Booking;
  saving: boolean;
  onApply: ApplyFn;
}) {
  const paid = booking.paymentStatus === "PAID";

  return (
    <Button
      size="sm"
      className="w-full"
      disabled={saving}
      onClick={() =>
        void onApply(
          { paymentStatus: paid ? "UNPAID" : "PAID" },
          paid ? "Markert som ikke betalt" : "Markert som betalt",
        )
      }
    >
      {paid ? "Marker som ikke betalt" : "Marker som betalt"}
    </Button>
  );
}

/**
 * Sends the money back through Vipps. Only shown when the booking was paid
 * with Vipps, so the button always means "one click and the guest has their
 * money on the way".
 */
function RefundVipps({ booking, onDone }: { booking: Booking; onDone: () => void }) {
  const [working, setWorking] = useState(false);

  async function refund() {
    setWorking(true);
    try {
      await refundBooking(booking.id);
      toast.success("Beløpet er refundert via Vipps");
      onDone();
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "Klarte ikke å refundere");
    } finally {
      setWorking(false);
    }
  }

  return (
    <div className="space-y-2 border-t pt-3">
      <p className="text-muted-foreground text-xs">
        Betalt via Vipps. Refusjonen går tilbake til kontoen gjesten betalte fra.
      </p>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            className="w-full bg-[#ff5b24] text-white hover:bg-[#ff5b24]/85"
            disabled={working}
          >
            <Undo2 className="size-4" />
            {working ? "Refunderer …" : "Refunder via Vipps"}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Refundere betalingen?</AlertDialogTitle>
            <AlertDialogDescription>
              {formatMoney(booking.total)} sendes tilbake til {booking.guest.firstName}{" "}
              {booking.guest.lastName} gjennom Vipps, og gjesten får en e-post om
              refusjonen. Dette kan ikke angres.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Avbryt</AlertDialogCancel>
            <AlertDialogAction onClick={() => void refund()}>Refunder</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function Restore({
  saving,
  onRestore,
}: {
  saving: boolean;
  onRestore: (status: BookingStatus, success: string) => void;
}) {
  return (
    <Button
      variant="outline"
      disabled={saving}
      onClick={() => onRestore("CONFIRMED", "Bookingen er gjenopprettet")}
    >
      <RotateCcw className="size-4" />
      Gjenopprett som bekreftet
    </Button>
  );
}

function Notes({
  booking,
  saving,
  onApply,
}: {
  booking: Booking;
  saving: boolean;
  onApply: ApplyFn;
}) {
  const [notes, setNotes] = useState(booking.notes ?? "");

  // Keep in step when the booking is reloaded or changed elsewhere.
  useEffect(() => {
    setNotes(booking.notes ?? "");
  }, [booking.notes]);

  const dirty = notes !== (booking.notes ?? "");

  return (
    <div className="space-y-2">
      <Label htmlFor="notes">Interne notater</Label>
      <Textarea
        id="notes"
        rows={3}
        value={notes}
        placeholder="Bare synlig her i dashbordet."
        onChange={(event) => setNotes(event.target.value)}
      />
      {dirty ? (
        <div className="flex gap-2">
          <Button
            size="sm"
            disabled={saving}
            onClick={() => void onApply({ notes }, "Notatet er lagret")}
          >
            Lagre notat
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setNotes(booking.notes ?? "")}>
            Angre
          </Button>
        </div>
      ) : null}
    </div>
  );
}

/**
 * The guest only ever sees this link once, right after booking. Nothing is
 * emailed, so this is the only way to give it back to someone who lost it.
 */
function GuestLink({ booking }: { booking: Booking }) {
  const [copied, setCopied] = useState(false);
  const url = `${WEB_URL}/booking/${booking.reference}?token=${booking.cancelToken}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Klarte ikke å kopiere lenken");
    }
  }

  return (
    <div className="space-y-2 border-t pt-3">
      <p className="text-muted-foreground text-xs">
        Gjestens egen lenke. Der kan de se og avbestille bookingen selv.
      </p>
      <div className="flex gap-2">
        <input
          readOnly
          value={url}
          onFocus={(event) => event.currentTarget.select()}
          className="h-9 min-w-0 flex-1 rounded-md border border-input bg-muted/40 px-2.5 font-mono text-muted-foreground text-xs"
        />
        <Button size="sm" variant="outline" onClick={() => void copy()}>
          {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
          {copied ? "Kopiert" : "Kopier"}
        </Button>
      </div>
    </div>
  );
}

function Line({ label, amount }: { label: string; amount: number }) {
  return (
    <div className="flex items-baseline justify-between text-muted-foreground">
      <dt>{label}</dt>
      <dd className="tabular-nums">{formatMoney(amount)}</dd>
    </div>
  );
}

function ContactLink({
  href,
  icon,
  children,
}: {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      className="flex items-center gap-2 text-sm underline-offset-4 hover:underline"
    >
      <span className="text-muted-foreground">{icon}</span>
      {children}
    </a>
  );
}

function BackLink() {
  return (
    <Link
      href="/bokningar"
      className="inline-flex items-center gap-1.5 text-muted-foreground text-sm transition-colors hover:text-foreground"
    >
      <ArrowLeft className="size-4" />
      Alle bookinger
    </Link>
  );
}
