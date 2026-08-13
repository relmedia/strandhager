"use client";

import { formatFullDate, formatMoney, formatTimestamp } from "@/lib/format";
import type { Booking } from "@/types/booking";

/**
 * The booking laid out as the actual rental agreement — letterhead, the two
 * parties, the rental facts, the price and the signatures — so it can be
 * printed or archived as-is. Deliberately white in dark mode too: it is a
 * sheet of paper, not a dashboard panel.
 */
export function BookingDocument({ booking }: { booking: Booking }) {
  const guestName = `${booking.guest.firstName} ${booking.guest.lastName}`;

  return (
    <section className="overflow-hidden rounded-lg border bg-white text-neutral-900 print:rounded-none print:border-none">
      {/* Letterhead */}
      <header className="flex flex-wrap items-start justify-between gap-4 border-neutral-200 border-b px-6 py-5 sm:px-8">
        <div className="flex items-center gap-3">
          {/* Plain <img>: the logo is a small static asset that also has to print. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/logo.png" alt="" className="h-10 w-auto" />
          <div>
            <p className="font-semibold leading-tight">Ølberg strandhager</p>
            <p className="mt-0.5 text-neutral-500 text-xs">
              Strandhagane 50, 4053 Ræge · strandhager.no
            </p>
          </div>
        </div>

        <div className="text-right">
          <h2 className="font-semibold text-lg leading-tight">Leieavtale</h2>
          <p className="mt-0.5 text-neutral-500 text-xs">
            Referanse <span className="font-mono tracking-wider">{booking.reference}</span>
          </p>
        </div>
      </header>

      <div className="space-y-7 px-6 py-6 sm:px-8">
        <section>
          <DocHeading>1. Partene</DocHeading>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <Party
              label="Utleier"
              name="Ølberg strandhager ved hagestyret"
              lines={["felleshuset@strandhager.no", "957 82 508"]}
            />
            <Party
              label="Leietaker"
              name={guestName}
              lines={
                [booking.guest.company, booking.guest.email, booking.guest.phone].filter(
                  Boolean,
                ) as string[]
              }
            />
          </div>
        </section>

        <section>
          <DocHeading>2. Leien</DocHeading>
          <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-3">
            <Fact label="Lokale">{booking.space.name}</Fact>
            <Fact label="Fra">{formatFullDate(booking.startDate)}</Fact>
            <Fact label="Til">{formatFullDate(booking.endDate)}</Fact>
            <Fact label="Antall dager">{booking.days}</Fact>
            <Fact label="Antall gjester">{booking.guests}</Fact>
            <Fact label="Anledning">{booking.purpose ?? "—"}</Fact>
          </dl>
        </section>

        <section>
          <DocHeading>3. Pris</DocHeading>
          <dl className="mt-3 space-y-1.5 text-sm">
            <div className="flex items-baseline justify-between text-neutral-600">
              <dt>Leie, {booking.days} {booking.days === 1 ? "dag" : "dager"}</dt>
              <dd className="tabular-nums">{formatMoney(booking.dayTotal)}</dd>
            </div>
            {booking.cleaningFee > 0 ? (
              <div className="flex items-baseline justify-between text-neutral-600">
                <dt>Utvask</dt>
                <dd className="tabular-nums">{formatMoney(booking.cleaningFee)}</dd>
              </div>
            ) : null}
            <div className="flex items-baseline justify-between border-neutral-200 border-t pt-2 font-medium">
              <dt>Totalt inkl. mva.</dt>
              <dd className="tabular-nums">{formatMoney(booking.total)}</dd>
            </div>
          </dl>
        </section>

        {booking.message ? (
          <section>
            <DocHeading>4. Melding fra leietaker</DocHeading>
            <p className="mt-2.5 whitespace-pre-wrap text-neutral-600 text-sm leading-relaxed">
              {booking.message}
            </p>
          </section>
        ) : null}

        {/* Signatures */}
        <section className="border-neutral-200 border-t pt-6">
          <div className="grid gap-8 sm:grid-cols-2">
            <div>
              <DocHeading>Leietaker</DocHeading>
              {booking.signature ? (
                // A data URL drawn by the guest; next/image has nothing to optimize.
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={booking.signature}
                  alt={`Signaturen til ${guestName}`}
                  className="mt-2 h-16 w-auto max-w-full"
                />
              ) : (
                <div aria-hidden className="h-18" />
              )}
              <div className="border-neutral-300 border-t pt-1.5">
                <p className="text-sm">{guestName}</p>
                <p className="text-neutral-500 text-xs">
                  {booking.termsAcceptedAt
                    ? `Signert elektronisk ${formatTimestamp(booking.termsAcceptedAt)}`
                    : "Ikke signert"}
                </p>
              </div>
            </div>

            <div>
              <DocHeading>Utleier</DocHeading>
              {booking.confirmedAt ? (
                <div className="flex h-18 items-end pb-1.5">
                  <p className="font-serif text-lg italic">
                    {booking.confirmedByName ?? "Hagestyret"}
                  </p>
                </div>
              ) : (
                <div aria-hidden className="h-18" />
              )}
              <div className="border-neutral-300 border-t pt-1.5">
                <p className="text-sm">Ølberg strandhager ved hagestyret</p>
                <p className="text-neutral-500 text-xs">
                  {booking.confirmedAt
                    ? `Bekreftet elektronisk ${formatTimestamp(booking.confirmedAt)}`
                    : "Bekreftes elektronisk når bookingen godkjennes"}
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>

      <footer className="border-neutral-200 border-t bg-neutral-50 px-6 py-3 sm:px-8 print:bg-white">
        <p className="text-neutral-500 text-xs leading-relaxed">
          Forespørselen ble sendt inn {formatTimestamp(booking.createdAt)}
          {booking.termsAcceptedAt
            ? `, og leievilkårene for ${booking.space.name} ble godtatt ${formatTimestamp(booking.termsAcceptedAt)}`
            : ""}
          . Avtalen følger leievilkårene på strandhager.no.
        </p>
      </footer>
    </section>
  );
}

function DocHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="font-medium text-neutral-500 text-xs tracking-[0.14em] uppercase">
      {children}
    </h3>
  );
}

function Party({ label, name, lines }: { label: string; name: string; lines: string[] }) {
  return (
    <div className="rounded-md border border-neutral-200 p-3.5">
      <p className="font-medium text-neutral-500 text-xs tracking-[0.14em] uppercase">
        {label}
      </p>
      <p className="mt-1.5 font-medium text-sm">{name}</p>
      {lines.map((line) => (
        <p key={line} className="mt-0.5 text-neutral-600 text-sm">
          {line}
        </p>
      ))}
    </div>
  );
}

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-neutral-500 text-xs">{label}</dt>
      <dd className="mt-0.5">{children}</dd>
    </div>
  );
}
