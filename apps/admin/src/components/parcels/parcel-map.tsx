"use client";

import "leaflet/dist/leaflet.css";

import { useCallback, useEffect, useRef, useState } from "react";

import type * as Leaflet from "leaflet";
import { House, Maximize, Minus, Plus } from "lucide-react";

import { PARCEL_STATUS_LABELS } from "@/components/parcels/badges";
import {
  HALL,
  PARCEL_LOCATIONS,
  SITE_BOUNDS,
} from "@/components/parcels/parcel-locations";
import { Button } from "@/components/ui/button";
import {
  NORKART_ATTRIBUTION,
  NORKART_MAX_ZOOM,
  NORKART_TILE_URL,
} from "@/lib/norkart";
import type { Parcel, ParcelStatus } from "@/types/parcel";

/** Zoomed in this far, there is room to name who rents each plot. */
const NAME_ZOOM = 19;

const MIN_ZOOM = 16;

const MARKER_STYLES: Record<ParcelStatus, string> = {
  OWNED: "bg-emerald-600 text-white",
  VACANT: "bg-amber-400 text-amber-950",
  UNAVAILABLE: "bg-slate-500 text-white",
};

function escape(text: string) {
  return text.replace(
    /[&<>"']/g,
    (character) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        character
      ]!,
  );
}

/**
 * The parcels on Norkart's aerial photograph, where the hedges and cabins are
 * plainly visible, so each plot only needs marking rather than drawing. Panning
 * and zooming work as on any map, and a plot opens when it is clicked.
 */
