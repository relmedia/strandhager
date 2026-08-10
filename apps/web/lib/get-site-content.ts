import { galleries as galleriesFallback, type GalleriesContent, type Gallery } from "./gallery";
import { site as fallback, type SiteContent } from "./site-content";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

/**
 * Loads the site content from the CMS API (managed via the admin dashboard).
 * Falls back to the static defaults if the API is unreachable, so the public
 * site never breaks.
 */
export async function getSiteContent(): Promise<SiteContent> {
  try {
    const res = await fetch(`${API_URL}/site-content`, { cache: "no-store" });
    if (!res.ok) throw new Error(`API responded ${res.status}`);

    const sections = (await res.json()) as Record<string, unknown>;
    const { general, galleries: _galleries, location, ...rest } = sections;

    return {
      ...fallback,
      ...(general && typeof general === "object" ? general : {}),
      ...rest,
      // The location section carries code-defined data (map coordinates,
      // nearby places, reviews) that the CMS does not know about, so the
      // stored fields are laid over the defaults instead of replacing them.
      location: {
        ...fallback.location,
        ...(location && typeof location === "object" ? location : {}),
      },
    } as SiteContent;
  } catch {
    return fallback;
  }
}

export async function getGalleries(): Promise<Gallery[]> {
  try {
    const res = await fetch(`${API_URL}/site-content/galleries`, { cache: "no-store" });
    if (!res.ok) throw new Error(`API responded ${res.status}`);

    const content = (await res.json()) as GalleriesContent;
    return content.galleries ?? [];
  } catch {
    return galleriesFallback.galleries;
  }
}

export async function getGallery(slug: string): Promise<Gallery | undefined> {
  const all = await getGalleries();
  return all.find((gallery) => gallery.slug === slug);
}
