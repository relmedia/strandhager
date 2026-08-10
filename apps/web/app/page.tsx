import { Hero } from "@/components/hero";
import { LocationSection } from "@/components/location-section";
import { ParselleneSection } from "@/components/parsellene-section";
import { RentalSection } from "@/components/rental-section";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getSpaceOrNull } from "@/lib/booking";
import { getSiteContent } from "@/lib/get-site-content";

export default async function Home() {
  const [site, space] = await Promise.all([
    getSiteContent(),
    getSpaceOrNull("felleshuset"),
  ]);

  return (
    <>
      <SiteHeader
        logo={site.logo}
        name={site.name}
        nav={site.nav}
        contact={site.contact}
      />
      <main>
        <Hero hero={site.hero} />

        <RentalSection utleie={site.utleie} contact={site.contact} space={space} />

        <ParselleneSection parsellene={site.parsellene} />

        <LocationSection location={site.location} />
      </main>
      <SiteFooter site={site} />
    </>
  );
}
