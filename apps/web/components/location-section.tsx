import {
  Anchor,
  ArrowUpRight,
  Footprints,
  MapPin,
  Navigation,
  Plane,
  Star,
  TreePine,
  Waves,
  Wind,
} from "lucide-react";

import { LocationMap } from "@/components/location-map";
import { MaskedHeading } from "@/components/masked-heading";
import { SectionReveal } from "@/components/section-reveal";
import type { LocationContent, LocationPlaceIcon } from "@/lib/site-content";

const placeIcons: Record<LocationPlaceIcon, typeof Waves> = {
  beach: Waves,
  harbour: Anchor,
  trail: Footprints,
  dunes: Wind,
  forest: TreePine,
  museum: Plane,
};

function Stars({ rating, className }: { rating: number; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-0.5 ${className ?? ""}`} aria-hidden>
      {[1, 2, 3, 4, 5].map((step) => (
        <Star
          key={step}
          className={`size-3.5 ${
            step <= Math.floor(rating) ? "fill-clay text-clay" : "text-ink/15"
          }`}
          strokeWidth={1.5}
        />
      ))}
    </span>
  );
}

export function LocationSection({ location }: { location: LocationContent }) {
  const { places, reviews } = location;
  const rating = location.reviews.rating.toLocaleString("nb-NO", {
    minimumFractionDigits: 1,
  });

  return (
    <SectionReveal
      id={location.id}
      className="relative overflow-hidden bg-sea-mist py-28 md:py-40"
    >
      {/* A white glow for depth, plus a trace of the garden green up top. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_55%_at_90%_-10%,rgba(255,255,255,0.7),transparent_55%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 -left-32 size-144 rounded-full bg-brand-soft/60 blur-3xl"
      />

      {/* A slim sea-blue accent along the seam against the green above. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-sea-light/70 to-transparent"
      />

      <div className="relative mx-auto max-w-6xl px-5 md:px-8">
        <div className="grid gap-10 md:grid-cols-12 md:gap-8">
          <div className="md:col-span-8">
            <div className="flex items-center gap-4">
              <span data-reveal-rule className="h-px w-10 bg-sea/70 md:w-14" />
              <span className="font-medium text-sea-deep text-xs tracking-[0.26em] uppercase md:text-sm">
                {location.eyebrow}
              </span>
            </div>
            <MaskedHeading
              text={location.title}
              className="voice-display mt-6 max-w-2xl font-display text-display-lg text-ink tracking-[-0.02em]"
            />
          </div>
          <p
            data-reveal
            className="border-sea/40 border-l-2 pl-5 text-ink-muted text-lg leading-relaxed md:col-span-4 md:self-end"
          >
            {location.body}
          </p>
        </div>

        {/* The map, with the address card floating over it. */}
        <div
          data-reveal
          className="relative mt-16 overflow-hidden rounded-frame shadow-night/10 shadow-xl ring-1 ring-ink/10 md:mt-20"
        >
          <div className="h-105 md:h-130">
            <LocationMap lat={location.coords.lat} lng={location.coords.lng} />
          </div>

          <div className="pointer-events-none absolute inset-x-4 top-4 z-500 sm:inset-x-auto sm:left-4 sm:w-80 md:top-6 md:left-6">
            <div className="pointer-events-auto rounded-panel bg-white/95 p-6 shadow-night/15 shadow-xl ring-1 ring-ink/10 backdrop-blur-md md:p-7">
              <p className="flex items-center gap-2 font-medium text-brand-deep text-xs tracking-[0.22em] uppercase">
                <MapPin className="size-3.5 shrink-0" strokeWidth={2} aria-hidden />
                Finn oss
              </p>

              <address className="mt-4 not-italic text-ink">
                {location.address.map((line, index) => (
                  <div
                    key={line}
                    className={
                      index === 0 ? "font-display text-xl" : "text-ink-muted text-sm leading-relaxed"
                    }
                  >
                    {line}
                  </div>
                ))}
              </address>

              <a
                href={location.mapUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="mt-3 inline-flex items-center gap-2 text-sm transition-colors hover:text-brand-deep"
              >
                <Stars rating={reviews.rating} />
                <span className="font-medium text-ink">{rating}</span>
                <span className="text-ink-muted underline-offset-4 hover:underline">
                  {reviews.count} anmeldelser
                </span>
              </a>

              <div className="mt-5 flex flex-col gap-2">
                <a
                  href={location.directionsUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="inline-flex items-center justify-center gap-2 rounded-chip bg-brand-deep px-5 py-2.5 font-medium text-sm text-white transition-colors hover:bg-brand-deeper"
                >
                  <Navigation className="size-4" strokeWidth={1.75} aria-hidden />
                  Veibeskrivelse
                </a>
                <a
                  href={location.mapUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="group inline-flex items-center justify-center gap-2 rounded-chip px-5 py-2.5 font-medium text-ink text-sm ring-1 ring-ink/15 transition-colors hover:bg-sand"
                >
                  Åpne i Google Maps
                  <ArrowUpRight
                    className="size-4 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                    aria-hidden
                  />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Places worth a stop, all within minutes of the gardens. */}
        <div className="mt-20 md:mt-24">
          <div className="flex items-center gap-4">
            <span data-reveal-rule className="h-px w-10 bg-sea/70 md:w-14" />
            <span className="font-medium text-sea-deep text-xs tracking-[0.26em] uppercase md:text-sm">
              {places.eyebrow}
            </span>
          </div>
          <MaskedHeading
            as="h3"
            text={places.title}
            className="voice-title mt-5 font-display text-display-md text-ink tracking-[-0.015em]"
          />

          {/* auto-rows-fr keeps every card the same height regardless of how
              long its description runs, so the grid reads as one block. */}
          <ul className="mt-10 grid auto-rows-fr gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {places.items.map((place) => {
              const Icon = placeIcons[place.icon];

              return (
                <li
                  key={place.name}
                  data-reveal
                  className="group flex flex-col rounded-panel bg-white p-6 shadow-night/5 shadow-sm ring-1 ring-ink/5 transition-[transform,box-shadow] duration-300 hover:-translate-y-1.5 hover:shadow-night/10 hover:shadow-xl hover:ring-sea/30 md:p-7"
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="inline-flex size-11 items-center justify-center rounded-card bg-sea/15 text-sea-deep transition-all duration-300 group-hover:scale-110 group-hover:bg-sea-deep group-hover:text-white">
                      <Icon className="size-5" strokeWidth={1.5} aria-hidden />
                    </span>
                    <span className="rounded-chip bg-sea-mist px-3 py-1 font-medium text-ink-muted text-xs tabular-nums">
                      {place.distance}
                    </span>
                  </div>
                  <p className="voice-title mt-6 font-display text-ink text-xl">{place.name}</p>
                  <p className="mt-2 text-ink-muted text-sm leading-relaxed">{place.description}</p>
                </li>
              );
            })}
          </ul>
        </div>

        {/* What visitors write on Google. */}
        <div
          data-reveal
          className="mt-24 rounded-frame bg-white p-8 shadow-night/5 shadow-sm ring-1 ring-ink/5 md:mt-32 md:p-12"
        >
          <div className="grid gap-10 md:grid-cols-12 md:gap-12">
            <div className="md:col-span-4">
              <div className="flex items-center gap-4">
                <span className="h-px w-10 bg-brand/60" />
                <span className="font-medium text-brand-deep text-xs tracking-[0.26em] uppercase">
                  {reviews.eyebrow}
                </span>
              </div>
              <h3 className="voice-title mt-5 font-display text-display-md text-ink tracking-[-0.015em]">
                {reviews.title}
              </h3>

              <p className="mt-10 flex items-baseline gap-3">
                <span className="voice-title font-display text-7xl text-clay leading-none">
                  {rating}
                </span>
                <span className="text-ink-muted text-sm">av 5</span>
              </p>
              <Stars rating={reviews.rating} className="mt-3" />
              <p className="mt-3 text-ink-muted text-sm">
                Basert på{" "}
                <a
                  href={location.mapUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="text-ink underline underline-offset-4 transition-colors hover:text-brand-deep"
                >
                  {reviews.count} anmeldelser på Google
                </a>
              </p>
            </div>

            <ul className="grid gap-4 md:col-span-8">
              {reviews.quotes.map((review) => (
                <li key={review.name}>
                  <figure className="h-full rounded-panel bg-sea-mist/60 p-6 ring-1 ring-ink/5 transition-colors duration-300 hover:bg-sea-mist">
                    <Stars rating={review.rating} />
                    <blockquote className="mt-3 text-ink/90 text-sm leading-relaxed md:text-base">
                      &laquo;{review.quote}&raquo;
                    </blockquote>
                    <figcaption className="mt-3 font-medium text-ink-muted text-xs tracking-wide">
                      {review.name} &middot; Google
                    </figcaption>
                  </figure>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </SectionReveal>
  );
}
