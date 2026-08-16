"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { CircleCheck, LoaderCircle, Mail, Phone, TriangleAlert, X } from "lucide-react";

import {
  EMAIL_PATTERN,
  SelectField,
  TextAreaField,
  TextField,
  phoneDigits,
} from "@/components/booking/fields";
import { TURNSTILE_SITE_KEY, Turnstile } from "@/components/turnstile";
import { ContactError, sendContactMessage } from "@/lib/contact";
import type { ContactContent } from "@/lib/site-content";

export type Topic = "GENERAL" | "FELLESHUSET" | "PARSELLENE";

const TOPICS: { value: Topic; label: string }[] = [
  { value: "GENERAL", label: "Generell henvendelse" },
  { value: "FELLESHUSET", label: "Utleie av Felleshuset" },
  { value: "PARSELLENE", label: "Parsellene og ventelisten" },
];

const topicLabel = (topic: Topic) =>
  TOPICS.find((option) => option.value === topic)?.label ?? "Generell henvendelse";

type Draft = {
  topic: Topic;
  name: string;
  email: string;
  phone: string;
  message: string;
};

const BLANK: Draft = { topic: "GENERAL", name: "", email: "", phone: "", message: "" };

type ContactDialogProps = {
  open: boolean;
  onClose: () => void;
  /** The people behind each topic, shown as the direct alternative. */
  contact: ContactContent;
  /** Preselected topic, e.g. FELLESHUSET when opened from the booking panel. */
  initialTopic?: Topic;
};

