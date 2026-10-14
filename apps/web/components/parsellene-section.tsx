import {
  ArrowUpRight,
  ChefHat,
  FileText,
  Layers,
  Mail,
  Package,
  Snowflake,
  Sofa,
  Sprout,
} from "lucide-react";
import Image from "next/image";

import { GalleryStrip } from "@/components/gallery-strip";
import { MaskedHeading } from "@/components/masked-heading";
import { SectionReveal } from "@/components/section-reveal";
import { Spotlight } from "@/components/ui/spotlight";
import { WaitlistCard } from "@/components/waitlist-card";
import type { Architect, CabinFeatureIcon, ParselleneContent } from "@/lib/site-content";

const cabinIcons: Record<CabinFeatureIcon, typeof Sofa> = {
  living: Sofa,
  kitchen: ChefHat,
  storage: Package,
  compost: Sprout,
  loft: Layers,
  winter: Snowflake,
};

/** An architect, shown as a link to their drawings when a PDF is published. */
function ArchitectCard({ person }: { person: Architect }) {
  const doc = person.document;

  const details = (
    <>
      <p className="font-display text-white text-xl md:text-2xl">{person.name}</p>
      <p className="mt-1.5 text-sm text-white/60 leading-relaxed">{person.role}</p>
    </>
  );

  if (!doc?.url) {
    return <div>{details}</div>;
  }

  return (
    <a
      href={doc.url}
      target="_blank"
      rel="noreferrer noopener"
      className="group block rounded-sm outline-offset-4"
    >
      {/* The tile stays white on the dark band - these are line drawings. */}
      <div className="relative aspect-square overflow-hidden rounded-card bg-white ring-1 ring-white/15 transition-all duration-300 group-hover:ring-brand-light/50">
        <Image
          src={doc.preview}
          alt={doc.previewAlt}
          fill
          sizes="(max-width: 640px) 88vw, 300px"
          className="object-contain p-4 transition-transform duration-500 group-hover:scale-[1.04]"
        />
      </div>

      <div className="mt-4">{details}</div>

      <span className="mt-3 inline-flex items-center gap-2 text-sea-light text-sm transition-colors duration-300 group-hover:text-brand-light">
        <FileText className="size-4 shrink-0" strokeWidth={1.5} aria-hidden />
        {doc.label} (PDF)
        <ArrowUpRight
          className="size-4 shrink-0 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
          aria-hidden
        />
      </span>
    </a>
  );
}