export function ParcelMap({
  parcels,
  filter,
  onSelect,
}: {
  parcels: Parcel[];
  /** Plots outside the filter stay on the map, faded, so it still reads. */
  filter: ParcelStatus | null;
  onSelect: (parcel: Parcel) => void;
}) {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<Leaflet.Map | null>(null);
  const leaflet = useRef<typeof Leaflet | null>(null);
  const markers = useRef<Leaflet.LayerGroup | null>(null);

  const [zoom, setZoom] = useState(0);
  const [ready, setReady] = useState(false);

  // Kept in a ref so redrawing the markers does not depend on the latest
  // callback, which would tear the whole layer down on every parent render.
  const select = useRef(onSelect);
  select.current = onSelect;

  const fit = useCallback(() => {
    const L = leaflet.current;
    if (!L || !map.current) return;

    map.current.fitBounds(
      L.latLngBounds(
        [SITE_BOUNDS.south, SITE_BOUNDS.west],
        [SITE_BOUNDS.north, SITE_BOUNDS.east],
      ),
      { padding: [24, 24] },
    );
  }, []);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !container.current || map.current) return;

      const bounds = L.latLngBounds(
        [SITE_BOUNDS.south, SITE_BOUNDS.west],
        [SITE_BOUNDS.north, SITE_BOUNDS.east],
      );

      const instance = L.map(container.current, {
        maxZoom: NORKART_MAX_ZOOM,
        minZoom: MIN_ZOOM,
        zoomControl: false,
        // Without this the opening view is rounded down a whole level, which
        // leaves the site as a small clump in the middle of a lot of farmland.
        zoomSnap: 0,
        // The site is all there is to look at, so the map is kept over it.
        maxBounds: bounds.pad(0.6),
        maxBoundsViscosity: 0.85,
      });

      instance.attributionControl.setPrefix(false);

      L.tileLayer(NORKART_TILE_URL, {
        maxZoom: NORKART_MAX_ZOOM,
        attribution: NORKART_ATTRIBUTION,
      }).addTo(instance);

      instance.fitBounds(bounds, { padding: [24, 24] });

      L.marker([HALL.lat, HALL.lon], {
        interactive: false,
        keyboard: false,
        icon: L.divIcon({
          className: "",
          iconSize: [24, 24],
          iconAnchor: [12, 12],
          html: `<span class="flex size-6 items-center justify-center rounded-md bg-stone-800/85 text-white shadow-md ring-1 ring-white/40" title="Felleshuset">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"/><path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
          </span>`,
        }),
      }).addTo(instance);

      markers.current = L.layerGroup().addTo(instance);

      instance.on("zoomend", () => setZoom(instance.getZoom()));
      setZoom(instance.getZoom());

      leaflet.current = L;
      map.current = instance;
      setReady(true);
    })();

    return () => {
      cancelled = true;
      map.current?.remove();
      map.current = null;
      markers.current = null;
      leaflet.current = null;
      setReady(false);
    };
  }, []);

  // Leaflet measures the container once, so it has to be told when the sidebar
  // or the window changes the width underneath it.
  useEffect(() => {
    if (!ready || !container.current) return;

    const observer = new ResizeObserver(() => map.current?.invalidateSize());
    observer.observe(container.current);
    return () => observer.disconnect();
  }, [ready]);

  useEffect(() => {
    const L = leaflet.current;
    const layer = markers.current;
    if (!L || !layer) return;

    layer.clearLayers();

    const byNumber = new Map(parcels.map((parcel) => [parcel.number, parcel]));
    const named = zoom >= NAME_ZOOM;

    for (const place of PARCEL_LOCATIONS) {
      const parcel = byNumber.get(place.number);
      if (!parcel) continue;

      const dimmed = filter !== null && parcel.status !== filter;
      const owner = parcel.owner
        ? `${parcel.owner.firstName} ${parcel.owner.lastName}`
        : null;

      const label =
        named && owner
          ? `<span class="max-w-24 truncate text-[0.5rem] leading-tight opacity-90">${escape(parcel.owner!.lastName)}</span>`
          : "";

      const marker = L.marker([place.lat, place.lon], {
        keyboard: true,
        title: `Parsell ${place.number}`,
        alt: `Parsell ${place.number}, ${owner ?? PARCEL_STATUS_LABELS[parcel.status]}`,
        opacity: dimmed ? 0.35 : 1,
        icon: L.divIcon({
          className: "",
          iconSize: [30, 30],
          iconAnchor: [15, 15],
          html: `<span class="flex size-7.5 cursor-pointer flex-col items-center justify-center rounded-full font-semibold text-[0.7rem] leading-none tabular-nums shadow-md ring-2 ring-white/90 transition-transform hover:scale-110 ${MARKER_STYLES[parcel.status]}">
            <span>${place.number}</span>${label}
          </span>`,
        }),
      });

      marker.on("click", () => select.current(parcel));
      marker.addTo(layer);
    }
  }, [parcels, filter, zoom, ready]);

  return (
    <div className="relative overflow-hidden rounded-xl border">
      <div
        ref={container}
        // The site is close to square, so a wide, short frame would only add
        // farmland on either side.
        className="aspect-4/3 max-h-[44rem] w-full bg-muted"
        // Leaflet's own panes sit at 400 and up, which would otherwise cover
        // dialogs and the sidebar.
        style={{ zIndex: 0 }}
      />

      <div className="absolute top-3 right-3 z-500 flex flex-col gap-1 rounded-lg border bg-background/90 p-1 shadow-sm backdrop-blur">
        <Button
          variant="ghost"
          size="icon"
          className="size-8"
          aria-label="Zoom inn"
          onClick={() => map.current?.zoomIn()}
        >
          <Plus className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="size-8"
          aria-label="Zoom ut"
          onClick={() => map.current?.zoomOut()}
        >
          <Minus className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="size-8"
          aria-label="Vis hele området"
          onClick={fit}
        >
          <Maximize className="size-4" />
        </Button>
      </div>

      <div className="absolute bottom-3 left-3 z-500 flex items-center gap-1.5 rounded-md bg-background/85 px-2 py-1 text-[0.7rem] text-muted-foreground shadow-sm backdrop-blur">
        <House className="size-3" aria-hidden />
        Felleshuset
      </div>
    </div>
  );
}
