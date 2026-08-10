import Image from "next/image";

import { NavLink } from "@/components/nav-link";
import type { SiteContent } from "@/lib/site-content";

export function SiteFooter({ site }: { site: SiteContent }) {
  return (
    <footer className="relative bg-ink text-white">
      {/* A slim sea accent along the seam against the light section above. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-0.5 bg-linear-to-r from-transparent via-sea/60 to-transparent"
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
                <span className="text-brand-soft">Ølberg</span>
                <span className="text-sea">strandhager</span>
              </div>
              <p className="mt-1 font-display text-white/70 text-sm italic">{site.tagline}</p>
            </div>
          </div>
        </div>

        <div>
          <p className="font-medium text-xs tracking-[0.18em] text-white/50 uppercase">Utleie</p>
          <p className="mt-3 text-sm text-white/85">{site.contact.booking.name}</p>
          <a
            href={`mailto:${site.contact.booking.email}`}
            className="mt-1 block text-sm text-sea hover:underline"
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
            className="mt-1 block text-sm text-sea hover:underline"
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
