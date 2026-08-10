// Mirrors apps/web/lib/site-content.ts — the shape stored per section in the
// SiteSection table and consumed by the public web app.

export type Cta = { label: string; href: string };
export type NavItem = { label: string; href: string };
export type HeroSlide = { src: string; alt: string };

export type HeroContent = {
  eyebrow: string;
  headline: string[];
  support: string;
  meta: string;
  primaryCta: Cta;
  secondaryCta: Cta;
  slides: HeroSlide[];
};

export type FacilityIcon = "kitchen" | "parking" | "accessibility" | "outdoor";

export type UtleieContent = {
  id: string;
  eyebrow: string;
  title: string;
  lead: string;
  body: string;
  capacity: { value: number; unit: string; label: string };
  facilities: { icon: FacilityIcon; label: string }[];
  uses: string[];
  equipment: string[];
  image: string;
  imageAlt: string;
  gallery: { src: string; alt: string; caption: string }[];
};

export type CabinFeatureIcon = "living" | "kitchen" | "storage" | "compost" | "loft" | "winter";

/** A drawing an architect made, published as a downloadable PDF. */
export type ArchitectDocument = {
  label: string;
  /** Path to the PDF under /public. */
  url: string;
  /** Rendered page from the PDF, shown as the card preview. */
  preview: string;
  previewAlt: string;
};

export type Architect = {
  name: string;
  role: string;
  document?: ArchitectDocument;
};

export type ParselleneContent = {
  id: string;
  eyebrow: string;
  title: string;
  lead: string;
  body: string;
  details: string;
  stats: { value: number; unit: string; label: string }[];
  cabin: { title: string; features: { icon: CabinFeatureIcon; label: string }[] };
  board: { title: string; body: string; tasks: string[]; email: string };
  architects: { title: string; people: Architect[] };
  image: string;
  imageAlt: string;
  gallery: { src: string; alt: string; caption: string }[];
  waitlist: {
    title: string;
    body: string;
    facebookUrl: string;
    facebookLabel: string;
    contactName: string;
    email: string;
  };
};

export type LocationContent = {
  id: string;
  eyebrow: string;
  title: string;
  body: string;
  address: string[];
  mapUrl: string;
  mapEmbed: string;
  image: string;
  imageAlt: string;
};

export type ContactContent = {
  booking: { name: string; email: string; phone: string };
  plots: { name: string; email: string };
};

export type GeneralContent = {
  name: string;
  tagline: string;
  logo: string;
};

export type FooterContent = { copyright: string };

export type GalleryImage = {
  src: string;
  width: number;
  height: number;
  alt: string;
};

export type Gallery = {
  /** URL segment: /galleri/<slug> */
  slug: string;
  eyebrow: string;
  title: string;
  images: GalleryImage[];
};

export type GalleriesContent = {
  galleries: Gallery[];
};

export type SiteSections = {
  general: GeneralContent;
  nav: NavItem[];
  hero: HeroContent;
  utleie: UtleieContent;
  parsellene: ParselleneContent;
  location: LocationContent;
  contact: ContactContent;
  footer: FooterContent;
};

export type SectionKey = keyof SiteSections;