/** The contact form behind the Kontakt button in the header. */
export function ContactDialog({
  open,
  onClose,
  contact,
  initialTopic = "GENERAL",
}: ContactDialogProps) {
  const blank: Draft = { ...BLANK, topic: initialTopic };
  const [draft, setDraft] = useState<Draft>(blank);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [botToken, setBotToken] = useState<string | null>(null);

  const panel = useRef<HTMLDivElement>(null);

  // The page behind the dialog should neither scroll nor react to Escape
  // presses meant for the dialog.
  useEffect(() => {
    if (!open) return;

    document.body.style.overflow = "hidden";
    panel.current?.querySelector("input")?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      // Ignored when something inside (like the open select) took the press.
      if (event.key === "Escape" && !event.defaultPrevented) onClose();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) =>
    setDraft((current) => ({ ...current, [key]: value }));

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSending(true);
    setError(null);

    try {
      await sendContactMessage({
        name: draft.name,
        email: draft.email,
        phone: draft.phone || undefined,
        subject: topicLabel(draft.topic),
        message: draft.message,
        turnstileToken: botToken ?? undefined,
      });

      setDone(true);
      setDraft(blank);
    } catch (cause) {
      setError(
        cause instanceof ContactError
          ? cause.message
          : "Klarte ikke å sende meldingen akkurat nå. Prøv igjen om litt.",
      );
    } finally {
      setSending(false);
    }
  }

  function close() {
    setDone(false);
    setError(null);
    onClose();
  }

  if (!open) return null;

  // Portalled to <body>: the header is transformed by GSAP, which would
  // otherwise turn it into the containing block for this fixed overlay.
  return createPortal(
    <div className="fixed inset-0 z-100 flex items-end justify-center p-0 sm:items-center sm:p-6">
      <button
        type="button"
        aria-label="Lukk"
        onClick={close}
        className="absolute inset-0 bg-ink/50 backdrop-blur-sm"
      />

      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-label="Kontakt oss"
        className="relative max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-white p-6 text-ink shadow-2xl sm:rounded-sm md:p-8"
      >
        <button
          type="button"
          onClick={close}
          aria-label="Lukk"
          className="absolute top-4 right-4 flex size-9 items-center justify-center rounded-full text-ink-muted transition-colors hover:bg-sand hover:text-ink"
        >
          <X className="size-4.5" strokeWidth={1.75} aria-hidden />
        </button>

        {done ? (
          <div className="flex flex-col items-start gap-4 py-4">
            <span className="inline-flex size-11 items-center justify-center rounded-full bg-brand-soft/60 text-brand-deep">
              <CircleCheck className="size-5.5" strokeWidth={1.75} aria-hidden />
            </span>
            <div>
              <p className="font-display text-ink text-xl">Takk for meldingen!</p>
              <p className="mt-1.5 text-ink-muted text-sm leading-relaxed">
                Vi har mottatt henvendelsen din og svarer deg på e-post så snart vi
                kan.
              </p>
            </div>
            <button
              type="button"
              onClick={close}
              className="rounded-sm bg-brand px-5 py-2.5 font-medium text-sm text-white transition-colors hover:bg-brand-deep"
            >
              Lukk
            </button>
          </div>
        ) : (
          <form onSubmit={submit}>
            <p className="font-medium text-brand-deep text-xs tracking-[0.22em] uppercase">
              Kontakt
            </p>
            <h2 className="mt-2 font-display text-2xl tracking-tight md:text-3xl">
              Hva kan vi hjelpe deg med?
            </h2>
            <p className="mt-2 text-ink-muted text-sm leading-relaxed">
              Send oss en melding, så svarer vi deg på e-post.
            </p>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <SelectField
                label="Hva gjelder det?"
                value={draft.topic}
                onChange={(value) => set("topic", value as Topic)}
                options={TOPICS}
                className="sm:col-span-2"
              />

              <TextField
                label="Navn"
                value={draft.name}
                onChange={(value) => set("name", value)}
                autoComplete="name"
                maxLength={120}
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
                className="sm:col-span-2"
              />

              <TextAreaField
                label="Melding"
                value={draft.message}
                onChange={(value) => set("message", value)}
                rows={4}
                className="sm:col-span-2"
              />
            </div>

            {TURNSTILE_SITE_KEY ? (
              <Turnstile onToken={setBotToken} className="mt-5" />
            ) : null}

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

            <div className="mt-6">
              <button
                type="submit"
                disabled={
                  sending ||
                  !draft.message.trim() ||
                  (Boolean(TURNSTILE_SITE_KEY) && !botToken)
                }
                className="inline-flex items-center gap-2 rounded-sm bg-brand px-6 py-3 font-medium text-sm text-white transition-colors hover:bg-brand-deep disabled:opacity-60"
              >
                {sending ? (
                  <LoaderCircle className="size-4 animate-spin" aria-hidden />
                ) : null}
                Send melding
              </button>
            </div>

            <DirectContact topic={draft.topic} contact={contact} />
          </form>
        )}
      </div>
    </div>,
    document.body,
  );
}

/**
 * Whoever answers the chosen topic, so nobody has to use the form: bookings
 * and general questions go to the Felleshuset contact, plot questions to the
 * one running the waitlist.
 */
function DirectContact({
  topic,
  contact,
}: {
  topic: Topic;
  contact: ContactContent;
}) {
  const person = topic === "PARSELLENE" ? contact.plots : contact.booking;
  const phone = person.phone ?? null;

  return (
    <div className="mt-6 rounded-sm bg-sand px-4 py-3.5">
      <p className="text-ink-muted text-xs">
        Du kan også kontakte {person.name} direkte:
      </p>
      <div className="mt-1.5 flex flex-wrap gap-x-5 gap-y-1">
        <a
          href={`mailto:${person.email}`}
          className="inline-flex items-center gap-1.5 text-ink text-sm underline-offset-4 transition-colors hover:text-brand-deep hover:underline"
        >
          <Mail className="size-3.5 text-ink-muted" strokeWidth={1.75} aria-hidden />
          {person.email}
        </a>
        {phone ? (
          <a
            href={`tel:${phone.replace(/\s/g, "")}`}
            className="inline-flex items-center gap-1.5 text-ink text-sm underline-offset-4 transition-colors hover:text-brand-deep hover:underline"
          >
            <Phone className="size-3.5 text-ink-muted" strokeWidth={1.75} aria-hidden />
            {phone}
          </a>
        ) : null}
      </div>
    </div>
  );
}
