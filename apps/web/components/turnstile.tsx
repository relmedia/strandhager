"use client";

import { useEffect, useRef } from "react";

/**
 * Cloudflare's dummy key is used in development so the widget shows up and
 * always passes. In production the real key must be set, or the check is
 * left out entirely.
 */
export const TURNSTILE_SITE_KEY =
  process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ??
  (process.env.NODE_ENV === "development" ? "1x00000000000000000000AA" : "");

const SCRIPT_SRC =
  "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

type TurnstileApi = {
  render: (
    element: HTMLElement,
    options: {
      sitekey: string;
      callback: (token: string) => void;
      "expired-callback": () => void;
      "error-callback": () => void;
      theme: "light" | "dark" | "auto";
      size: "normal" | "flexible" | "compact";
    },
  ) => string;
  remove: (widgetId: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

let loading: Promise<void> | null = null;

/** The script is shared between widgets, so it is only ever added once. */
function loadTurnstile(): Promise<void> {
  if (window.turnstile) return Promise.resolve();

  loading ??= new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      loading = null;
      reject(new Error("Klarte ikke å laste robotsjekken"));
    };
    document.head.appendChild(script);
  });

  return loading;
}

type TurnstileProps = {
  /** Called with a fresh token, or null when it expires or fails. */
  onToken: (token: string | null) => void;
  className?: string;
};

/** The Cloudflare Turnstile widget, proving the sender is a person. */
export function Turnstile({ onToken, className }: TurnstileProps) {
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let widgetId: string | null = null;
    let cancelled = false;

    loadTurnstile()
      .then(() => {
        if (cancelled || !host.current || !window.turnstile) return;

        widgetId = window.turnstile.render(host.current, {
          sitekey: TURNSTILE_SITE_KEY,
          callback: onToken,
          "expired-callback": () => onToken(null),
          "error-callback": () => onToken(null),
          theme: "light",
          size: "flexible",
        });
      })
      .catch(() => onToken(null));

    return () => {
      cancelled = true;
      if (widgetId) window.turnstile?.remove(widgetId);
    };
    // onToken is a state setter, which never changes identity.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div ref={host} className={className} />;
}
