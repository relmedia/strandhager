import type { CSSProperties } from "react";

import { cn } from "@cabin/ui/lib/utils";

type SpotlightProps = {
  className?: string;
  /** Hue of the light, in degrees. Defaults to the sea blue. */
  hue?: number;
  translateY?: number;
  width?: number;
  height?: number;
  smallWidth?: number;
  /** Seconds for one sweep out and back. */
  duration?: number;
  /** How far, in pixels, each beam sweeps sideways. */
  xOffset?: number;
};

/**
 * Two soft searchlights angled in from the top corners, drifting slowly
 * towards each other and back, after Aceternity UI's "Spotlight (new)".
 * A decorative layer: place it inside a `relative overflow-hidden` element.
 *
 * The original animates with `motion`; plain CSS keyframes (spotlight-sway in
 * globals.css) do the same here. Visitors who prefer reduced motion get the
 * light standing still.
 */
export function Spotlight({
  className,
  hue = 198,
  translateY = -350,
  width = 560,
  height = 1380,
  smallWidth = 240,
  duration = 7,
  xOffset = 100,
}: SpotlightProps) {
  const first = `radial-gradient(68.54% 68.72% at 55.02% 31.46%, hsla(${hue}, 100%, 85%, .08) 0, hsla(${hue}, 100%, 55%, .02) 50%, hsla(${hue}, 100%, 45%, 0) 80%)`;
  const second = `radial-gradient(50% 50% at 50% 50%, hsla(${hue}, 100%, 85%, .06) 0, hsla(${hue}, 100%, 55%, .02) 80%, transparent 100%)`;
  const third = `radial-gradient(50% 50% at 50% 50%, hsla(${hue}, 100%, 85%, .04) 0, hsla(${hue}, 100%, 45%, .02) 80%, transparent 100%)`;

  const side = (direction: 1 | -1): CSSProperties =>
    ({
      "--spotlight-x": `${xOffset * direction}px`,
      animationDuration: `${duration}s`,
    }) as CSSProperties;

  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-0 h-full w-full animate-[spotlight-in_1.5s_ease-out_both]",
        className,
      )}
    >
      <div
        style={side(1)}
        className="absolute top-0 left-0 h-screen w-screen animate-spotlight-sway motion-reduce:animate-none"
      >
        <div
          style={{ transform: `translateY(${translateY}px) rotate(-45deg)`, background: first, width, height }}
          className="absolute top-0 left-0"
        />
        <div
          style={{ transform: "rotate(-45deg) translate(5%, -50%)", background: second, width: smallWidth, height }}
          className="absolute top-0 left-0 origin-top-left"
        />
        <div
          style={{ transform: "rotate(-45deg) translate(-180%, -70%)", background: third, width: smallWidth, height }}
          className="absolute top-0 left-0 origin-top-left"
        />
      </div>

      <div
        style={side(-1)}
        className="absolute top-0 right-0 h-screen w-screen animate-spotlight-sway motion-reduce:animate-none"
      >
        <div
          style={{ transform: `translateY(${translateY}px) rotate(45deg)`, background: first, width, height }}
          className="absolute top-0 right-0"
        />
        <div
          style={{ transform: "rotate(45deg) translate(-5%, -50%)", background: second, width: smallWidth, height }}
          className="absolute top-0 right-0 origin-top-right"
        />
        <div
          style={{ transform: "rotate(45deg) translate(180%, -70%)", background: third, width: smallWidth, height }}
          className="absolute top-0 right-0 origin-top-right"
        />
      </div>
    </div>
  );
}
