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
            step <= Math.floor(rating) ? "fill-amber-400 text-amber-400" : "text-ink/20"
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
      className="relative overflow-hidden bg-sea-mist py-24 md:py-32"
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
        className="pointer-events-none absolute inset-x-0 top-0 h-0.5 bg-linear-to-r from-transparent via-sea/40 to-transparent"
      />

      <div className="relative mx-auto max-w-6xl px-5 md:px-8">
        <div className="grid gap-8 md:grid-cols-12 md:items-end">
          <div className="md:col-span-7">
            <div className="flex items-center gap-4">
              <span data-reveal-rule className="h-px w-10 bg-sea/70 md:w-14" />
              <span className="font-medium text-sea-deep text-xs tracking-[0.26em] uppercase md:text-sm">
                {location.eyebrow}
              </span>
            </div>
            <h2
              data-reveal
              className="mt-5 max-w-xl font-display text-4xl text-ink leading-[1.05] tracking-tight md:text-5xl lg:text-6xl"
            >
              {location.title}
            </h2>
          </div>
          <p data-reveal className="text-ink-muted text-lg leading-relaxed md:col-span-5">
            {location.body}
          </p>
        </div>

        {/* The map, with the address card floating over it. */}
        <div
          data-reveal
          className="relative mt-14 overflow-hidden rounded-sm shadow-brand-deep/5 shadow-sm ring-1 ring-ink/10"
        >
          <div className="h-105 md:h-130">
            <LocationMap lat={location.coords.lat} lng={location.coords.lng} />
          </div>

          <div className="pointer-events-none absolute inset-x-4 top-4 z-500 sm:inset-x-auto sm:left-4 sm:w-80 md:top-6 md:left-6">
            <div className="pointer-events-auto rounded-sm bg-white/95 p-6 shadow-brand-deep/10 shadow-lg ring-1 ring-ink/10 backdrop-blur-sm md:p-7">
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
                  className="inline-flex items-center justify-center gap-2 rounded-sm bg-brand px-5 py-2.5 font-medium text-sm text-white transition-colors hover:bg-brand-deep"
                >
                  <Navigation className="size-4" strokeWidth={1.75} aria-hidden />
                  Veibeskrivelse
                </a>
                <a
                  href={location.mapUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="group inline-flex items-center justify-center gap-2 rounded-sm px-5 py-2.5 font-medium text-ink text-sm ring-1 ring-ink/15 transition-colors hover:bg-sand"
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
          <h3 data-reveal className="mt-4 font-display text-2xl text-ink tracking-tight md:text-3xl">
            {places.title}
          </h3>

          <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {places.items.map((place) => {
              const Icon = placeIcons[place.icon];

              return (
                <li
                  key={place.name}
                  data-reveal
                  className="group rounded-sm bg-white p-6 shadow-brand-deep/5 shadow-sm ring-1 ring-ink/5 transition-all duration-300 hover:shadow-brand-deep/10 hover:shadow-md hover:ring-sea/30 md:p-7"
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="inline-flex size-11 items-center justify-center rounded-lg bg-sea/15 text-sea-deep transition-colors duration-300 group-hover:bg-sea group-hover:text-white">
                      <Icon className="size-5" strokeWidth={1.5} aria-hidden />
                    </span>
                    <span className="rounded-full bg-sea-mist px-3 py-1 font-medium text-ink-muted text-xs">
                      {place.distance}
                    </span>
                  </div>
                  <p className="mt-5 font-display text-ink text-xl">{place.name}</p>
                  <p className="mt-2 text-ink-muted text-sm leading-relaxed">{place.description}</p>
                </li>
              );
            })}
          </ul>
        </div>

        {/* What visitors write on Google. */}
        <div
          data-reveal
          className="mt-20 rounded-sm bg-white p-8 shadow-brand-deep/5 shadow-sm ring-1 ring-ink/5 md:mt-24 md:p-12"
        >
          <div className="grid gap-10 md:grid-cols-12 md:gap-12">
            <div className="md:col-span-4">
              <div className="flex items-center gap-4">
                <span className="h-px w-10 bg-brand/60" />
                <span className="font-medium text-brand-deep text-xs tracking-[0.26em] uppercase">
                  {reviews.eyebrow}
                </span>
              </div>
              <h3 className="mt-4 font-display text-2xl text-ink tracking-tight md:text-3xl">
                {reviews.title}
              </h3>

              <p className="mt-8 flex items-baseline gap-3">
                <span className="font-display text-6xl text-ink leading-none">{rating}</span>
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
                  <figure className="rounded-sm bg-sea-mist/50 p-6 ring-1 ring-ink/5">
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
