"use client";

import { useRef, type ReactNode } from "react";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(useGSAP, ScrollTrigger);

type SectionRevealProps = {
  children: ReactNode;
  className?: string;
  id?: string;
};

export function SectionReveal({ children, className, id }: SectionRevealProps) {
  const rootRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const root = rootRef.current;
      if (!root) return;

      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: reduce)", () => {
        gsap.set(
          root.querySelectorAll(
            "[data-reveal], [data-reveal-rule], [data-reveal-clip], [data-slide]",
          ),
          { clearProps: "all" },
        );
      });

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const items = root.querySelectorAll<HTMLElement>("[data-reveal]");
        items.forEach((el, index) => {
          gsap.from(el, {
            opacity: 0,
            y: 40,
            duration: 0.9,
            ease: "power3.out",
            delay: index * 0.06,
            // Drop the inline transform/opacity once the reveal lands. GSAP
            // writes transform inline, which outranks Tailwind's hover:-translate
            // rules and would leave the card hover lifts dead on arrival.
            clearProps: "opacity,transform",
            scrollTrigger: {
              trigger: el,
              start: "top 88%",
              toggleActions: "play none none none",
            },
          });
        });

        const rules = root.querySelectorAll<HTMLElement>("[data-reveal-rule]");
        rules.forEach((el) => {
          gsap.from(el, {
            scaleX: 0,
            transformOrigin: "left center",
            duration: 1.1,
            ease: "power3.out",
            scrollTrigger: { trigger: el, start: "top 92%" },
          });
        });

        const counters = root.querySelectorAll<HTMLElement>("[data-count]");
        counters.forEach((el) => {
          const target = Number(el.dataset.count);
          if (!Number.isFinite(target)) return;

          const counter = { value: 0 };
          gsap.to(counter, {
            value: target,
            duration: 1.6,
            ease: "power2.out",
            scrollTrigger: { trigger: el, start: "top 90%" },
            onUpdate: () => {
              el.textContent = String(Math.round(counter.value));
            },
          });
        });

        // Image frames unmask from the bottom edge instead of fading, so the
        // photo is never shown at partial opacity.
        const frames = root.querySelectorAll<HTMLElement>("[data-reveal-clip]");
        frames.forEach((el) => {
          gsap.from(el, {
            clipPath: "inset(100% 0% 0% 0%)",
            duration: 1.3,
            ease: "power3.inOut",
            clearProps: "clipPath",
            scrollTrigger: {
              trigger: el,
              start: "top 88%",
              toggleActions: "play none none none",
            },
          });
        });

        // Columns and bands that enter from the side. Direction comes from the
        // attribute so the two halves of a split can lean towards each other.
        const sliders = root.querySelectorAll<HTMLElement>("[data-slide]");
        sliders.forEach((el, index) => {
          const from = el.dataset.slide === "right" ? 1 : -1;
          gsap.from(el, {
            x: from * 64,
            opacity: 0,
            duration: 1.1,
            ease: "power3.out",
            delay: index * 0.08,
            clearProps: "opacity,transform",
            scrollTrigger: {
              trigger: el,
              start: "top 88%",
              toggleActions: "play none none none",
            },
          });
        });

        // Every framed image drifts, each against its own frame rather than the
        // section, so two images in one section stay in step with their crops.
        const media = root.querySelectorAll<HTMLElement>("[data-parallax]");
        media.forEach((el) => {
          gsap.fromTo(
            el,
            { yPercent: -6 },
            {
              yPercent: 6,
              ease: "none",
              scrollTrigger: {
                trigger: el.closest("figure") ?? root,
                start: "top bottom",
                end: "bottom top",
                scrub: true,
              },
            },
          );
        });
      });

      return () => mm.revert();
    },
    { scope: rootRef },
  );

  return (
    <section id={id} ref={rootRef} className={className}>
      {children}
    </section>
  );
}
