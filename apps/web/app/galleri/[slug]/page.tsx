import type { Metadata } from "next";

import { ArrowLeft } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { GalleryViewer } from "@/components/gallery-viewer";
import { SiteFooter } from "@/components/site-footer";
import { getGalleries, getGallery, getSiteContent } from "@/lib/get-site-content";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const gallery = await getGallery(slug);

  if (!gallery) {
    return { title: "Bildegalleri – Ølberg strandhager" };
  }

  return {
    title: `${gallery.title} – Ølberg strandhager`,
    description: `Se bildene av ${gallery.title.toLowerCase()} ved Ølberg strandhager på Solastranden.`,
  };
}

export default async function GalleriPage({ params }: PageProps) {
  const { slug } = await params;
  const [site, gallery, galleries] = await Promise.all([
    getSiteContent(),
    getGallery(slug),
    getGalleries(),
  ]);

  if (!gallery) {
    notFound();
  }

  const others = galleries.filter((item) => item.slug !== slug && item.images.length > 0);

  return (
    <>
      <header className="border-ink/10 border-b bg-sand/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-5 md:h-20 md:px-8">
          <Link href="/" className="flex items-center gap-3">
            <Image
              src={site.logo}
              alt={site.name}
              width={172}
              height={110}
              className="h-9 w-auto object-contain md:h-10"
              priority
            />
            <span className="hidden font-medium text-lg tracking-wide sm:inline">
              <span className="text-brand">Ølberg</span>
              <span className="text-sea">strandhager</span>
            </span>
          </Link>

          <Link
            href="/"
            className="group inline-flex items-center gap-2 text-ink-muted text-sm transition-colors hover:text-ink"
          >
            <ArrowLeft
              className="size-4 transition-transform duration-300 group-hover:-translate-x-1"
              aria-hidden
            />
            Tilbake til forsiden
          </Link>
        </div>
      </header>

      <main className="bg-sand pt-14 pb-24 md:pt-20 md:pb-32">
        <div className="mx-auto max-w-6xl px-5 md:px-8">
          <div className="flex items-center gap-4">
            <span className="h-px w-10 bg-brand/60 md:w-14" />
            <span className="font-medium text-brand-deep text-xs tracking-[0.26em] uppercase md:text-sm">
              {gallery.eyebrow}
            </span>
          </div>
          <div className="mt-5 flex flex-wrap items-end justify-between gap-4">
            <h1 className="max-w-xl font-display text-4xl leading-[1.05] tracking-tight md:text-5xl">
              {gallery.title}
            </h1>
            <p className="text-ink-muted text-sm">{gallery.images.length} bilder</p>
          </div>

          {gallery.images.length > 0 ? (
            <div className="mt-10 md:mt-14">
              <GalleryViewer images={gallery.images} />
            </div>
          ) : (
            <p className="mt-10 text-ink-muted">Bildene kommer snart.</p>
          )}

          {others.length > 0 ? (
            <nav className="mt-16 border-ink/10 border-t pt-8 md:mt-24">
              <p className="font-medium text-ink text-xs tracking-[0.22em] uppercase">
                Flere galleri
              </p>
              <ul className="mt-4 flex flex-wrap gap-3">
                {others.map((item) => (
                  <li key={item.slug}>
                    <Link
                      href={`/galleri/${item.slug}`}
                      className="inline-flex items-center rounded-full bg-brand-soft px-4 py-2 font-medium text-brand-deep text-sm transition-colors hover:bg-brand hover:text-white"
                    >
                      {item.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ) : null}
        </div>
      </main>

      <SiteFooter site={site} />
    </>
  );
}
