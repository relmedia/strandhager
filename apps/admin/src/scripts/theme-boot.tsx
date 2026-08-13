"use client";

/**
 * Boot script that reads user preference values (theme mode, theme preset,
 * content layout, navbar style) from cookies or localStorage based on the
 * configured persistence mode, and resolves "system" theme mode to a concrete
 * light/dark class before first paint.
 *
 * Injected with useServerInsertedHTML so the <script> lands in the initial
 * HTML stream but is never part of the React tree. React 19 warns about
 * <script> elements rendered by components ("Encountered a script tag while
 * rendering React component"), e.g. after router.refresh() — this avoids the
 * warning entirely while still running before hydration.
 */
import { useRef } from "react";

import { useServerInsertedHTML } from "next/navigation";

import { PREFERENCE_DEFAULTS, PREFERENCE_PERSISTENCE } from "@/lib/preferences/preferences-config";

const persistence = JSON.stringify({
  theme_mode: PREFERENCE_PERSISTENCE.theme_mode,
  theme_preset: PREFERENCE_PERSISTENCE.theme_preset,
  font: PREFERENCE_PERSISTENCE.font,
  content_layout: PREFERENCE_PERSISTENCE.content_layout,
  navbar_style: PREFERENCE_PERSISTENCE.navbar_style,
  sidebar_variant: PREFERENCE_PERSISTENCE.sidebar_variant,
  sidebar_collapsible: PREFERENCE_PERSISTENCE.sidebar_collapsible,
});

const defaults = JSON.stringify({
  theme_mode: PREFERENCE_DEFAULTS.theme_mode,
  theme_preset: PREFERENCE_DEFAULTS.theme_preset,
  font: PREFERENCE_DEFAULTS.font,
  content_layout: PREFERENCE_DEFAULTS.content_layout,
  navbar_style: PREFERENCE_DEFAULTS.navbar_style,
  sidebar_variant: PREFERENCE_DEFAULTS.sidebar_variant,
  sidebar_collapsible: PREFERENCE_DEFAULTS.sidebar_collapsible,
});

const code = `
  (function () {
    try {
      var root = document.documentElement;
      var PERSISTENCE = ${persistence};
      var DEFAULTS = ${defaults};

      function readCookie(name) {
        var match = document.cookie.split("; ").find(function(c) {
          return c.startsWith(name + "=");
        });
        return match ? decodeURIComponent(match.split("=")[1]) : null;
      }

      function readLocal(name) {
        try {
          return window.localStorage.getItem(name);
        } catch (e) {
          return null;
        }
      }

      function readPreference(key, fallback) {
        var mode = PERSISTENCE[key];
        var value = null;

        if (mode === "localStorage") {
          value = readLocal(key);
        }

        if (!value && (mode === "client-cookie" || mode === "server-cookie")) {
          value = readCookie(key);
        }

        if (!value || typeof value !== "string") {
          return fallback;
        }

        return value;
      }

      var rawMode = readPreference("theme_mode", DEFAULTS.theme_mode);
      var rawPreset = readPreference("theme_preset", DEFAULTS.theme_preset);
      var rawFont = readPreference("font", DEFAULTS.font);
      var rawContentLayout = readPreference("content_layout", DEFAULTS.content_layout);
      var rawNavbarStyle = readPreference("navbar_style", DEFAULTS.navbar_style);
      var rawSidebarVariant = readPreference("sidebar_variant", DEFAULTS.sidebar_variant);
      var rawSidebarCollapsible = readPreference("sidebar_collapsible", DEFAULTS.sidebar_collapsible);

      var isValidMode = rawMode === "dark" || rawMode === "light" || rawMode === "system";
      var mode = isValidMode ? rawMode : DEFAULTS.theme_mode;
      var resolvedMode =
        mode === "system" && window.matchMedia
          ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
          : mode;
      var preset = rawPreset || DEFAULTS.theme_preset;
      var font = rawFont || DEFAULTS.font;
      var contentLayout = rawContentLayout || DEFAULTS.content_layout;
      var navbarStyle = rawNavbarStyle || DEFAULTS.navbar_style;
      var sidebarVariant = rawSidebarVariant || DEFAULTS.sidebar_variant;
      var sidebarCollapsible = rawSidebarCollapsible || DEFAULTS.sidebar_collapsible;

      root.classList.toggle("dark", resolvedMode === "dark");
      root.setAttribute("data-theme-mode", mode);
      root.setAttribute("data-theme-preset", preset);
      root.setAttribute("data-font", font);
      root.setAttribute("data-content-layout", contentLayout);
      root.setAttribute("data-navbar-style", navbarStyle);
      root.setAttribute("data-sidebar-variant", sidebarVariant);
      root.setAttribute("data-sidebar-collapsible", sidebarCollapsible);

      root.style.colorScheme = resolvedMode === "dark" ? "dark" : "light";

    } catch (e) {
      console.warn("ThemeBootScript error:", e);
    }
  })();
`;

export function ThemeBootScript() {
  const inserted = useRef(false);

  useServerInsertedHTML(() => {
    if (inserted.current) return null;
    inserted.current = true;
    /* biome-ignore lint/security/noDangerouslySetInnerHtml: required for pre-hydration boot script */
    return <script dangerouslySetInnerHTML={{ __html: code }} />;
  });

  return null;
}
