import type { ReactNode } from "react";

import type { Metadata } from "next";

import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { APP_CONFIG } from "@/config/app-config";
import { type FontKey, fontRegistry, fontVars } from "@/lib/fonts/registry";
import {
  CONTENT_LAYOUT_VALUES,
  NAVBAR_STYLE_VALUES,
  SIDEBAR_COLLAPSIBLE_VALUES,
  SIDEBAR_VARIANT_VALUES,
} from "@/lib/preferences/layout";
import { PREFERENCE_DEFAULTS } from "@/lib/preferences/preferences-config";
import { THEME_MODE_VALUES, THEME_PRESET_VALUES } from "@/lib/preferences/theme";
import { ThemeBootScript } from "@/scripts/theme-boot";
import { getPreference } from "@/server/server-actions";
import { PreferencesStoreProvider } from "@/stores/preferences/preferences-provider";

import "./globals.css";

export const metadata: Metadata = {
  title: APP_CONFIG.meta.title,
  description: APP_CONFIG.meta.description,
};

const FONT_VALUES = Object.keys(fontRegistry) as FontKey[];

export default async function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  // Preferences are stored in cookies, so the server can render the user's
  // actual values. Rendering static defaults here instead would make React
  // reset the attributes (and with them the theme) on every router.refresh().
  const [themeMode, themePreset, font, contentLayout, navbarStyle, sidebarVariant, sidebarCollapsible] =
    await Promise.all([
      getPreference("theme_mode", THEME_MODE_VALUES, PREFERENCE_DEFAULTS.theme_mode),
      getPreference("theme_preset", THEME_PRESET_VALUES, PREFERENCE_DEFAULTS.theme_preset),
      getPreference("font", FONT_VALUES, PREFERENCE_DEFAULTS.font),
      getPreference("content_layout", CONTENT_LAYOUT_VALUES, PREFERENCE_DEFAULTS.content_layout),
      getPreference("navbar_style", NAVBAR_STYLE_VALUES, PREFERENCE_DEFAULTS.navbar_style),
      getPreference("sidebar_variant", SIDEBAR_VARIANT_VALUES, PREFERENCE_DEFAULTS.sidebar_variant),
      getPreference("sidebar_collapsible", SIDEBAR_COLLAPSIBLE_VALUES, PREFERENCE_DEFAULTS.sidebar_collapsible),
    ]);

  return (
    <html
      lang="nb"
      data-theme-mode={themeMode}
      data-theme-preset={themePreset}
      data-content-layout={contentLayout}
      data-navbar-style={navbarStyle}
      data-sidebar-variant={sidebarVariant}
      data-sidebar-collapsible={sidebarCollapsible}
      data-font={font}
      suppressHydrationWarning
    >
      <head>
        {/* Applies preferences from localStorage and resolves the "system" theme before first paint. */}
        <ThemeBootScript />
      </head>
      <body className={`${fontVars} min-h-screen antialiased`}>
        <TooltipProvider>
          <PreferencesStoreProvider
            themeMode={themeMode}
            themePreset={themePreset}
            contentLayout={contentLayout}
            navbarStyle={navbarStyle}
            font={font}
          >
            {children}
            <Toaster />
          </PreferencesStoreProvider>
        </TooltipProvider>
      </body>
    </html>
  );
}
