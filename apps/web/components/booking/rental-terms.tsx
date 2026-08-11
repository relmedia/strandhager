"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

import { X } from "lucide-react";

import { SignaturePad } from "@/components/booking/signature-pad";
import type { Space } from "@/lib/booking";
import { formatPrice, formatRange, type IsoDate } from "@/lib/dates";

/** What the guest has filled in so far, woven into the agreement text. */
export type TermsFillIn = {
  /** Full name, or empty until the guest has typed one. */
  name: string;
  email: string;
  phone: string;
  /** The chosen days, once a complete range is picked. */
  period: { start: IsoDate; end: IsoDate } | null;
  /** The quoted total for those days, in whole kroner. */
  total: number | null;
};

/**
 * The rental terms the guest must accept before a booking request can be
 * sent. Everything that is known from the form and the API — the guest's
 * details, the chosen days, the price, the capacity — is filled in, so the
 * text reads as the actual agreement rather than a blank template.
 */
function termsSections(space: Space, fillIn: TermsFillIn) {
  const period = fillIn.period
    ? `Leieperioden for denne bookingen er ${formatRange(fillIn.period.start, fillIn.period.end)}.`
    : "Leieperioden er dagene som er valgt i bookingen.";

  const price =
    fillIn.total !== null
      ? `Leiesummen for denne bookingen er ${formatPrice(fillIn.total)} inkl. mva., medregnet utvask, og vises i sin helhet før forespørselen sendes.`
      : "Leiesummen beregnes ut fra gjeldende dagspriser pluss utvask, og vises i sin helhet før forespørselen sendes. Alle priser er inkl. mva.";

  // "1. Partene" is rendered as its own card layout in the dialog.
  return [
    {
      title: "2. Lokalet og leieperioden",
      body: [
        `Leien gjelder ${space.name} ved Ølberg strandhager, Ølberg i Sola kommune.`,
        `${period} Lokalet overtas om morgenen første leiedag og forlates ryddet innen kl. 22.00 siste leiedag, med mindre annet er avtalt med utleier.`,
      ],
    },
    {
      title: "3. Pris og betaling",
      body: [
        price,
        "Betaling skjer etter at bookingen er bekreftet av utleier, med frist som oppgitt på fakturaen.",
      ],
    },
    {
      title: "4. Bekreftelse og avbestilling",
      body: [
        "Forespørselen er ikke bindende før den er bekreftet av utleier. Fra bekreftelsen er bookingen bindende for begge parter.",
        "Bookingen kan avbestilles kostnadsfritt inntil 14 dager før første leiedag. Ved avbestilling senere enn dette kan utleier fakturere inntil 50 % av leiesummen.",
      ],
    },
    {
      title: "5. Bruk av lokalet",
      body: [
        `Lokalet har plass til inntil ${space.maxGuests} personer, og antallet gjester skal ikke overstige dette.`,
        "Leietaker plikter å rydde og grovrengjøre lokalet etter bruk. Utvasken som er inkludert i prisen dekker hovedrengjøringen.",
        "Av hensyn til naboene skal det holdes ro utendørs etter kl. 23.00. Røyking er ikke tillatt innendørs.",
      ],
    },
    {
      title: "6. Skader og ansvar",
      body: [
        "Leietaker er erstatningsansvarlig for skade som påføres bygningen, inventaret eller utstyret i leieperioden. Skader skal meldes til utleier umiddelbart.",
      ],
    },
    {
      title: "7. Aldersgrense",
      body: [
        "Leietaker må være fylt 18 år og være til stede under hele arrangementet.",
      ],
    },
    {
      title: "8. Elektronisk aksept",
      body: [
        "Avtalen inngås elektronisk: leietaker signerer i feltet nedenfor, huker av for vilkårene i bookingskjemaet og sender forespørselen. Signaturen og tidspunktet for aksepten lagres sammen med bookingen.",
      ],
    },
  ];
}

/** One of the two parties in section 1, with contact details line by line. */
function Party({
  label,
  name,
  lines,
}: {
  label: string;
  name: string;
  lines: string[];
}) {
  return (
    <div className="rounded-sm bg-sand p-4">
      <p className="font-medium text-brand-deep text-xs tracking-[0.18em] uppercase">
        {label}
      </p>
      <p className="mt-1.5 font-medium text-ink text-sm">{name}</p>
      {lines.map((line) => (
        <p key={line} className="mt-0.5 text-ink-muted text-sm">
          {line}
        </p>
      ))}
    </div>
  );
}

