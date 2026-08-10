import type { Metadata } from "next";

import { BookingLookup } from "@/components/booking/booking-lookup";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getSiteContent } from "@/lib/get-site-content";

export const metadata: Metadata = {
  title: "Din booking",
  description: "Se eller avbestill bookingen din av Felleshuset.",
  robots: { index: false, follow: false },
};

export default async function BookingPage({
  params,
  searchParams,
}: {
  params: Promise<{ reference: string }>;
  searchParams: Promise<{ token?: string }>;
}) {
  const [{ reference }, { token }, site] = await Promise.all([
    params,
    searchParams,
    getSiteContent(),
  ]);

  return (
    <>
      <SiteHeader
        logo={site.logo}
        name={site.name}
        nav={site.nav}
        contact={site.contact}
      />

      <main className="bg-sand py-24 md:py-32">
        <div className="mx-auto max-w-2xl px-5 md:px-8">
          <BookingLookup
            reference={reference}
            token={token ?? ""}
            contact={site.contact.booking}
          />
        </div>
      </main>

      <SiteFooter site={site} />
    </>
  );
}
