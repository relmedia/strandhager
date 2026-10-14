"use client";

import { useEffect, useRef } from "react";

import { usePathname } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

/**
 * Reports each page view to the API for the dashboard's reports page.
 *
 * First-party and cookieless: nothing is written to the visitor's browser, and
 * the API keeps only a daily-rotating anonymous hash, so there is no consent
 * banner to wait for.
 */
export function PageViewTracker() {
  const pathname = usePathname();
  const lastTracked = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname || lastTracked.current === pathname) return;

    // The referrer only means something on the landing view; after a
    // client-side navigation it still names the original site.
    const referrer = lastTracked.current === null ? document.referrer || null : null;
    lastTracked.current = pathname;

    void fetch(`${API_URL}/analytics/track`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: pathname, referrer }),
    }).catch(() => {
      // Tracking must never break the page.
    });
  }, [pathname]);

  return null;
}