type RentalTermsDialogProps = {
  open: boolean;
  onClose: () => void;
  space: Space;
  fillIn: TermsFillIn;
  /** The signature drawn so far, redrawn when the dialog reopens. */
  signature: string | null;
  onSignature: (dataUrl: string | null) => void;
};

export function RentalTermsDialog({
  open,
  onClose,
  space,
  fillIn,
  signature,
  onSignature,
}: RentalTermsDialogProps) {
  const panel = useRef<HTMLDivElement>(null);

  // The page behind the dialog should neither scroll nor react to Escape
  // presses meant for the dialog.
  useEffect(() => {
    if (!open) return;

    document.body.style.overflow = "hidden";
    panel.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  // Portalled to <body>, so transformed ancestors (GSAP reveals) cannot
  // become the containing block for this fixed overlay.
  return createPortal(
    <div className="fixed inset-0 z-100 flex items-end justify-center p-0 sm:items-center sm:p-6">
      <button
        type="button"
        aria-label="Lukk"
        onClick={onClose}
        className="absolute inset-0 bg-ink/50 backdrop-blur-sm"
      />

      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-label="Leievilkår for Felleshuset"
        tabIndex={-1}
        className="relative max-h-[92dvh] w-full max-w-xl overflow-y-auto rounded-t-2xl bg-white p-6 text-ink shadow-2xl outline-none sm:rounded-sm md:p-8"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Lukk"
          className="absolute top-4 right-4 flex size-9 items-center justify-center rounded-full text-ink-muted transition-colors hover:bg-sand hover:text-ink"
        >
          <X className="size-4.5" strokeWidth={1.75} aria-hidden />
        </button>

        <p className="font-medium text-brand-deep text-xs tracking-[0.22em] uppercase">
          Vilkår
        </p>
        <h2 className="mt-2 font-display text-2xl tracking-tight md:text-3xl">
          Leievilkår for {space.name}
        </h2>
        <p className="mt-2 text-ink-muted text-sm leading-relaxed">
          Disse vilkårene gjelder for leie av {space.name}, og godtas når du sender
          bookingforespørselen.
          {fillIn.name || fillIn.period
            ? " Opplysningene du har fylt inn i skjemaet er tatt med i teksten."
            : null}
        </p>

        <div className="mt-7 space-y-6">
          <section>
            <h3 className="font-medium text-ink text-sm">1. Partene</h3>
            <div className="mt-2.5 grid gap-3 sm:grid-cols-2">
              <Party
                label="Utleier"
                name="Ølberg strandhager ved hagestyret"
                lines={["felleshuset@strandhager.no", "957 82 508"]}
              />
              <Party
                label="Leietaker"
                name={fillIn.name || "Fylles inn fra bookingskjemaet"}
                lines={[fillIn.email, fillIn.phone].filter(Boolean)}
              />
            </div>
          </section>

          {termsSections(space, fillIn).map((section) => (
            <section key={section.title}>
              <h3 className="font-medium text-ink text-sm">{section.title}</h3>
              <div className="mt-2 space-y-2">
                {section.body.map((paragraph) => (
                  <p
                    key={paragraph}
                    className="text-ink-muted text-sm leading-relaxed"
                  >
                    {paragraph}
                  </p>
                ))}
              </div>
            </section>
          ))}
        </div>

        <div className="mt-7 rounded-sm bg-sand p-4">
          <p className="font-medium text-brand-deep text-xs tracking-[0.22em] uppercase">
            Signatur
          </p>
          {fillIn.name ? (
            <p className="mt-1.5 font-display text-ink text-lg">{fillIn.name}</p>
          ) : null}
          <p className="mt-0.5 text-ink-muted text-sm">
            Ølberg,{" "}
            {new Intl.DateTimeFormat("nb-NO", { dateStyle: "long" }).format(
              new Date(),
            )}
          </p>
          <div className="mt-3">
            <SignaturePad initial={signature} onChange={onSignature} />
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-8 rounded-sm bg-brand px-5 py-2.5 font-medium text-sm text-white transition-colors hover:bg-brand-deep"
        >
          Ferdig
        </button>
      </div>
    </div>,
    document.body,
  );
}
