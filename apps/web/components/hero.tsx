"use client";

import { useEffect, useRef, useState } from "react";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowRight } from "lucide-react";
import Image from "next/image";

import type { HeroContent } from "@/lib/site-content";

gsap.registerPlugin(useGSAP, ScrollTrigger);

const HOLD = 5.5;
const FADE = 1.8;

/* Word-wrapped, per-character split so the headline can animate like SplitText
   without the paid plugin. Words stay unbreakable; the h1 carries an aria-label. */
function SplitLine({ line }: { line: string }) {
  const words = line.split(" ");

  return (
    <span data-hero-line className="mb-[-0.08em] block overflow-hidden pb-[0.18em]">
      <span className="block">
        {words.map((word, wordIndex) => (
          <span key={`${word}-${wordIndex}`} className="inline-block whitespace-nowrap">
            {word.split("").map((char, charIndex) => (
              <span key={charIndex} className="hero-char inline-block will-change-transform">
                {char}
              </span>
            ))}
            {wordIndex < words.length - 1 ? <span className="inline-block">&nbsp;</span> : null}
          </span>
        ))}
      </span>
    </span>
  );
}

export function Hero({ hero }: { hero: HeroContent }) {
  const rootRef = useRef<HTMLElement>(null);

  // Only the first slide is server-rendered; the rest mount after hydration so
  // the initial HTML never shows stacked images (no flicker, no CSS hiding).
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  const slides = hydrated ? hero.slides : hero.slides.slice(0, 1);

  useGSAP(
    () => {
      const root = rootRef.current;
      if (!root || !hydrated) return;

      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: reduce)", () => {
        gsap.set(".hero-char", { clearProps: "all" });
        gsap.set(
          [".hero-kicker-rule", ".hero-kicker", ".hero-support", ".hero-cta a", ".hero-meta"],
          // autoAlpha, not opacity: these are revealed with autoAlpha, which
          // also writes visibility:hidden, and opacity alone cannot undo that.
          { autoAlpha: 1, y: 0, x: 0, scaleX: 1 },
        );
        gsap.set(".hero-slide", { autoAlpha: 0 });
        gsap.set(".hero-slide:first-child", { autoAlpha: 1 });
        gsap.set(".hero-cue", { autoAlpha: 0 });
      });

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const slides = gsap.utils.toArray<HTMLElement>(".hero-slide");
        const bars = gsap.utils.toArray<HTMLElement>(".hero-bar-fill");

        gsap.set(slides, { autoAlpha: 0 });
        gsap.set(slides[0], { autoAlpha: 1 });
        gsap.set(bars, { scaleX: 0, transformOrigin: "left center" });

        // Intro: slow settle on the imagery, then a per-character rise of the
        // headline with a hint of 3D, followed by the supporting layers.
        const intro = gsap.timeline({
          defaults: { ease: "expo.out" },
          // Every .from() below starts its target at autoAlpha 0, which writes
          // visibility:hidden inline. If the timeline is ever cut short - a hot
          // reload, a React remount, a context revert mid-flight - that inline
          // style outlives it and the element stays invisible until a full
          // reload. Clearing on completion means the resting state is always
          // the plain CSS one, with nothing left over to strand.
          onComplete: () => {
            gsap.set(
              [
                ".hero-kicker-rule",
                ".hero-kicker",
                ".hero-char",
                ".hero-support",
                ".hero-cta a",
                ".hero-meta",
              ],
              { clearProps: "opacity,visibility,transform" },
            );
          },
        });

        intro
          .from(slides[0], { scale: 1.18, duration: 2.8, ease: "power2.out" }, 0)
          .from(
            ".hero-kicker-rule",
            { scaleX: 0, duration: 1, ease: "power3.inOut" },
            0.2,
          )
          .from(".hero-kicker", { autoAlpha: 0, x: -14, duration: 0.9 }, "-=0.6")
          .from(
            ".hero-char",
            {
              yPercent: 120,
              rotateX: -55,
              autoAlpha: 0,
              transformPerspective: 700,
              duration: 1.1,
              stagger: 0.022,
            },
            "-=0.55",
          )
          .from(".hero-support", { autoAlpha: 0, y: 26, duration: 1 }, "-=0.8")
          .from(".hero-cta a", { autoAlpha: 0, y: 18, duration: 0.8, stagger: 0.12 }, "-=0.75")
          .from(".hero-meta", { autoAlpha: 0, y: 14, duration: 0.9 }, "-=0.65");

        // Ambient crossfade between the views. Each slide owns one segment and
        // its progress bar starts the moment the slide begins fading in, so the
        // indicator always tracks the image on screen. repeatRefresh re-records
        // start values so the wrap-around crossfade works on every cycle.
        const SEGMENT = HOLD + FADE;
        const loop = gsap.timeline({ repeat: -1, repeatRefresh: true, delay: 1.4 });

        slides.forEach((slide, index) => {
          const prev = slides[(index - 1 + slides.length) % slides.length];
          const start = index * SEGMENT;

          loop
            .set(bars, { scaleX: 0 }, start)
            .to(bars[index], { scaleX: 1, duration: SEGMENT, ease: "none" }, start)
            .to(prev, { autoAlpha: 0, duration: FADE, ease: "power1.inOut" }, start)
            .to(slide, { autoAlpha: 1, duration: FADE, ease: "power1.inOut" }, start);
        });

        // Slow Ken Burns drift; alternating direction per slide sells the depth.
        gsap.fromTo(
          ".hero-slide img",
          { scale: 1.15, x: (index: number) => (index % 2 ? 16 : -16) },
          {
            scale: 1.05,
            x: (index: number) => (index % 2 ? -16 : 16),
            duration: 24,
            ease: "none",
            repeat: -1,
            yoyo: true,
          },
        );

        // The cue's highlight falls down the hairline, pauses, repeats.
        gsap.fromTo(
          ".hero-cue-dot",
          { yPercent: -100 },
          {
            yPercent: 340,
            duration: 2.2,
            ease: "power2.inOut",
            repeat: -1,
            repeatDelay: 0.7,
            delay: 2.4,
          },
        );

        // The cue is only an invitation while there is still a page below it.
        gsap.to(".hero-cue", {
          autoAlpha: 0,
          ease: "none",
          scrollTrigger: { trigger: root, start: "top top", end: "+=240", scrub: true },
        });

        // A faint sea-toned glow that wanders across the imagery.
        gsap.to(".hero-glow", {
          xPercent: 7,
          yPercent: -5,
          duration: 18,
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true,
        });

        // Depth on scroll: the copy lifts away faster than the imagery.
        gsap.to(".hero-content", {
          yPercent: -22,
          opacity: 0,
          ease: "none",
          scrollTrigger: {
            trigger: root,
            start: "top top",
            end: "bottom top",
            scrub: true,
          },
        });

        gsap.to(".hero-stack", {
          yPercent: 14,
          ease: "none",
          scrollTrigger: {
            trigger: root,
            start: "top top",
            end: "bottom top",
            scrub: true,
          },
        });
      });

      // Pointer parallax on devices with a hover-capable pointer: the imagery
      // leans away from the cursor while the copy drifts with it.
      mm.add(
        "(min-width: 768px) and (hover: hover) and (prefers-reduced-motion: no-preference)",
        () => {
          gsap.set(".hero-stack", { scale: 1.06 });

          const stackX = gsap.quickTo(".hero-stack", "x", { duration: 1.2, ease: "power3.out" });
          const stackY = gsap.quickTo(".hero-stack", "y", { duration: 1.2, ease: "power3.out" });
          const contentX = gsap.quickTo(".hero-content", "x", {
            duration: 1,
            ease: "power3.out",
          });

          const onPointerMove = (event: PointerEvent) => {
            const nx = event.clientX / window.innerWidth - 0.5;
            const ny = event.clientY / window.innerHeight - 0.5;
            stackX(nx * -18);
            stackY(ny * -12);
            contentX(nx * 10);
          };

          root.addEventListener("pointermove", onPointerMove);
          return () => root.removeEventListener("pointermove", onPointerMove);
        },
      );

      return () => mm.revert();
    },
    { scope: rootRef, dependencies: [hydrated], revertOnUpdate: true },
  );

  return (
    <section ref={rootRef} className="relative isolate min-h-dvh overflow-hidden bg-ink">
      <div className="hero-stack absolute inset-0 -z-10">
        {slides.map((slide, index) => (
          <div key={slide.src} className="hero-slide absolute inset-0">
            <Image
              src={slide.src}
              alt={slide.alt}
              fill
              priority={index === 0}
              sizes="100vw"
              className="object-cover object-center"
            />
          </div>
        ))}
        {/* Three layers rather than two: a deep dusk floor for the copy to sit
            on, a side wash that carries the sea blue in from the right, and a
            top veil so the fixed header always has something to read against. */}
        <div className="absolute inset-0 bg-linear-to-t from-night via-night/55 to-night/10" />
        <div className="absolute inset-0 bg-linear-to-r from-night/70 via-transparent to-sea-deep/25" />
        <div className="absolute inset-x-0 top-0 h-40 bg-linear-to-b from-night/60 to-transparent" />
        <div
          aria-hidden
          className="hero-glow absolute inset-[-15%] bg-[radial-gradient(38%_45%_at_68%_30%,color-mix(in_oklab,var(--brand-blue-light)_28%,transparent),transparent_70%)]"
        />
      </div>

      {/* Wordless scroll cue - a hairline with a travelling highlight. */}
      <div
        aria-hidden
        className="hero-cue pointer-events-none absolute right-6 bottom-0 hidden h-20 w-px overflow-hidden bg-white/15 md:block lg:right-10"
      >
        <span className="hero-cue-dot block h-6 w-px bg-brand-light" />
      </div>

      <div className="mx-auto flex min-h-dvh max-w-6xl flex-col justify-end px-5 pb-14 pt-28 md:px-8 md:pb-16">
        <div className="hero-content max-w-4xl">
          <div className="flex items-center gap-4">
            <span className="hero-kicker-rule h-px w-10 origin-left bg-brand-light/80 md:w-14" />
            <span className="hero-kicker font-medium text-brand-light text-xs tracking-[0.26em] uppercase md:text-sm">
              {hero.eyebrow}
            </span>
          </div>

          <h1
            aria-label={hero.headline.join(" ")}
            className="voice-hero mt-6 font-display text-display-xl text-white tracking-[-0.025em] md:mt-8"
          >
            <span aria-hidden>
              {hero.headline.map((line) => (
                <SplitLine key={line} line={line} />
              ))}
            </span>
          </h1>

          <p className="hero-support mt-7 max-w-xl text-lg text-white/80 leading-relaxed md:mt-9 md:text-xl">
            {hero.support}
          </p>

          <div className="hero-cta mt-9 flex flex-wrap gap-3 md:mt-10">
            <a
              href={hero.primaryCta.href}
              className="group inline-flex items-center gap-2.5 rounded-chip bg-brand-light px-7 py-3.5 font-medium text-base text-night shadow-night/30 shadow-lg transition-[background-color,box-shadow] duration-300 hover:bg-white hover:shadow-night/40 hover:shadow-xl"
            >
              {hero.primaryCta.label}
              <ArrowRight
                className="size-4 transition-transform duration-300 group-hover:translate-x-1"
                aria-hidden
              />
            </a>
            <a
              href={hero.secondaryCta.href}
              className="rounded-chip border border-white/35 px-7 py-3.5 font-medium text-base text-white backdrop-blur-md transition-colors duration-300 hover:border-white/70 hover:bg-white/10"
            >
              {hero.secondaryCta.label}
            </a>
          </div>

          <div className="hero-meta mt-12 flex items-center justify-between gap-6 border-white/15 border-t pt-5">
            <p className="text-white/65 text-xs tracking-[0.22em] uppercase md:text-sm">
              {hero.meta}
            </p>
            <div className="flex items-center gap-2" aria-hidden>
              {hero.slides.map((slide) => (
                <span
                  key={slide.src}
                  className="h-0.5 w-8 overflow-hidden rounded-chip bg-white/20 md:w-14"
                >
                  <span className="hero-bar-fill block h-full w-full origin-left rounded-chip bg-brand-light" />
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
