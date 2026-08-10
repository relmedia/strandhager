"use client";

import { useEffect, useRef, useState } from "react";

import {
  ArrowUpRight,
  CircleCheck,
  LoaderCircle,
  TriangleAlert,
  UserPlus,
} from "lucide-react";

import {
  EMAIL_PATTERN,
  TextAreaField,
  TextField,
  phoneDigits,
} from "@/components/booking/fields";
import { WaitlistError, joinWaitlist } from "@/lib/waitlist";
import type { ParselleneContent } from "@/lib/site-content";

type Waitlist = ParselleneContent["waitlist"];

type Draft = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  message: string;
};

const BLANK: Draft = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  message: "",
};

/**
 * The closing card of the section: what the waiting list is, and how to get on
 * it. Signing up here writes straight into the board's dashboard, which is why
 * it leads; the Facebook group stays as the alternative.
 */
export function WaitlistCard({ waitlist }: { waitlist: Waitlist }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Draft>(BLANK);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{ position: number } | null>(null);

  const firstField = useRef<HTMLDivElement>(null);

  // Opening the form should land the reader in it, not leave them looking at
  // the button they just pressed.
  useEffect(() => {
    if (!open) return;
    firstField.current?.querySelector("input")?.focus();
  }, [open]);

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) =>
    setDraft((current) => ({ ...current, [key]: value }));

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSending(true);
    setError(null);

    try {
      const result = await joinWaitlist({
        firstName: draft.firstName,
        lastName: draft.lastName,
        email: draft.email,
        phone: draft.phone || undefined,
        message: draft.message || undefined,
      });

      setDone({ position: result.position });
      setDraft(BLANK);
    } catch (cause) {
      setError(
        cause instanceof WaitlistError
          ? cause.message
          : "Klarte ikke å sende inn akkurat nå. Prøv igjen om litt.",
      );
    } finally {
      setSending(false);
    }
  }

  return (
    <div
      data-reveal
      className="mt-6 rounded-sm bg-white text-ink shadow-brand-deep/5 shadow-sm ring-1 ring-ink/5"
    >
      <div className="grid gap-8 p-8 md:grid-cols-12 md:items-center md:p-12">
        <div className="md:col-span-7">
          <h3 className="font-display text-2xl tracking-tight md:text-3xl">
            {waitlist.title}
          </h3>
          <p className="mt-4 max-w-xl text-base text-ink-muted leading-relaxed">
            {waitlist.body}
          </p>
        </div>

        <div className="flex flex-col gap-3 md:col-span-5">
          <button
            type="button"
            onClick={() => setOpen((was) => !was)}
            aria-expanded={open}
            aria-controls="venteliste-skjema"
            className="group inline-flex items-center justify-between gap-3 rounded-sm bg-brand px-6 py-3.5 font-medium text-sm text-white transition-colors hover:bg-brand-deep"
          >
            Sett meg på ventelisten
            <UserPlus
              className="size-4 shrink-0 transition-transform duration-300 group-hover:scale-110"
              strokeWidth={1.75}
              aria-hidden
            />
          </button>

          <a
            href={waitlist.facebookUrl}
            target="_blank"
            rel="noreferrer noopener"
            className="group inline-flex items-center justify-between gap-3 rounded-sm px-6 py-3.5 font-medium text-ink text-sm ring-1 ring-ink/15 transition-colors hover:bg-sand hover:ring-ink/25"
          >
            {waitlist.facebookLabel}
            <ArrowUpRight
              className="size-4 shrink-0 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
              aria-hidden
            />
          </a>

        </div>
      </div>

      {open ? (
        <div
          id="venteliste-skjema"
          className="border-ink/10 border-t px-8 pb-8 md:px-12 md:pb-12"
        >
          {done ? (
            <Confirmation
              position={done.position}
              email={waitlist.email}
              contactName={waitlist.contactName}
              onClose={() => {
                setDone(null);
                setOpen(false);
              }}
            />
          ) : (
            <form onSubmit={submit} className="pt-8">
              <p className="font-medium text-ink text-xs tracking-[0.22em] uppercase">
                Meld deg på ventelisten
              </p>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div ref={firstField}>
                  <TextField
                    label="Fornavn"
                    value={draft.firstName}
                    onChange={(value) => set("firstName", value)}
                    autoComplete="given-name"
                    maxLength={80}
                    required
                  />
                </div>

                <TextField
                  label="Etternavn"
                  value={draft.lastName}
                  onChange={(value) => set("lastName", value)}
                  autoComplete="family-name"
                  maxLength={80}
                  required
                />

                <TextField
                  label="E-post"
                  type="email"
                  value={draft.email}
                  onChange={(value) => set("email", value)}
                  autoComplete="email"
                  inputMode="email"
                  pattern={EMAIL_PATTERN}
                  title="Skriv en e-postadresse, for eksempel navn@epost.no"
                  maxLength={120}
                  required
                />

                <TextField
                  label="Telefon (valgfritt)"
                  type="tel"
                  value={draft.phone}
                  onChange={(value) => set("phone", value)}
                  autoComplete="tel"
                  inputMode="tel"
                  clean={phoneDigits}
                  maxLength={40}
                />

                <TextAreaField
                  label="Melding (valgfritt)"
                  value={draft.message}
                  onChange={(value) => set("message", value)}
                  rows={3}
                  className="sm:col-span-2"
                />
              </div>

              {error ? (
                <p
                  role="alert"
                  className="mt-5 flex items-start gap-2.5 rounded-sm bg-red-50 p-3.5 text-red-800 text-sm ring-1 ring-red-200"
                >
                  <TriangleAlert
                    className="mt-0.5 size-4 shrink-0"
                    strokeWidth={1.75}
                    aria-hidden
                  />
                  {error}
                </p>
              ) : null}

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <button
                  type="submit"
                  disabled={sending}
                  className="inline-flex items-center gap-2 rounded-sm bg-brand px-6 py-3 font-medium text-sm text-white transition-colors hover:bg-brand-deep disabled:opacity-60"
                >
                  {sending ? (
                    <LoaderCircle className="size-4 animate-spin" aria-hidden />
                  ) : null}
                  Send inn
                </button>

                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  disabled={sending}
                  className="rounded-sm px-4 py-3 font-medium text-ink-muted text-sm transition-colors hover:text-ink"
                >
                  Avbryt
                </button>

                <p className="text-ink-muted/80 text-xs leading-relaxed sm:ml-auto sm:max-w-xs">
                  Opplysningene brukes bare til å kontakte deg om en ledig parsell.
                </p>
              </div>
            </form>
          )}
        </div>
      ) : null}
    </div>
  );
}

function Confirmation({
  position,
  email,
  contactName,
  onClose,
}: {
  position: number;
  email: string;
  contactName: string;
  onClose: () => void;
}) {
  return (
    <div className="flex flex-col items-start gap-4 pt-8 sm:flex-row sm:items-center">
      <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-brand-soft/60 text-brand-deep">
        <CircleCheck className="size-5.5" strokeWidth={1.75} aria-hidden />
      </span>

      <div className="flex-1">
        <p className="font-display text-xl text-ink">Du står på ventelisten</p>
        <p className="mt-1.5 text-ink-muted text-sm leading-relaxed">
          Du er nummer {position} i køen. Vi tar kontakt på e-post når det blir en
          parsell ledig. Har du spørsmål i mellomtiden, ta kontakt med {contactName}{" "}
          på{" "}
          <a
            href={`mailto:${email}`}
            className="underline underline-offset-4 transition-colors hover:text-brand-deep"
          >
            {email}
          </a>
          .
        </p>
      </div>

      <button
        type="button"
        onClick={onClose}
        className="rounded-sm px-4 py-2.5 font-medium text-ink-muted text-sm transition-colors hover:text-ink"
      >
        Lukk
      </button>
    </div>
  );
}
