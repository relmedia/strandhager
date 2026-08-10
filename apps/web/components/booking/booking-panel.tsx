"use client";

import { useEffect, useMemo, useState } from "react";

import { CalendarDays, LoaderCircle, TriangleAlert } from "lucide-react";

import {
  AvailabilityCalendar,
  nextSelection,
  type Selection,
} from "@/components/booking/availability-calendar";
import {
  EMAIL_PATTERN,
  phoneDigits,
  TextAreaField,
  TextField,
} from "@/components/booking/fields";
import { BookingReceipt } from "@/components/booking/booking-receipt";
import { PriceRow } from "@/components/booking/price-cards";
import {
  BookingError,
  createBooking,
  getAvailability,
  getQuote,
  type Availability,
  type Booking,
  type Quote,
  type Space,
} from "@/lib/booking";
import {
  addDays,
  addMonths,
  formatPrice,
  formatRange,
  startOfMonth,
  todayIso,
} from "@/lib/dates";

/** How far ahead the calendar lets people look. */
const MONTHS_AHEAD = 12;

type Details = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  company: string;
  guests: string;
  purpose: string;
  message: string;
};

const EMPTY: Details = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  company: "",
  guests: "",
  purpose: "",
  message: "",
};

export function BookingPanel({ space }: { space: Space }) {
  const [availability, setAvailability] = useState<Availability | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [month, setMonth] = useState(() => startOfMonth(todayIso()));
  const [selection, setSelection] = useState<Selection | null>(null);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [details, setDetails] = useState<Details>(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ booking: Booking; cancelToken: string } | null>(
    null,
  );

  // A range may not stretch across days that are taken or shut, so the two
  // are one and the same when working out what the next click means.
  const unavailableDates = useMemo(
    () =>
      new Set([
        ...(availability?.bookedDates ?? []),
        ...(availability?.closedDates ?? []),
      ]),
    [availability],
  );

  async function loadAvailability() {
    const today = todayIso();
    try {
      const data = await getAvailability(
        space.slug,
        today,
        addDays(addMonths(today, MONTHS_AHEAD), -1),
      );
      setAvailability(data);
      setLoadFailed(false);
      setMonth((current) =>
        current < startOfMonth(data.minDate) ? startOfMonth(data.minDate) : current,
      );
    } catch {
      setLoadFailed(true);
    }
  }

  useEffect(() => {
    void loadAvailability();
    // Availability only depends on the space, which never changes for a page.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [space.slug]);

  // Re-price whenever a complete range is chosen.
  useEffect(() => {
    if (!selection?.end) {
      setQuote(null);
      setQuoteError(null);
      return;
    }

    let cancelled = false;
    const { start, end } = selection;

    getQuote(space.slug, start, end)
      .then((next) => {
        if (!cancelled) {
          setQuote(next);
          setQuoteError(null);
        }
      })
      .catch((cause: unknown) => {
        if (cancelled) return;
        setQuote(null);
        setQuoteError(
          cause instanceof BookingError ? cause.message : "Klarte ikke å hente pris",
        );
      });

    return () => {
      cancelled = true;
    };
  }, [selection, space.slug]);

  function handleSelect(date: string) {
    setError(null);
    setSelection((current) => nextSelection(current, date, unavailableDates));
  }

  function reset() {
    setResult(null);
    setSelection(null);
    setDetails(EMPTY);
    setError(null);
    void loadAvailability();
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!selection?.end) return;

    setSubmitting(true);
    setError(null);

    try {
      const created = await createBooking({
        space: space.slug,
        startDate: selection.start,
        endDate: selection.end,
        guests: Number(details.guests),
        firstName: details.firstName,
        lastName: details.lastName,
        email: details.email,
        phone: details.phone,
        company: details.company || undefined,
        purpose: details.purpose || undefined,
        message: details.message || undefined,
      });

      setResult({ booking: created.booking, cancelToken: created.cancelToken });
      // The days are held now, so the calendar beside the receipt should show
      // them as taken rather than still pickable.
      setSelection(null);
      void loadAvailability();
    } catch (cause) {
      setError(
        cause instanceof BookingError
          ? cause.message
          : "Klarte ikke å sende forespørselen. Prøv igjen om litt.",
      );
      // The days may have been taken while the form was open.
      void loadAvailability();
    } finally {
      setSubmitting(false);
    }
  }

  const field = (key: keyof Details) => (value: string) =>
    setDetails((current) => ({ ...current, [key]: value }));

  const rangeReady = Boolean(selection?.end);

  return (
    <div
      data-reveal
      className="mt-8 overflow-hidden rounded-sm bg-white ring-1 ring-ink/10"
    >
      <div className="grid md:grid-cols-12">
        <div className="border-ink/10 border-b p-7 md:col-span-7 md:border-r md:border-b-0 md:p-10">
          <div className="flex items-center gap-4">
            <span className="h-px w-10 bg-brand/60" />
            <p className="font-medium text-brand-deep text-xs tracking-[0.26em] uppercase">
              Velg dager
            </p>
          </div>

          <p className="mt-5 text-ink-muted text-sm leading-relaxed">
            Trykk på en dag for å velge den. Trykk på en dag til for å leie flere dager på
            rad.
          </p>

          <div className="mt-8">
            {loadFailed ? (
              <Notice tone="error">
                Klarte ikke å hente kalenderen akkurat nå. Prøv å laste siden på nytt,
                eller ta kontakt med oss direkte.
              </Notice>
            ) : (
              <AvailabilityCalendar
                month={month}
                onMonthChange={setMonth}
                availability={availability}
                selection={selection}
                onSelect={handleSelect}
                monthsAhead={MONTHS_AHEAD}
              />
            )}
          </div>
        </div>

        <aside className="bg-sand/50 p-7 md:col-span-5 md:p-10">
          {result ? (
            <BookingReceipt
              booking={result.booking}
              cancelToken={result.cancelToken}
              onReset={reset}
            />
          ) : (
            <form onSubmit={submit} noValidate={false}>
              <div className="flex items-center gap-4">
                <span className="h-px w-10 bg-brand/60" />
                <p className="font-medium text-brand-deep text-xs tracking-[0.26em] uppercase">
                  Din booking
                </p>
              </div>

              <Summary
                selection={selection}
                quote={quote}
                quoteError={quoteError}
                cleaningFee={space.cleaningFee}
              />

              <fieldset
                disabled={!rangeReady || submitting}
                className="mt-8 space-y-4 transition-opacity duration-300 disabled:opacity-40"
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <TextField
                    label="Fornavn"
                    value={details.firstName}
                    onChange={field("firstName")}
                    autoComplete="given-name"
                    required
                  />
                  <TextField
                    label="Etternavn"
                    value={details.lastName}
                    onChange={field("lastName")}
                    autoComplete="family-name"
                    required
                  />
                </div>

                <TextField
                  label="E-post"
                  type="email"
                  value={details.email}
                  onChange={field("email")}
                  inputMode="email"
                  pattern={EMAIL_PATTERN}
                  title="Skriv en e-postadresse, for eksempel navn@eksempel.no"
                  autoComplete="email"
                  required
                />

                <TextField
                  label="Telefon"
                  type="tel"
                  value={details.phone}
                  onChange={field("phone")}
                  inputMode="tel"
                  clean={phoneDigits}
                  pattern="\+?\d{8,15}"
                  maxLength={16}
                  title="Skriv telefonnummeret med tall, for eksempel 95782508"
                  autoComplete="tel"
                  required
                />

                <div className="grid gap-4 sm:grid-cols-2">
                  <TextField
                    label="Antall gjester"
                    type="number"
                    value={details.guests}
                    onChange={field("guests")}
                    min={1}
                    max={space.maxGuests}
                    placeholder={`1–${space.maxGuests}`}
                    required
                  />
                  <TextField
                    label="Anledning"
                    value={details.purpose}
                    onChange={field("purpose")}
                    placeholder="Bryllup, kurs …"
                  />
                </div>

                <TextField
                  label="Lag eller bedrift"
                  value={details.company}
                  onChange={field("company")}
                  hint="Valgfritt"
                  autoComplete="organization"
                />

                <TextAreaField
                  label="Melding"
                  value={details.message}
                  onChange={field("message")}
                  placeholder="Er det noe vi bør vite?"
                />
              </fieldset>

              {error ? (
                <div className="mt-6">
                  <Notice tone="error">{error}</Notice>
                </div>
              ) : null}

              <button
                type="submit"
                disabled={!rangeReady || submitting || Boolean(quoteError)}
                className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-sm bg-brand px-6 py-3.5 font-medium text-sm text-white transition-colors hover:bg-brand-deep disabled:cursor-not-allowed disabled:bg-ink/20"
              >
                {submitting ? (
                  <LoaderCircle className="size-4 animate-spin" aria-hidden />
                ) : null}
                {submitting ? "Sender …" : "Send forespørsel"}
              </button>

              <p className="mt-4 text-ink-muted/80 text-xs leading-relaxed">
                Forespørselen er ikke bindende. Vi holder av dagene til vi har svart deg,
                og du betaler først etter at leien er bekreftet.
              </p>
            </form>
          )}
        </aside>
      </div>
    </div>
  );
}

function Summary({
  selection,
  quote,
  quoteError,
  cleaningFee,
}: {
  selection: Selection | null;
  quote: Quote | null;
  quoteError: string | null;
  cleaningFee: number;
}) {
  if (!selection) {
    return (
      <p className="mt-6 flex items-start gap-2.5 text-ink-muted text-sm leading-relaxed">
        <CalendarDays className="mt-0.5 size-4 shrink-0" strokeWidth={1.75} aria-hidden />
        Velg dagene du vil leie i kalenderen, så regner vi ut prisen.
      </p>
    );
  }

  if (!selection.end) {
    return (
      <p className="mt-6 flex items-start gap-2.5 text-ink-muted text-sm leading-relaxed">
        <CalendarDays className="mt-0.5 size-4 shrink-0" strokeWidth={1.75} aria-hidden />
        Trykk på samme dag én gang til for å leie bare{" "}
        {formatRange(selection.start, selection.start)}, eller velg en senere dag for å
        leie flere dager.
      </p>
    );
  }

  if (quoteError) {
    return (
      <div className="mt-6">
        <Notice tone="error">{quoteError}</Notice>
      </div>
    );
  }

  return (
    <div className="mt-6">
      <p className="font-display text-ink text-xl leading-snug">
        {formatRange(selection.start, selection.end)}
      </p>

      {quote ? (
        <div className="mt-5 space-y-2.5">
          {quote.days.map((day) => (
            <PriceRow
              key={day.date}
              label={`${day.label.toLowerCase()} · ${day.date.slice(8)}.${day.date.slice(5, 7)}`}
              amount={day.amount}
              muted
            />
          ))}

          {quote.cleaningFee > 0 ? (
            <PriceRow label="Utvask" amount={quote.cleaningFee} muted />
          ) : null}

          <div className="mt-4 flex items-baseline justify-between gap-4 border-ink/10 border-t pt-4">
            <span className="font-medium text-ink text-sm">Totalt</span>
            <span className="font-display text-2xl text-ink">
              {formatPrice(quote.total)}
            </span>
          </div>
        </div>
      ) : (
        <div className="mt-5 space-y-2.5" aria-hidden>
          <div className="h-4 w-2/3 animate-pulse rounded-sm bg-ink/8" />
          <div className="h-4 w-1/2 animate-pulse rounded-sm bg-ink/8" />
          <div className="h-8 w-1/3 animate-pulse rounded-sm bg-ink/8" />
          <span className="sr-only">Regner ut pris med utvask på {cleaningFee} kroner</span>
        </div>
      )}
    </div>
  );
}

function Notice({ tone, children }: { tone: "error"; children: React.ReactNode }) {
  return (
    <p
      role="alert"
      className={`flex items-start gap-2.5 rounded-sm p-3.5 text-sm leading-relaxed ${
        tone === "error" ? "bg-red-50 text-red-800 ring-1 ring-red-200" : ""
      }`}
    >
      <TriangleAlert className="mt-0.5 size-4 shrink-0" strokeWidth={1.75} aria-hidden />
      {children}
    </p>
  );
}