export function ParselleneSection({ parsellene }: { parsellene: ParselleneContent }) {
  const { cabin, board, architects, waitlist } = parsellene;

  return (
    <SectionReveal
      id={parsellene.id}
      className="relative overflow-hidden bg-night py-28 text-white md:py-40"
    >
      {/* Dusk in the gardens: the green reads as light coming through planting
          at the top left. The dark band is also the page's rhythm break - two
          light sections sat back to back before this. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_8%_-5%,color-mix(in_oklab,var(--brand-green)_26%,transparent),transparent_60%)]"
      />
      {/* Two searchlights angled in from the top corners. They are a screen
          tall, so they light the heading and leave the body text alone. */}
      <Spotlight />
      {/* A faint grain so the large dark field never looks like flat fill. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.035] mix-blend-overlay bg-[radial-gradient(#ffffff_1px,transparent_1px)] bg-[size:4px_4px]"
      />

      {/* A bright seam where the warm band above meets the dusk. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-brand-light/50 to-transparent"
      />

      <div className="relative mx-auto max-w-6xl px-5 md:px-8">
        <div className="grid gap-10 md:grid-cols-12 md:gap-8">
          <div className="md:col-span-8">
            <div className="flex items-center gap-4">
              <span data-reveal-rule className="h-px w-10 bg-brand-light/70 md:w-14" />
              <span className="font-medium text-brand-light text-xs tracking-[0.26em] uppercase md:text-sm">
                {parsellene.eyebrow}
              </span>
            </div>
            <MaskedHeading
              text={parsellene.title}
              className="voice-display mt-6 max-w-2xl font-display text-display-lg tracking-[-0.02em]"
            />
          </div>
          <p
            data-reveal
            className="border-brand-light/30 border-l-2 pl-5 text-lg text-white/70 leading-relaxed md:col-span-4 md:self-end"
          >
            {parsellene.lead}
          </p>
        </div>

        <ul className="mt-16 grid grid-cols-2 gap-3 md:mt-20 md:grid-cols-4 md:gap-4">
          {parsellene.stats.map((stat) => (
            <li
              key={stat.label}
              data-slide="right"
              className="group relative overflow-hidden rounded-panel bg-white/[0.04] px-5 py-7 ring-1 ring-white/10 transition-colors duration-500 hover:bg-white/[0.07] hover:ring-brand-light/30 md:px-6 md:py-8"
            >
              <span
                aria-hidden
                className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-brand-light/60 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100"
              />
              <p className="voice-title font-display text-5xl text-white leading-none md:text-6xl">
                <span data-count={stat.value}>{stat.value}</span>
                <span className="ml-1.5 align-middle font-sans text-base text-brand-light md:text-lg">
                  {stat.unit}
                </span>
              </p>
              <p className="mt-3 text-sm text-white/60 leading-snug">{stat.label}</p>
            </li>
          ))}
        </ul>

        <div className="mt-20 grid gap-12 md:mt-28 lg:grid-cols-12 lg:items-start lg:gap-16">
          <div className="lg:sticky lg:top-28 lg:col-span-7">
            <figure
              data-reveal-clip
              className="relative aspect-4/3 overflow-hidden rounded-frame ring-1 ring-white/10"
            >
              <Image
                src={parsellene.image}
                alt={parsellene.imageAlt}
                fill
                sizes="(max-width: 1024px) 100vw, 58vw"
                className="scale-110 object-cover"
                data-parallax
              />
              {/* Grades the photo into the dusk rather than cutting it off. */}
              <div className="absolute inset-0 bg-linear-to-t from-night/70 via-night/10 to-transparent" />
            </figure>
          </div>

          <div className="lg:col-span-5">
            <p data-reveal className="text-lg text-white/70 leading-relaxed md:text-xl">
              {parsellene.body}
            </p>

            <p
              data-reveal
              className="mt-12 font-medium text-white text-xs tracking-[0.22em] uppercase"
            >
              {cabin.title}
            </p>
            <ul className="mt-5 grid grid-cols-2 gap-3">
              {cabin.features.map((feature) => {
                const Icon = cabinIcons[feature.icon];

                return (
                  <li
                    key={feature.label}
                    data-reveal
                    className="group flex items-center gap-3 rounded-card bg-white/[0.04] px-4 py-3.5 ring-1 ring-white/10 transition-[background-color,box-shadow] duration-300 hover:bg-white/[0.08] hover:ring-sea-light/30"
                  >
                    <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-card bg-sea-light/15 text-sea-light transition-colors duration-300 group-hover:bg-sea-light group-hover:text-night">
                      <Icon className="size-4.5" strokeWidth={1.5} aria-hidden />
                    </span>
                    <span className="font-medium text-sm text-white">{feature.label}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        <p
          data-reveal
          className="voice-title mt-28 max-w-4xl font-display text-display-md text-white/85 lg:mt-36"
        >
          {parsellene.details}
        </p>

        <GalleryStrip
          eyebrow="Bilder fra hagene"
          title="Et år i strandhagen"
          items={parsellene.gallery}
          viewAllHref="/galleri/parsellene"
          viewAllLabel="Se alle bildene"
          tone="dark"
        />

        <div className="mt-20 grid gap-6 md:mt-24 md:grid-cols-12">
          <div
            data-reveal
            className="rounded-frame bg-white/[0.04] p-8 ring-1 ring-white/10 md:col-span-5 md:p-10"
          >
            <p className="font-medium text-brand-light text-xs tracking-[0.22em] uppercase">
              {board.title}
            </p>
            <p className="mt-4 text-base text-white/70 leading-relaxed">{board.body}</p>
            <ul className="mt-6 border-white/10 border-t">
              {board.tasks.map((task, index) => (
                <li key={task} className="flex items-baseline gap-4 border-white/10 border-b py-4">
                  {/* The warm accent, earning its keep on the dark field. */}
                  <span className="font-medium text-clay-light text-xs tabular-nums">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="text-sm text-white/75 leading-relaxed">{task}</span>
                </li>
              ))}
            </ul>
            <a
              href={`mailto:${board.email}`}
              className="group mt-6 inline-flex items-center gap-2 text-sm text-white underline-offset-4 transition-colors hover:text-brand-light hover:underline"
            >
              <Mail className="size-4" strokeWidth={1.5} aria-hidden />
              {board.email}
            </a>
          </div>

          <div
            data-reveal
            className="rounded-frame bg-white/[0.04] p-8 ring-1 ring-white/10 md:col-span-7 md:p-10"
          >
            <p className="font-medium text-brand-light text-xs tracking-[0.22em] uppercase">
              {architects.title}
            </p>
            <ul className="mt-6 grid gap-5 sm:grid-cols-2">
              {architects.people.map((person) => (
                <li key={person.name}>
                  <ArchitectCard person={person} />
                </li>
              ))}
            </ul>
          </div>
        </div>

        <WaitlistCard waitlist={waitlist} />
      </div>
    </SectionReveal>
  );
}
