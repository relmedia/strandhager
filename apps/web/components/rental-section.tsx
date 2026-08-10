import { Accessibility, Check, ChefHat, CircleParking, Trees } from "lucide-react";
import Image from "next/image";

import { BookingPanel } from "@/components/booking/booking-panel";
import { PriceCards } from "@/components/booking/price-cards";
import { GalleryStrip } from "@/components/gallery-strip";
import { SectionReveal } from "@/components/section-reveal";
import type { Space } from "@/lib/booking";
import type { ContactContent, UtleieContent } from "@/lib/site-content";

const facilityIcons = {
  kitchen: ChefHat,
  parking: CircleParking,
  accessibility: Accessibility,
  outdoor: Trees,
} as const;

type RentalSectionProps = {
  utleie: UtleieContent;
  contact: ContactContent;
  /** Null when the booking API is unreachable. */
  space: Space | null;
};

export function RentalSection({ utleie, contact, space }: RentalSectionProps) {

  return (
    <SectionReveal id={utleie.id} className="relative overflow-hidden bg-sand py-24 md:py-32">
      {/* A slim brand-green accent along the seam against the hero imagery. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-0.5 bg-linear-to-r from-transparent via-brand/45 to-transparent"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 -right-32 size-144 rounded-full bg-brand-soft/70 blur-3xl"
      />

      <div className="relative mx-auto max-w-6xl px-5 md:px-8">
        <div className="grid gap-8 md:grid-cols-12 md:items-end">
          <div className="md:col-span-7">
            <div className="flex items-center gap-4">
              <span data-reveal-rule className="h-px w-10 bg-brand/60 md:w-14" />
              <span className="font-medium text-brand-deep text-xs tracking-[0.26em] uppercase md:text-sm">
                {utleie.eyebrow}
              </span>
            </div>
            <h2
              data-reveal
              className="mt-5 max-w-xl font-display text-4xl leading-[1.05] tracking-tight md:text-5xl lg:text-6xl"
            >
              {utleie.title}
            </h2>
          </div>
          <p data-reveal className="text-ink-muted text-lg leading-relaxed md:col-span-5">
            {utleie.lead}
          </p>
        </div>

        <div className="mt-14 grid gap-12 lg:grid-cols-12 lg:gap-14">
          <div className="lg:col-span-7">
            <figure
              data-reveal
              className="relative aspect-16/11 overflow-hidden rounded-sm ring-1 ring-ink/10"
            >
              <Image
                src={utleie.image}
                alt={utleie.imageAlt}
                fill
                sizes="(max-width: 1024px) 100vw, 58vw"
                className="scale-105 object-cover"
                data-parallax
              />
              <div className="absolute inset-0 bg-linear-to-t from-ink/45 via-transparent to-transparent" />

              <figcaption className="absolute bottom-5 left-5 rounded-sm bg-white/92 px-6 py-4 backdrop-blur-sm md:bottom-6 md:left-6">
                <p className="font-display text-4xl text-brand-deep leading-none md:text-5xl">
                  <span data-count={utleie.capacity.value}>{utleie.capacity.value}</span>
                  <span className="ml-2 align-middle font-sans text-base text-ink-muted md:text-lg">
                    {utleie.capacity.unit}
                  </span>
                </p>
                <p className="mt-2 text-ink-muted text-xs tracking-[0.14em] uppercase">
                  {utleie.capacity.label}
                </p>
              </figcaption>
            </figure>
          </div>

          <div className="lg:col-span-5">
            <p data-reveal className="text-base text-ink-muted leading-relaxed md:text-lg">
              {utleie.body}
            </p>

            <p
              data-reveal
              className="mt-10 font-medium text-ink text-xs tracking-[0.22em] uppercase"
            >
              Passer til
            </p>
            <ul className="mt-4 border-ink/10 border-t">
              {utleie.uses.map((item, index) => (
                <li
                  key={item}
                  data-reveal
                  className="flex items-baseline gap-4 border-ink/10 border-b py-4"
                >
                  <span className="font-medium text-brand text-xs tabular-nums">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="text-base text-ink">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-16 rounded-2xl bg-white/60 p-5 ring-1 ring-ink/10 backdrop-blur-sm md:mt-20 md:p-8">
          <ul className="grid gap-3 sm:grid-cols-2 md:grid-cols-4 md:gap-4">
            {utleie.facilities.map((facility, index) => {
              const Icon = facilityIcons[facility.icon];

              return (
                <li
                  key={facility.label}
                  data-reveal
                  className="group relative overflow-hidden rounded-xl bg-sand/90 p-6 ring-1 ring-ink/5 transition-all duration-300 hover:-translate-y-1 hover:shadow-brand-deep/10 hover:shadow-lg hover:ring-brand/25"
                >
                  <div
                    aria-hidden
                    className="absolute -top-12 -right-12 size-28 rounded-full bg-brand-soft opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100"
                  />
                  <span className="pointer-events-none absolute top-5 right-5 font-medium text-ink/20 text-xs tabular-nums transition-colors duration-300 group-hover:text-brand/50">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="relative inline-flex size-11 items-center justify-center rounded-xl bg-brand-soft text-brand-deep transition-all duration-300 group-hover:scale-110 group-hover:bg-brand group-hover:text-white">
                    <Icon className="size-5" strokeWidth={1.5} aria-hidden />
                  </span>
                  <p className="relative mt-5 font-medium text-base text-ink">{facility.label}</p>
                </li>
              );
            })}
          </ul>

          <div data-reveal className="mt-5 flex flex-col gap-4 border-ink/10 border-t pt-5 md:mt-6 md:pt-6">
            <p className="font-medium text-ink-muted text-xs tracking-[0.22em] uppercase">
              Utstyr til disposisjon
            </p>
            <ul className="flex flex-wrap gap-2">
              {utleie.equipment.map((item) => (
                <li
                  key={item}
                  className="inline-flex flex-auto items-center justify-center gap-1.5 rounded-full bg-brand-soft px-3.5 py-2 text-center font-medium text-brand-deep text-sm transition-all duration-300 hover:bg-brand hover:text-white"
                >
                  <Check className="size-3.5" strokeWidth={2.5} aria-hidden />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <GalleryStrip
          eyebrow="Bilder fra lokalet"
          title="Se deg rundt i Felleshuset"
          items={utleie.gallery}
          viewAllHref="/galleri/felleshuset"
          viewAllLabel="Se alle bildene"
        />

        <div id="booking" className="mt-20 scroll-mt-24 md:mt-24">
          {space ? (
            <>
              <PriceCards space={space} />
              <BookingPanel space={space} />
            </>
          ) : null}

          <BookingContact contact={contact} fallback={!space} />
        </div>
      </div>
    </SectionReveal>
  );
}

/** Who to ask when the booking form is not enough, or is not available. */
function BookingContact({
  contact,
  fallback,
}: {
  contact: ContactContent;
  fallback: boolean;
}) {
  return (
    <div
      data-reveal
      className={`rounded-sm bg-white p-7 ring-1 ring-ink/10 md:p-10 ${fallback ? "" : "mt-6"}`}
    >
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="font-medium text-brand-deep text-xs tracking-[0.26em] uppercase">
            Booking
          </p>
          <p className="mt-4 text-ink">
            {fallback
              ? "Bookingkalenderen er nede for øyeblikket. Ta kontakt, så finner vi en dato sammen."
              : "Er du usikker på noe, eller vil du leie over lengre tid? Ta kontakt."}
          </p>
        </div>

        <div className="text-sm">
          <p className="text-ink">{contact.booking.name}</p>
          <a
            href={`mailto:${contact.booking.email}`}
            className="mt-1 block text-ink-muted underline-offset-4 transition-colors hover:text-brand-deep hover:underline"
          >
            {contact.booking.email}
          </a>
          <a
            href={`tel:${contact.booking.phone.replace(/\s/g, "")}`}
            className="mt-1 block text-ink-muted underline-offset-4 transition-colors hover:text-brand-deep hover:underline"
          >
            {contact.booking.phone}
          </a>
        </div>
      </div>
    </div>
  );
}
