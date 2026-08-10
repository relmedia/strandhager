"use client";

import { useEffect, useState } from "react";

import Link from "next/link";
import {
  ArrowLeft,
  CircleCheck,
  CircleX,
  Hourglass,
  LoaderCircle,
  TriangleAlert,
} from "lucide-react";

import {
  BookingError,
  cancelBooking,
  getBookingByReference,
  type Booking,
  type BookingStatus,
} from "@/lib/booking";
import { formatPrice, formatRange } from "@/lib/dates";

type Contact = { name: string; email: string; phone: string };

const STATUS: Record<
  BookingStatus,
  { label: string; description: string; className: string; Icon: typeof Hourglass }
> = {
  PENDING: {
    label: "Venter på svar",
    description: "Vi har holdt av dagene og gir deg beskjed så snart vi har sett på den.",
    className: "bg-brand-soft/60 text-brand-deep",
    Icon: Hourglass,
  },
  CONFIRMED: {
    label: "Bekreftet",
    description: "Dagene er dine. Vi tar kontakt om det praktiske i god tid.",
    className: "bg-brand text-white",
    Icon: CircleCheck,
  },
  DECLINED: {
    label: "Avslått",
    description: "Vi fikk dessverre ikke til denne datoen.",
    className: "bg-ink/10 text-ink-muted",
    Icon: CircleX,
  },
  CANCELLED: {
    label: "Avbestilt",
    description: "Denne bookingen er avbestilt, og dagene er ledige igjen.",
    className: "bg-ink/10 text-ink-muted",
    Icon: CircleX,
  },
  COMPLETED: {
    label: "Gjennomført",
    description: "Takk for at du leide av oss.",
    className: "bg-ink/10 text-ink-muted",
    Icon: CircleCheck,
  },
};

type LookupProps = {
  reference: string;
  token: string;
  contact: Contact;
};

