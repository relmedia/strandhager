"use client";

import { Fragment, useRef, type ElementType } from "react";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(useGSAP, ScrollTrigger);

type MaskedHeadingProps = {
  /** Rendered verbatim; only the whitespace between words is used to split. */
  text: string;
  as?: ElementType;
  className?: string;
  /** ScrollTrigger start, for headings that sit low in their section. */
  start?: string;
};

/**
 * A heading whose words rise out of their own clipping boxes on scroll. The
 * words stay real text nodes with real spaces between them, so selection,
 * copy-paste and screen readers behave exactly as they would without the
 * split - no aria-label needed.
 */
export function MaskedHeading({
  text,
  as: Tag = "h2",
  className,
  start = "top 85%",
}: MaskedHeadingProps) {
  const rootRef = useRef<HTMLElement>(null);
  const words = text.split(" ");

  useGSAP(
    () => {
      const root = rootRef.current;
      if (!root) return;

      const mm = gsap.matchMedia();
      const inner = root.querySelectorAll<HTMLElement>(".word-mask > span");

      mm.add("(prefers-reduced-motion: reduce)", () => {
        gsap.set(inner, { clearProps: "all" });
      });

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.from(inner, {
          yPercent: 132,
          duration: 1.1,
          ease: "expo.out",
          stagger: 0.055,
          scrollTrigger: { trigger: root, start, toggleActions: "play none none none" },
        });
      });

      return () => mm.revert();
    },
    { scope: rootRef },
  );

  return (
    <Tag ref={rootRef} className={className}>
      {words.map((word, index) => (
        <Fragment key={`${word}-${index}`}>
          <span className="word-mask">
            <span>{word}</span>
          </span>
          {/* Outside the mask, or overflow:hidden would eat the space. */}
          {index < words.length - 1 ? " " : null}
        </Fragment>
      ))}
    </Tag>
  );
}
