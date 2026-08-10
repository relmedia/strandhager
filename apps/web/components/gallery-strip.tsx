"use client";

import { useRef } from "react";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

gsap.registerPlugin(useGSAP, ScrollTrigger);

type GalleryItem = {
  src: string;
  alt: string;
  caption: string;
};

type GalleryStripProps = {
  eyebrow: string;
  title: string;
  items: readonly GalleryItem[];
  viewAllHref?: string;
  viewAllLabel?: string;
  tone?: "light" | "dark";
};

const tones = {
  light: {
    rule: "bg-brand/60",
    eyebrow: "text-brand-deep",
    link: "text-brand-deep hover:text-brand",
    hint: "text-ink-muted/70",
    caption: "text-ink-muted",
    frame: "ring-ink/10",
    track: "bg-ink/10",
    fill: "bg-brand",
  },
  dark: {
    rule: "bg-sea/70",
    eyebrow: "text-sea-mist",
    link: "text-white hover:text-sea-mist",
    hint: "text-white/45",
    caption: "text-white/65",
    frame: "ring-white/15",
    track: "bg-white/15",
    fill: "bg-sea-mist",
  },
} as const;

export function GalleryStrip({
  eyebrow,
  title,
  items,
  viewAllHref,
  viewAllLabel,
  tone = "light",
}: GalleryStripProps) {
  const palette = tones[tone];
  const rootRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLUListElement>(null);
  const progressRef = useRef<HTMLSpanElement>(null);

  useGSAP(
    () => {
      const viewport = viewportRef.current;
      const track = trackRef.current;
      if (!viewport || !track) return;

      const mm = gsap.matchMedia();

      // Below md the strip is a native swipeable list, so it is left untouched.
      mm.add("(min-width: 768px) and (prefers-reduced-motion: no-preference)", () => {
        const distance = () => Math.max(0, track.scrollWidth - viewport.clientWidth);
        if (distance() === 0) return;

        gsap.to(track, {
          x: () => -distance(),
          ease: "none",
          scrollTrigger: {
            trigger: rootRef.current,
            start: "center center",
            end: () => `+=${distance()}`,
            pin: true,
            anticipatePin: 1,
            scrub: 0.5,
            invalidateOnRefresh: true,
            onUpdate: (self) => {
              if (progressRef.current) {
                gsap.set(progressRef.current, { scaleX: self.progress });
              }
            },
          },
        });
      });

      return () => mm.revert();
    },
    { scope: rootRef },
  );

  return (
    <div ref={rootRef} className="mt-20 md:mt-24">
      <div className="flex items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-4">
            <span data-reveal-rule className={`h-px w-10 md:w-14 ${palette.rule}`} />
            <span
              className={`font-medium text-xs tracking-[0.26em] uppercase md:text-sm ${palette.eyebrow}`}
            >
              {eyebrow}
            </span>
          </div>
          <h3 data-reveal className="mt-4 font-display text-2xl tracking-tight md:text-3xl">
            {title}
          </h3>
        </div>
        <div className="flex flex-col items-end gap-2">
          {viewAllHref ? (
            <Link
              href={viewAllHref}
              className={`group inline-flex items-center gap-2 font-medium text-sm transition-colors ${palette.link}`}
            >
              {viewAllLabel ?? "Se alle bildene"}
              <ArrowRight
                className="size-4 transition-transform duration-300 group-hover:translate-x-1"
                aria-hidden
              />
            </Link>
          ) : null}
          <p className={`hidden text-xs tracking-[0.18em] uppercase md:block ${palette.hint}`}>
            Rull for å se mer
          </p>
        </div>
      </div>

      <div
        ref={viewportRef}
        className="mt-8 snap-x snap-mandatory overflow-x-auto pb-2 mr-[calc(50%-50vw)] md:snap-none md:overflow-hidden md:pb-0"
      >
        <ul ref={trackRef} className="flex w-max gap-4 pr-5 md:gap-6 md:pr-8">
          {items.map((item) => (
            <li key={item.src} className="w-[78vw] shrink-0 snap-start sm:w-[46vw] lg:w-100">
              <figure>
                <div
                  className={`relative aspect-3/2 overflow-hidden rounded-sm ring-1 ${palette.frame}`}
                >
                  <Image
                    src={item.src}
                    alt={item.alt}
                    fill
                    sizes="(max-width: 640px) 78vw, (max-width: 1024px) 46vw, 25rem"
                    className="object-cover"
                  />
                </div>
                <figcaption className={`mt-3 text-sm ${palette.caption}`}>{item.caption}</figcaption>
              </figure>
            </li>
          ))}
        </ul>
      </div>

      <div className={`mt-6 hidden h-px w-full md:block ${palette.track}`}>
        <span
          ref={progressRef}
          className={`block h-px w-full origin-left scale-x-0 ${palette.fill}`}
        />
      </div>
    </div>
  );
}
