"use client";

import { useState } from "react";

import { Check, Copy, Hourglass } from "lucide-react";

import type { Booking } from "@/lib/booking";
import { formatPrice, formatRange } from "@/lib/dates";

/** Absolute link the guest uses to look up or call off their booking. */
export function cancelUrl(reference: string, token: string): string {
  const base = typeof window === "undefined" ? "" : window.location.origin;
  return `${base}/booking/${reference}?token=${token}`;
}

type ReceiptProps = {
  booking: Booking;
  cancelToken: string;
  onReset: () => void;
};

export function BookingReceipt({ booking, cancelToken, onReset }: ReceiptProps) {
  const link = cancelUrl(booking.reference, cancelToken);

  return (
    <div>
      <span className="inline-flex items-center gap-2 rounded-full bg-brand-soft/60 px-3 py-1 font-medium text-brand-deep text-xs">
        <Hourglass className="size-3.5" strokeWidth={2} aria-hidden />
        Venter på svar
      </span>

      <h3 className="mt-5 font-display text-2xl text-ink leading-tight md:text-3xl">
        Forespørselen er sendt
      </h3>
      <p className="mt-3 text-ink-muted text-sm leading-relaxed">
        Vi har holdt av {formatRange(booking.startDate, booking.endDate)} for deg. Du
        hører fra oss så snart forespørselen er behandlet.
      </p>

      <dl className="mt-7 space-y-3 border-ink/10 border-y py-6 text-sm">
        <div className="flex items-baseline justify-between gap-4">
          <dt className="text-ink-muted">Referanse</dt>
          <dd className="font-medium font-mono text-ink tracking-wider">
            {booking.reference}
          </dd>
        </div>
        <div className="flex items-baseline justify-between gap-4">
          <dt className="text-ink-muted">Dager</dt>
          <dd className="text-ink">{booking.days}</dd>
        </div>
        <div className="flex items-baseline justify-between gap-4">
          <dt className="text-ink-muted">Totalt</dt>
          <dd className="font-medium text-ink">{formatPrice(booking.total)}</dd>
        </div>
      </dl>

      <div className="mt-6">
        <p className="font-medium text-ink text-sm">Lenken din</p>
        <p className="mt-1.5 text-ink-muted/80 text-xs leading-relaxed">
          Ta vare på denne. Den er den eneste måten å se eller avbestille bookingen på.
        </p>
        <CopyLink link={link} />
      </div>

      <button
        type="button"
        onClick={onReset}
        className="mt-7 text-ink-muted text-sm underline-offset-4 transition-colors hover:text-brand-deep hover:underline"
      >
        Book flere dager
      </button>
    </div>
  );
}

function CopyLink({ link }: { link: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Clipboard access can be blocked; the link is selectable either way.
    }
  }

  return (
    <div className="mt-3 flex items-stretch gap-2">
      <input
        readOnly
        value={link}
        aria-label="Lenke til bookingen din"
        onFocus={(event) => event.currentTarget.select()}
        className="min-w-0 flex-1 rounded-sm border border-ink/15 bg-white px-3 py-2 text-ink-muted text-xs"
      />
      <button
        type="button"
        onClick={copy}
        className="inline-flex shrink-0 items-center gap-1.5 rounded-sm bg-ink px-3 py-2 font-medium text-white text-xs transition-colors hover:bg-brand-deep"
      >
        {copied ? (
          <Check className="size-3.5" strokeWidth={2} aria-hidden />
        ) : (
          <Copy className="size-3.5" strokeWidth={2} aria-hidden />
        )}
        {copied ? "Kopiert" : "Kopier"}
      </button>
    </div>
  );
}
