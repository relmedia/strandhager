"use client";

import { useEffect, useRef, useState } from "react";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Image from "next/image";
import Link from "next/link";

import { ContactDialog } from "@/components/contact-dialog";
import { NavLink } from "@/components/nav-link";
import type { ContactContent, NavItem } from "@/lib/site-content";

gsap.registerPlugin(useGSAP, ScrollTrigger);

type SiteHeaderProps = {
  logo: string;
  name: string;
  nav: NavItem[];
  contact: ContactContent;
};

export function SiteHeader({ logo, name, nav, contact }: SiteHeaderProps) {
  const headerRef = useRef<HTMLElement>(null);
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const openRef = useRef(open);
  openRef.current = open;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 32);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Hide the bar when scrolling down, slide it back in when scrolling up.
  useGSAP(
    () => {
      const header = headerRef.current;
      if (!header) return;

      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const slide = gsap
          .from(header, { yPercent: -130, paused: true, duration: 0.5, ease: "power3.out" })
          .progress(1);

        ScrollTrigger.create({
          start: "top top",
          end: "max",
          onUpdate: (self) => {
            if (openRef.current || self.direction === -1 || self.scroll() < 120) {
              slide.play();
            } else {
              slide.reverse();
            }
          },
        });
      });

      return () => mm.revert();
    },
    { scope: headerRef },
  );

  const condensed = scrolled || open;

  return (
    <header ref={headerRef} className="fixed inset-x-0 top-0 z-50 px-3 md:px-6">
      <div
        className={`mx-auto max-w-6xl transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${
          condensed
            ? "mt-3 rounded-2xl border border-ink/8 bg-white/85 shadow-[0_16px_40px_-20px_rgba(20,30,20,0.25)] backdrop-blur-xl md:mt-4"
            : "mt-0 rounded-2xl border border-transparent bg-transparent"
        }`}
      >
        <div
          className={`flex items-center justify-between gap-4 px-4 transition-[height] duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] md:px-6 ${
            condensed ? "h-14 md:h-16" : "h-20 md:h-24"
          }`}
        >
          <Link
            href="/"
            className="relative z-10 flex items-center gap-3"
            onClick={() => setOpen(false)}
          >
            <Image
              src={logo}
              alt={name}
              width={172}
              height={110}
              className={`w-auto object-contain transition-all duration-500 ${
                condensed ? "h-8 md:h-9" : "h-10 md:h-12"
              }`}
              priority
            />
            <span className="hidden font-medium text-lg tracking-wide sm:inline md:text-xl">
              <span className={condensed ? "text-brand" : "text-[#8fd46f]"}>Ølberg</span>
              <span className={condensed ? "text-sea" : "text-[#7ec8e8]"}>strandhager</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {nav.map((item, index) => (
              <NavLink
                key={`${item.href}-${index}`}
                item={item}
                className={`rounded-full px-3.5 py-2 text-sm tracking-wide transition-colors duration-200 ${
                  condensed
                    ? "text-ink-muted hover:bg-ink/5 hover:text-ink"
                    : "text-white/85 hover:bg-white/12 hover:text-white"
                }`}
              />
            ))}
            <button
              type="button"
              onClick={() => setContactOpen(true)}
              className="ml-3 rounded-full bg-brand px-5 py-2 font-medium text-sm text-white shadow-brand-deep/25 shadow-sm transition-all duration-300 hover:bg-brand-deep hover:shadow-brand-deep/30 hover:shadow-md"
            >
              Kontakt
            </button>
          </nav>

          <button
            type="button"
            className={`relative z-10 flex h-10 w-10 items-center justify-center md:hidden ${
              condensed ? "text-ink" : "text-white"
            }`}
            aria-label={open ? "Lukk meny" : "Åpne meny"}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            <span className="sr-only">Meny</span>
            <span className="flex w-5 flex-col gap-1.5">
              <span
                className={`h-px w-full bg-current transition ${open ? "translate-y-[3.5px] rotate-45" : ""}`}
              />
              <span
                className={`h-px w-full bg-current transition ${open ? "translate-y-[-3.5px] -rotate-45" : ""}`}
              />
            </span>
          </button>
        </div>

        {open ? (
          <div className="border-t border-ink/10 px-5 py-6 md:hidden">
            <nav className="flex flex-col gap-4">
              {nav.map((item, index) => (
                <NavLink
                  key={`${item.href}-${index}`}
                  item={item}
                  className="text-ink text-lg"
                  onClick={() => setOpen(false)}
                />
              ))}
              <button
                type="button"
                className="mt-2 inline-flex w-fit rounded-full bg-brand px-5 py-2 font-medium text-sm text-white"
                onClick={() => {
                  setOpen(false);
                  setContactOpen(true);
                }}
              >
                Kontakt
              </button>
            </nav>
          </div>
        ) : null}
      </div>

      <ContactDialog
        open={contactOpen}
        onClose={() => setContactOpen(false)}
        contact={contact}
      />
    </header>
  );
}
