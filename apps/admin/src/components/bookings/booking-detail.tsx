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
  Phone,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";

import { ConfirmDelete } from "@/components/cms/confirm-delete";
import { ReasonDialog } from "@/components/bookings/reason-dialog";
import {
  PAYMENT_LABELS,
  PaymentBadge,
  STATUS_LABELS,
  StatusBadge,
} from "@/components/bookings/status-badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useBooking } from "@/hooks/use-bookings";
import { deleteBooking } from "@/lib/booking";
import { formatFullDate, formatMoney, formatTimestamp } from "@/lib/format";
import { WEB_URL } from "@/lib/media";
import type { Booking, BookingStatus, PaymentStatus, BookingUpdate } from "@/types/booking";

const selectClass =
  "h-9 w-full min-w-0 rounded-md border border-input bg-transparent px-3 text-sm shadow-xs";

export function BookingDetail({ id }: { id: string }) {
  const router = useRouter();
  const { data, loading, error, saving, save } = useBooking(id);

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
      <div className="space-y-3">
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

      <StatusActions booking={data} saving={saving} onApply={apply} />

      <div className="grid gap-4 lg:grid-cols-3">
        <section className="space-y-4 rounded-lg border p-5 lg:col-span-2">
          <h2 className="font-medium">Leien</h2>

          <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
            <Row label="Lokale">{data.space.name}</Row>
            <Row label="Antall gjester">{data.guests}</Row>
            <Row label="Fra">{formatFullDate(data.startDate)}</Row>
            <Row label="Til">{formatFullDate(data.endDate)}</Row>
            <Row label="Antall dager">{data.days}</Row>
            <Row label="Anledning">{data.purpose ?? "—"}</Row>
          </dl>

          {data.message ? (
            <div className="rounded-md bg-muted/50 p-4">
              <p className="font-medium text-sm">Melding fra gjesten</p>
              <p className="mt-1.5 whitespace-pre-wrap text-muted-foreground text-sm">
                {data.message}
              </p>
            </div>
          ) : null}

          {data.signature ? (
            <div className="rounded-md bg-muted/50 p-4">
              <p className="font-medium text-sm">Signatur</p>
              {data.termsAcceptedAt ? (
                <p className="mt-0.5 text-muted-foreground text-xs">
                  Leievilkårene ble godtatt og signert{" "}
                  {formatTimestamp(data.termsAcceptedAt)}
                </p>
              ) : null}
              {/* A data URL drawn by the guest; next/image has nothing to optimize here. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={data.signature}
                alt={`Signaturen til ${data.guest.firstName} ${data.guest.lastName}`}
                className="mt-2 h-24 w-auto max-w-full rounded-md bg-white ring-1 ring-border"
              />
            </div>
          ) : null}

          {data.cancelledAt ? (
            <div className="rounded-md border border-destructive/30 bg-destructive/5 p-4">
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

          <Notes booking={data} saving={saving} onApply={apply} />
        </section>

        <div className="space-y-4">
          <section className="space-y-3 rounded-lg border p-5">
            <h2 className="font-medium">Kontakt</h2>

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

            <div className="space-y-1.5 pt-1">
              <Label htmlFor="payment">Betaling</Label>
              <select
                id="payment"
                className={selectClass}
                value={data.paymentStatus}
                disabled={saving}
                onChange={(event) =>
                  void apply(
                    { paymentStatus: event.target.value as PaymentStatus },
                    "Betalingsstatus oppdatert",
                  )
                }
              >
                {Object.entries(PAYMENT_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
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
  onApply,
}: {
  booking: Booking;
  saving: boolean;
  onApply: ApplyFn;
}) {
  const set = (status: BookingStatus, success: string, cancelReason?: string) =>
    onApply({ status, cancelReason }, success);

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

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-muted-foreground text-xs">{label}</dt>
      <dd className="mt-0.5">{children}</dd>
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
