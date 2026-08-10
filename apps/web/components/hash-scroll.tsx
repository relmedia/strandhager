"use client";

import { useEffect } from "react";

import { ScrollTrigger } from "gsap/ScrollTrigger";

/** Clears the sticky header, plus a little air above the heading. */
const OFFSET = 96;

/**
 * Anchor links cannot be left to the browser on this page. The pinned gallery
 * sections add and resize their spacers as they initialise, so the document
 * grows underneath a native jump and a long smooth scroll gets abandoned
 * partway. Landing takes a few passes: refresh the triggers, jump, then
 * re-measure until the target stops moving.
 */
export function HashScroll() {
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;

    /**
     * `watchFor` is how long to keep an eye on the target before trusting that
     * it has stopped moving. A click only needs a moment; a page still loading
     * its images can look settled long before it is.
     */
    function scrollToId(id: string, watchFor = 300) {
      const target = document.getElementById(id);
      if (!target) return;

      ScrollTrigger.refresh();
      clearTimeout(timer);

      const started = performance.now();
      let stable = 0;

      const settle = () => {
        const top = Math.max(
          0,
          target.getBoundingClientRect().top + window.scrollY - OFFSET,
        );
        const drift = Math.abs(window.scrollY - top);

        if (drift > 1) {
          window.scrollTo({ top, behavior: "auto" });
        }

        const elapsed = performance.now() - started;
        stable = drift > 1 ? 0 : stable + 1;

        if ((stable < 2 || elapsed < watchFor) && elapsed < watchFor + 1500) {
          timer = setTimeout(settle, 60);
        }
      };

      settle();
    }

    function onClick(event: MouseEvent) {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const link = (event.target as Element | null)?.closest("a");
      const href = link?.getAttribute("href");
      if (!href) return;

      // Both "#utleie" and "/#utleie" mean the same place once we are here.
      const hash = href.startsWith("#")
        ? href
        : href.startsWith(`${window.location.pathname}#`)
          ? href.slice(window.location.pathname.length)
          : null;

      const id = hash?.slice(1);
      if (!id || !document.getElementById(id)) return;

      event.preventDefault();
      history.pushState(null, "", hash);
      scrollToId(id);
    }

    function onHashChange() {
      const id = window.location.hash.slice(1);
      if (id) scrollToId(id);
    }

    // A shared link should land in the right place too, once images are in.
    const id = window.location.hash.slice(1);
    if (id) {
      const onLoad = () => scrollToId(id, 1500);
      if (document.readyState === "complete") {
        onLoad();
      } else {
        window.addEventListener("load", onLoad, { once: true });
      }
    }

    document.addEventListener("click", onClick);
    window.addEventListener("hashchange", onHashChange);

    return () => {
      clearTimeout(timer);
      document.removeEventListener("click", onClick);
      window.removeEventListener("hashchange", onHashChange);
    };
  }, []);

  return null;
}
