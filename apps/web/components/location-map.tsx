"use client";

import "leaflet/dist/leaflet.css";

import { useEffect, useRef } from "react";

import type * as Leaflet from "leaflet";
import { Minus, Plus } from "lucide-react";

/**
 * The same Norkart WebAtlas service the admin's parcel map runs on, but on the
 * standard cartography layer rather than the aerial photo, so the section
 * keeps its light look with blue water. The key travels in the tile URL and
 * cannot be hidden from the browser; Norkart restricts it on their side.
 */
const NORKART_KEY =
  process.env.NEXT_PUBLIC_NORKART_API_KEY ?? "b8e36d51-119a-423b-b156-d744d54123d5";

const TILE_URL = `https://waapi.webatlas.no/maptiles/tiles/webatlas-standard-vektor/wa_grid/{z}/{x}/{y}.png?api_key=${NORKART_KEY}`;

const ATTRIBUTION = "Kart: &copy; Norkart";

/**
 * A calm, light-toned map centred on the gardens, with a pulsing brand marker.
 * Scroll wheel zoom is off so the page keeps scrolling naturally; the buttons
 * zoom instead.
 */
export function LocationMap({ lat, lng }: { lat: number; lng: number }) {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<Leaflet.Map | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function boot() {
      const L = (await import("leaflet")).default;
      if (cancelled || !container.current || map.current) return;

      const instance = L.map(container.current, {
        center: [lat, lng],
        zoom: 14,
        minZoom: 9,
        maxZoom: 17,
        zoomControl: false,
        scrollWheelZoom: false,
      });

      // Drop the "Leaflet" plug in the corner; only Norkart's credit is due.
      instance.attributionControl.setPrefix(false);

      L.tileLayer(TILE_URL, {
        attribution: ATTRIBUTION,
        maxZoom: 20,
      }).addTo(instance);

      L.marker([lat, lng], {
        keyboard: false,
        icon: L.divIcon({
          className: "",
          html: `<span class="relative flex size-5">
            <span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand/50"></span>
            <span class="relative inline-flex size-5 rounded-full border-[3px] border-white bg-brand shadow-md"></span>
          </span>`,
          iconSize: [20, 20],
          iconAnchor: [10, 10],
        }),
      }).addTo(instance);

      map.current = instance;
    }

    boot();

    return () => {
      cancelled = true;
      map.current?.remove();
      map.current = null;
    };
  }, [lat, lng]);

  // Leaflet only measures once, so layout changes need a nudge.
  useEffect(() => {
    if (!container.current) return;
    const observer = new ResizeObserver(() => map.current?.invalidateSize());
    observer.observe(container.current);
    return () => observer.disconnect();
  }, []);

  const zoomBy = (delta: number) => {
    const instance = map.current;
    if (instance) instance.setZoom(instance.getZoom() + delta);
  };

  return (
    <div className="relative h-full w-full">
      <div
        ref={container}
        className="h-full w-full"
        aria-label="Kart som viser hvor Ølberg strandhager ligger"
      />

      <div className="absolute right-4 bottom-8 z-500 flex flex-col overflow-hidden rounded-lg bg-white shadow-md ring-1 ring-ink/10">
        <button
          type="button"
          onClick={() => zoomBy(1)}
          aria-label="Zoom inn"
          className="flex size-9 items-center justify-center text-ink-muted transition-colors hover:bg-sand hover:text-ink"
        >
          <Plus className="size-4" strokeWidth={2} aria-hidden />
        </button>
        <span className="h-px bg-ink/10" aria-hidden />
        <button
          type="button"
          onClick={() => zoomBy(-1)}
          aria-label="Zoom ut"
          className="flex size-9 items-center justify-center text-ink-muted transition-colors hover:bg-sand hover:text-ink"
        >
          <Minus className="size-4" strokeWidth={2} aria-hidden />
        </button>
      </div>
    </div>
  );
}