export function BookingLookup({ reference, token, contact }: LookupProps) {
  const [booking, setBooking] = useState<Booking | null>(null);
  const [cancellable, setCancellable] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    let active = true;

    getBookingByReference(reference, token)
      .then((data) => {
        if (!active) return;
        setBooking(data.booking);
        setCancellable(data.cancellable);
      })
      .catch((cause: unknown) => {
        if (!active) return;
        setError(
          cause instanceof BookingError
            ? cause.message
            : "Klarte ikke å hente bookingen akkurat nå.",
        );
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [reference, token]);

  async function confirmCancel() {
    setCancelling(true);
    setError(null);

    try {
      const data = await cancelBooking(reference, token);
      setBooking(data.booking);
      setCancellable(false);
      setConfirming(false);
    } catch (cause) {
      setError(
        cause instanceof BookingError
          ? cause.message
          : "Klarte ikke å avbestille. Ta kontakt med oss.",
      );
    } finally {
      setCancelling(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-3 text-ink-muted">
        <LoaderCircle className="size-4 animate-spin" aria-hidden />
        Henter bookingen …
      </div>
    );
  }

  if (!booking) {
    return (
      <Card>
        <h1 className="font-display text-3xl text-ink leading-tight">
          Fant ikke bookingen
        </h1>
        <p className="mt-4 text-ink-muted leading-relaxed">
          {error ??
            "Lenken ser ut til å være ufullstendig. Åpne lenken du fikk da du booket, eller ta kontakt med oss."}
        </p>
        <ContactLine contact={contact} />
        <BackHome />
      </Card>
    );
  }

  const status = STATUS[booking.status];

  return (
    <Card>
      <span
        className={`inline-flex items-center gap-2 rounded-full px-3 py-1 font-medium text-xs ${status.className}`}
      >
        <status.Icon className="size-3.5" strokeWidth={2} aria-hidden />
        {status.label}
      </span>

      <h1 className="mt-5 font-display text-3xl text-ink leading-tight md:text-4xl">
        {booking.space.name}
      </h1>
      <p className="mt-2 text-ink-muted">
        {formatRange(booking.startDate, booking.endDate)}
      </p>
      <p className="mt-4 text-ink-muted text-sm leading-relaxed">{status.description}</p>

      <dl className="mt-8 space-y-3 border-ink/10 border-y py-6 text-sm">
        <Row label="Referanse">
          <span className="font-mono tracking-wider">{booking.reference}</span>
        </Row>
        <Row label="Navn">
          {booking.guest.firstName} {booking.guest.lastName}
        </Row>
        <Row label="Gjester">{booking.guests}</Row>
        {booking.purpose ? <Row label="Anledning">{booking.purpose}</Row> : null}
        <Row label="Dager">{booking.days}</Row>
        <Row label="Leie">{formatPrice(booking.dayTotal)}</Row>
        {booking.cleaningFee > 0 ? (
          <Row label="Utvask">{formatPrice(booking.cleaningFee)}</Row>
        ) : null}
        <Row label="Totalt">
          <span className="font-medium text-ink">{formatPrice(booking.total)}</span>
        </Row>
      </dl>

      {error ? (
        <p
          role="alert"
          className="mt-6 flex items-start gap-2.5 rounded-sm bg-red-50 p-3.5 text-red-800 text-sm ring-1 ring-red-200"
        >
          <TriangleAlert className="mt-0.5 size-4 shrink-0" strokeWidth={1.75} aria-hidden />
          {error}
        </p>
      ) : null}

      {cancellable ? (
        <div className="mt-8">
          {confirming ? (
            <div className="rounded-sm bg-sand p-5 ring-1 ring-ink/10">
              <p className="font-medium text-ink text-sm">Avbestille denne bookingen?</p>
              <p className="mt-2 text-ink-muted text-sm leading-relaxed">
                Dagene blir ledige for andre med én gang, og dette kan ikke angres.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={confirmCancel}
                  disabled={cancelling}
                  className="inline-flex items-center gap-2 rounded-sm bg-red-700 px-5 py-2.5 font-medium text-sm text-white transition-colors hover:bg-red-800 disabled:opacity-60"
                >
                  {cancelling ? (
                    <LoaderCircle className="size-4 animate-spin" aria-hidden />
                  ) : null}
                  Ja, avbestill
                </button>
                <button
                  type="button"
                  onClick={() => setConfirming(false)}
                  disabled={cancelling}
                  className="rounded-sm px-5 py-2.5 font-medium text-ink-muted text-sm transition-colors hover:text-ink"
                >
                  Behold bookingen
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirming(true)}
              className="text-ink-muted text-sm underline underline-offset-4 transition-colors hover:text-red-700"
            >
              Avbestill bookingen
            </button>
          )}
        </div>
      ) : null}

      <ContactLine contact={contact} />
      <BackHome />
    </Card>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-sm bg-white p-8 ring-1 ring-ink/10 md:p-12">{children}</div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="text-ink-muted">{label}</dt>
      <dd className="text-ink">{children}</dd>
    </div>
  );
}

function ContactLine({ contact }: { contact: Contact }) {
  return (
    <p className="mt-8 text-ink-muted text-sm leading-relaxed">
      Spørsmål? Kontakt {contact.name} på{" "}
      <a
        href={`mailto:${contact.email}`}
        className="underline underline-offset-4 transition-colors hover:text-brand-deep"
      >
        {contact.email}
      </a>{" "}
      eller{" "}
      <a
        href={`tel:${contact.phone.replace(/\s/g, "")}`}
        className="underline underline-offset-4 transition-colors hover:text-brand-deep"
      >
        {contact.phone}
      </a>
      .
    </p>
  );
}

function BackHome() {
  return (
    <Link
      href="/"
      className="mt-6 inline-flex items-center gap-2 text-ink-muted text-sm transition-colors hover:text-brand-deep"
    >
      <ArrowLeft className="size-4" strokeWidth={1.75} aria-hidden />
      Tilbake til forsiden
    </Link>
  );
}
