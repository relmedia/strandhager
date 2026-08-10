"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import Image from "next/image";

import type { GalleryImage } from "@/lib/gallery";

gsap.registerPlugin(useGSAP);

type GalleryViewerProps = {
  images: readonly GalleryImage[];
};

export function GalleryViewer({ images }: GalleryViewerProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const lightboxRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState<number | null>(null);

  const close = useCallback(() => setActive(null), []);
  const step = useCallback(
    (delta: number) => {
      setActive((current) =>
        current === null ? current : (current + delta + images.length) % images.length,
      );
    },
    [images.length],
  );

  useEffect(() => {
    if (active === null) return;

    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
      if (event.key === "ArrowLeft") step(-1);
      if (event.key === "ArrowRight") step(1);
    };
    window.addEventListener("keydown", onKey);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [active, close, step]);

  // Grid tiles drift in with a gentle stagger.
  useGSAP(
    () => {
      gsap.from("[data-tile]", {
        autoAlpha: 0,
        y: 24,
        duration: 0.7,
        ease: "power2.out",
        stagger: 0.04,
      });
    },
    { scope: rootRef },
  );

  // Lightbox entrance whenever it opens or the photo changes.
  useGSAP(
    () => {
      if (active === null || !lightboxRef.current) return;
      gsap.fromTo(
        lightboxRef.current.querySelector("[data-lightbox-image]"),
        { autoAlpha: 0, scale: 0.97 },
        { autoAlpha: 1, scale: 1, duration: 0.45, ease: "power3.out" },
      );
    },
    { dependencies: [active] },
  );

  return (
    <div ref={rootRef}>
      <ul className="columns-1 gap-4 sm:columns-2 lg:columns-3">
        {images.map((image, index) => (
          <li key={image.src} data-tile className="mb-4 break-inside-avoid">
            <button
              type="button"
              onClick={() => setActive(index)}
              className="group block w-full cursor-pointer overflow-hidden rounded-sm ring-1 ring-ink/10 transition-shadow duration-300 hover:shadow-ink/15 hover:shadow-lg"
              aria-label={`Vis bilde ${index + 1} i full størrelse`}
            >
              <Image
                src={image.src}
                alt={image.alt}
                width={image.width}
                height={image.height}
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className="h-auto w-full transition-transform duration-500 ease-out group-hover:scale-[1.03]"
              />
            </button>
          </li>
        ))}
      </ul>

      {active !== null ? (
        <div
          ref={lightboxRef}
          role="dialog"
          aria-modal="true"
          aria-label={`Bilde ${active + 1} av ${images.length}`}
          className="fixed inset-0 z-50 flex flex-col bg-ink/95 backdrop-blur-sm"
        >
          <div className="flex items-center justify-between px-5 py-4 md:px-8">
            <p className="text-sm text-white/70 tabular-nums tracking-[0.18em]">
              {String(active + 1).padStart(2, "0")} / {String(images.length).padStart(2, "0")}
            </p>
            <button
              type="button"
              onClick={close}
              aria-label="Lukk bildevisning"
              className="flex size-11 cursor-pointer items-center justify-center rounded-full text-white/80 transition-colors hover:bg-white/10 hover:text-white"
            >
              <X className="size-5" aria-hidden />
            </button>
          </div>

          <div className="relative flex-1 px-5 pb-6 md:px-20">
            <div data-lightbox-image className="relative h-full w-full">
              <Image
                src={images[active].src}
                alt={images[active].alt}
                fill
                sizes="100vw"
                quality={90}
                className="object-contain"
                priority
              />
            </div>

            <button
              type="button"
              onClick={() => step(-1)}
              aria-label="Forrige bilde"
              className="-translate-y-1/2 absolute top-1/2 left-3 flex size-11 cursor-pointer items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm transition-colors hover:bg-white/25 md:left-6"
            >
              <ChevronLeft className="size-5" aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => step(1)}
              aria-label="Neste bilde"
              className="-translate-y-1/2 absolute top-1/2 right-3 flex size-11 cursor-pointer items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm transition-colors hover:bg-white/25 md:right-6"
            >
              <ChevronRight className="size-5" aria-hidden />
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
