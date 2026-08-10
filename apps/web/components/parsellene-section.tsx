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
import { SectionReveal } from "@/components/section-reveal";
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
      <p className="font-display text-ink text-xl md:text-2xl">{person.name}</p>
      <p className="mt-1.5 text-ink-muted text-sm leading-relaxed">{person.role}</p>
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
      <div className="relative aspect-square overflow-hidden rounded-sm bg-sand ring-1 ring-ink/10 transition-shadow duration-300 group-hover:ring-brand/40">
        <Image
          src={doc.preview}
          alt={doc.previewAlt}
          fill
          sizes="(max-width: 640px) 88vw, 300px"
          className="object-contain p-4 transition-transform duration-500 group-hover:scale-[1.04]"
        />
      </div>

      <div className="mt-4">{details}</div>

      <span className="mt-3 inline-flex items-center gap-2 text-sea-deep text-sm transition-colors duration-300 group-hover:text-brand-deep">
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
      className="relative overflow-hidden bg-brand-soft py-24 text-ink md:py-32"
    >
      {/* Soft logo green with a white glow at the top for depth, and a hint
          of the sea blue near the bottom to lead into the section below. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_55%_at_10%_-10%,rgba(255,255,255,0.75),transparent_55%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-40 -left-32 size-144 rounded-full bg-sea-mist/70 blur-3xl"
      />

      {/* A slim deep-green accent along the seam against the sand above. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-0.5 bg-linear-to-r from-transparent via-brand-deep/30 to-transparent"
      />

      <div className="relative mx-auto max-w-6xl px-5 md:px-8">
        <div className="grid gap-8 md:grid-cols-12 md:items-end">
          <div className="md:col-span-7">
            <div className="flex items-center gap-4">
              <span data-reveal-rule className="h-px w-10 bg-brand/60 md:w-14" />
              <span className="font-medium text-brand-deep text-xs tracking-[0.26em] uppercase md:text-sm">
                {parsellene.eyebrow}
              </span>
            </div>
            <h2
              data-reveal
              className="mt-5 max-w-xl font-display text-4xl leading-[1.05] tracking-tight md:text-5xl lg:text-6xl"
            >
              {parsellene.title}
            </h2>
          </div>
          <p data-reveal className="text-ink-muted text-lg leading-relaxed md:col-span-5">
            {parsellene.lead}
          </p>
        </div>

        <ul className="mt-14 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
          {parsellene.stats.map((stat) => (
            <li
              key={stat.label}
              data-reveal
              className="rounded-sm bg-white px-5 py-7 shadow-brand-deep/5 shadow-sm ring-1 ring-ink/5 md:px-6 md:py-8"
            >
              <p className="font-display text-4xl leading-none md:text-5xl">
                <span data-count={stat.value}>{stat.value}</span>
                <span className="ml-1.5 align-middle font-sans text-base text-brand-deep md:text-lg">
                  {stat.unit}
                </span>
              </p>
              <p className="mt-3 text-ink-muted text-sm leading-snug">{stat.label}</p>
            </li>
          ))}
        </ul>

        <div className="mt-16 grid gap-12 lg:grid-cols-12 lg:gap-14">
          <div className="lg:col-span-7">
            <figure
              data-reveal
              className="relative aspect-4/3 overflow-hidden rounded-sm ring-1 ring-ink/10"
            >
              <Image
                src={parsellene.image}
                alt={parsellene.imageAlt}
                fill
                sizes="(max-width: 1024px) 100vw, 58vw"
                className="scale-105 object-cover"
                data-parallax
              />
              <div className="absolute inset-0 bg-linear-to-t from-ink/30 via-transparent to-transparent" />
            </figure>
          </div>

          <div className="lg:col-span-5">
            <p data-reveal className="text-base text-ink-muted leading-relaxed md:text-lg">
              {parsellene.body}
            </p>

            <p
              data-reveal
              className="mt-10 font-medium text-ink text-xs tracking-[0.22em] uppercase"
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
                    className="group flex items-center gap-3 rounded-xl bg-white px-4 py-3.5 ring-1 ring-ink/5 transition-all duration-300 hover:shadow-brand-deep/10 hover:shadow-md hover:ring-brand/25"
                  >
                    <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-sea/15 text-sea-deep transition-colors duration-300 group-hover:bg-sea group-hover:text-white">
                      <Icon className="size-4.5" strokeWidth={1.5} aria-hidden />
                    </span>
                    <span className="font-medium text-ink text-sm">{feature.label}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        <p
          data-reveal
          className="mt-24 max-w-3xl font-display text-2xl text-ink/85 leading-snug md:text-3xl lg:mt-28"
        >
          {parsellene.details}
        </p>

        <GalleryStrip
          eyebrow="Bilder fra hagene"
          title="Et år i strandhagen"
          items={parsellene.gallery}
          viewAllHref="/galleri/parsellene"
          viewAllLabel="Se alle bildene"
          tone="light"
        />

        <div className="mt-20 grid gap-6 md:mt-24 md:grid-cols-12">
          <div
            data-reveal
            className="rounded-sm bg-white p-8 shadow-brand-deep/5 shadow-sm ring-1 ring-ink/5 md:col-span-5 md:p-10"
          >
            <p className="font-medium text-brand-deep text-xs tracking-[0.22em] uppercase">
              {board.title}
            </p>
            <p className="mt-4 text-base text-ink-muted leading-relaxed">{board.body}</p>
            <ul className="mt-6 border-ink/10 border-t">
              {board.tasks.map((task, index) => (
                <li key={task} className="flex items-baseline gap-4 border-ink/10 border-b py-4">
                  <span className="font-medium text-brand-deep text-xs tabular-nums">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="text-ink/85 text-sm leading-relaxed">{task}</span>
                </li>
              ))}
            </ul>
            <a
              href={`mailto:${board.email}`}
              className="group mt-6 inline-flex items-center gap-2 text-ink text-sm underline-offset-4 transition-colors hover:text-brand-deep hover:underline"
            >
              <Mail className="size-4" strokeWidth={1.5} aria-hidden />
              {board.email}
            </a>
          </div>

          <div
            data-reveal
            className="rounded-sm bg-white p-8 shadow-brand-deep/5 shadow-sm ring-1 ring-ink/5 md:col-span-7 md:p-10"
          >
            <p className="font-medium text-brand-deep text-xs tracking-[0.22em] uppercase">
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
