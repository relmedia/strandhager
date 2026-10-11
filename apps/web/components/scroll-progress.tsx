"use client";

import { useRef } from "react";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(useGSAP, ScrollTrigger);

/**
 * A hairline read-through indicator pinned above the header. Garden green
 * running into sea blue, so the page's own gradient tracks your progress
 * from the gardens down to the shore.
 */
export function ScrollProgress() {
  const barRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const bar = barRef.current;
    if (!bar) return;

    const mm = gsap.matchMedia();

    // With reduced motion the bar is noise, not information - drop it.
    mm.add("(prefers-reduced-motion: reduce)", () => {
      gsap.set(bar, { autoAlpha: 0 });
    });

    mm.add("(prefers-reduced-motion: no-preference)", () => {
      gsap.set(bar, { scaleX: 0, transformOrigin: "left center" });
      gsap.to(bar, {
        scaleX: 1,
        ease: "none",
        scrollTrigger: {
          trigger: document.documentElement,
          start: "top top",
          end: "bottom bottom",
          scrub: 0.3,
          invalidateOnRefresh: true,
        },
      });
    });

    return () => mm.revert();
  });

  return (
    <div aria-hidden className="pointer-events-none fixed inset-x-0 top-0 z-100 h-0.5">
      <div
        ref={barRef}
        className="h-full w-full bg-linear-to-r from-brand via-brand-light to-sea"
      />
    </div>
  );
}
