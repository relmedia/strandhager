import Image from "next/image";

import { NavLink } from "@/components/nav-link";
import type { SiteContent } from "@/lib/site-content";

/* lucide dropped its brand icons in v1, so the Facebook mark is inline. */
function FacebookMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className={className}>
      <path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5.02 3.66 9.18 8.44 9.94v-7.03H7.9v-2.91h2.54V9.85c0-2.52 1.5-3.91 3.77-3.91 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.78-1.63 1.57v1.89h2.78l-.44 2.91h-2.34V22c4.78-.76 8.44-4.92 8.44-9.94Z" />
    </svg>
  );
}

export function SiteFooter({ site }: { site: SiteContent }) {
  return (
    <footer className="relative bg-night text-white">
      {/* A slim sea accent along the seam against the light section above. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-sea-light/60 to-transparent"
      />

      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 md:grid-cols-[1.2fr_1fr_1fr] md:px-8 md:py-16">
        <div>
          <div className="flex items-center gap-3">
            <Image
              src={site.logo}
              alt=""
              width={112}
              height={72}
              className="h-14 w-auto object-contain"
            />
            <div>
              <div className="font-medium tracking-wide">
                <span className="text-brand-light">Ølberg</span>
                <span className="text-sea-light">strandhager</span>
              </div>
              <p className="mt-1 font-display text-white/70 text-sm italic">{site.tagline}</p>
            </div>
          </div>

          {/* The gardens' Facebook group - the same link the interest list
              points at, so there is one place it is maintained. */}
          <a
            href={site.parsellene.waitlist.facebookUrl}
            target="_blank"
            rel="noreferrer noopener"
            aria-label={site.parsellene.waitlist.facebookLabel}
            className="mt-6 inline-flex size-10 items-center justify-center rounded-chip text-white/75 ring-1 ring-white/15 transition-colors duration-300 hover:bg-brand-light hover:text-night hover:ring-brand-light"
          >
            <FacebookMark className="size-4.5" />
          </a>
        </div>

        <div>
          <p className="font-medium text-xs tracking-[0.18em] text-white/50 uppercase">Utleie</p>
          <p className="mt-3 text-sm text-white/85">{site.contact.booking.name}</p>
          <a
            href={`mailto:${site.contact.booking.email}`}
            className="mt-1 block text-sm text-sea-light hover:underline"
          >
            {site.contact.booking.email}
          </a>
          <a
            href={`tel:${site.contact.booking.phone.replace(/\s/g, "")}`}
            className="mt-1 block text-sm text-white/85 hover:underline"
          >
            {site.contact.booking.phone}
          </a>
        </div>

        <div>
          <p className="font-medium text-xs tracking-[0.18em] text-white/50 uppercase">Parsellene</p>
          <p className="mt-3 text-sm text-white/85">{site.contact.plots.name}</p>
          <a
            href={`mailto:${site.contact.plots.email}`}
            className="mt-1 block text-sm text-sea-light hover:underline"
          >
            {site.contact.plots.email}
          </a>
          <a
            href={`mailto:${site.parsellene.board.email}`}
            className="mt-1 block text-sm text-white/70 hover:underline"
          >
            {site.parsellene.board.email}
          </a>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-5 py-5 text-white/45 text-xs md:flex-row md:items-center md:justify-between md:px-8">
          <p>{site.footer.copyright}</p>
          <nav className="flex gap-4">
            {site.nav.map((item, index) => (
              <NavLink
                key={`${item.href}-${index}`}
                item={item}
                className="hover:text-white/80"
              />
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
}
