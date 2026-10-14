import type { Metadata } from "next";
import type { ReactNode } from "react";

import { ArrowLeft } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { SiteFooter } from "@/components/site-footer";
import { getSiteContent } from "@/lib/get-site-content";

export const metadata: Metadata = {
  title: "Personvern – Ølberg strandhager",
  description:
    "Hvilke personopplysninger Ølberg strandhager behandler når du booker Felleshuset, kontakter oss eller står på venteliste – og hvilke rettigheter du har.",
};

/** Bump when the text below changes in substance. */
const LAST_UPDATED = "14. oktober 2026";

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="border-ink/10 border-t pt-8">
      <h2 className="font-display text-2xl tracking-tight md:text-3xl">{title}</h2>
      <div className="mt-4 space-y-4 text-ink-muted leading-relaxed [&_a]:text-brand-deep [&_a]:underline [&_a]:underline-offset-2 [&_strong]:font-medium [&_strong]:text-ink">
        {children}
      </div>
    </section>
  );
}

/** One kind of processing: what is collected, why, and on what legal basis. */
function Purpose({
  title,
  data,
  why,
  basis,
}: {
  title: string;
  data: string;
  why: string;
  basis: string;
}) {
  return (
    <div className="rounded-card bg-white/70 p-5 ring-1 ring-ink/10 md:p-6">
      <h3 className="font-medium text-ink">{title}</h3>
      <dl className="mt-3 grid gap-2 text-sm md:grid-cols-[9rem_1fr] md:gap-x-4">
        <dt className="font-medium text-ink">Hva</dt>
        <dd>{data}</dd>
        <dt className="font-medium text-ink">Hvorfor</dt>
        <dd>{why}</dd>
        <dt className="font-medium text-ink">Rettslig grunnlag</dt>
        <dd>{basis}</dd>
      </dl>
    </div>
  );
}

export default async function PersonvernPage() {
  const site = await getSiteContent();
  // The address block starts with the name itself, which is already said.
  const address = site.location.address.filter((line) => line !== site.name).join(", ");
  const { booking, plots } = site.contact;

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
        <div className="mx-auto max-w-3xl px-5 md:px-8">
          <div className="flex items-center gap-4">
            <span className="h-px w-10 bg-brand/60 md:w-14" />
            <span className="font-medium text-brand-deep text-xs tracking-[0.26em] uppercase md:text-sm">
              Personvern
            </span>
          </div>
          <h1 className="mt-5 font-display text-4xl leading-[1.05] tracking-tight md:text-5xl">
            Slik behandler vi personopplysninger
          </h1>
          <p className="mt-5 text-ink-muted text-lg leading-relaxed">
            Vi samler bare inn det vi trenger for å leie ut Felleshuset, svare på henvendelser og
            holde ventelisten for parsellene. Vi bruker ikke informasjonskapsler til sporing eller
            reklame.
          </p>
          <p className="mt-3 text-ink-muted/80 text-sm">Sist oppdatert {LAST_UPDATED}.</p>

          <div className="mt-12 space-y-12">
            <Section title="Hvem er ansvarlig">
              <p>
                <strong>{site.name}</strong> ({address}) er behandlingsansvarlig for
                personopplysningene som samles inn på dette nettstedet.
              </p>
              <p>
                Spørsmål om personvern sendes til{" "}
                <a href={`mailto:${booking.email}`}>{booking.email}</a> når det gjelder bookinger
                av Felleshuset, og til <a href={`mailto:${plots.email}`}>{plots.email}</a> når det
                gjelder parsellene og ventelisten.
              </p>
            </Section>

            <Section title="Hva vi samler inn og hvorfor">
              <Purpose
                title="Booking av Felleshuset"
                data="Navn, e-post, telefon, eventuelt firma, ønskede datoer, antall gjester, formål med leien, meldingen din, navnet du signerer leievilkårene med, og om leien er betalt."
                why="For å behandle forespørselen, inngå og oppfylle leieavtalen, ta imot betaling og føre regnskap."
                basis="Avtale (personvernforordningen art. 6 nr. 1 b) og regnskapsplikt (art. 6 nr. 1 c)."
              />
              <Purpose
                title="Kontaktskjemaet"
                data="Navn, e-post, eventuelt telefon og emne, og meldingen din."
                why="For å svare deg."
                basis="Berettiget interesse i å kunne svare på henvendelser (art. 6 nr. 1 f)."
              />
              <Purpose
                title="Venteliste for parsell"
                data="Navn, e-post, eventuelt telefon og meldingen din."
                why="For å kontakte deg når en parsell blir ledig."
                basis="Tiltak på din forespørsel før en eventuell avtale (art. 6 nr. 1 b)."
              />
              <Purpose
                title="Besøksstatistikk"
                data="Hvilke sider som besøkes, hvilket nettsted du kom fra, og omtrentlig land og by. Besøkende telles med en anonym kode som byttes ut hver dag, og IP-adressen lagres ikke."
                why="For å se hvordan nettstedet brukes og hva som kan bli bedre."
                basis="Berettiget interesse (art. 6 nr. 1 f). Statistikken kan ikke knyttes til deg som person."
              />
            </Section>

            <Section title="Informasjonskapsler">
              <p>
                Nettstedet setter ingen informasjonskapsler for sporing, analyse eller reklame, og
                besøksstatistikken lagrer ingenting i nettleseren din. Derfor spør vi heller ikke om
                samtykke til informasjonskapsler.
              </p>
              <p>
                Kontaktskjemaet bruker Cloudflare Turnstile for å skille mennesker fra roboter.
                Turnstile behandler teknisk informasjon om nettleseren din når du bruker skjemaet,
                og er nødvendig for at skjemaet ikke skal fylles med søppelpost.
              </p>
            </Section>

            <Section title="Hvem vi deler opplysningene med">
              <p>
                Vi selger aldri personopplysninger. Disse leverandørene behandler opplysninger på
                våre vegne, slik at nettstedet kan fungere:
              </p>
              <ul className="list-disc space-y-2 pl-5">
                <li>
                  <strong>Vercel</strong> – drift av nettstedet og lagring av opplastede filer.
                </li>
                <li>
                  <strong>Neon</strong> – databasen der bookinger, henvendelser og ventelisten
                  lagres.
                </li>
                <li>
                  <strong>Resend</strong> – utsending av e-post, som bookingbekreftelser.
                </li>
                <li>
                  <strong>Cloudflare</strong> – robotsjekken i kontaktskjemaet.
                </li>
                <li>
                  <strong>Norkart</strong> – kartet som viser hvor vi ligger.
                </li>
              </ul>
              <p>
                Noen av leverandørene er amerikanske selskaper. Overføring av opplysninger skjer da
                med grunnlag i EUs standardkontraktsklausuler eller EU–US Data Privacy Framework.
              </p>
              <p>
                Når du betaler med <strong>Vipps MobilePay</strong>, er Vipps MobilePay selvstendig
                ansvarlig for opplysningene de behandler om betalingen.
              </p>
            </Section>

            <Section title="Hvor lenge vi lagrer opplysningene">
              <ul className="list-disc space-y-2 pl-5">
                <li>
                  <strong>Bookinger</strong> oppbevares i fem år etter regnskapsårets slutt, fordi
                  bokføringsloven krever det.
                </li>
                <li>
                  <strong>Henvendelser</strong> slettes når de ikke lenger trengs for å følge opp
                  saken.
                </li>
                <li>
                  <strong>Ventelisten</strong> beholder deg til du får parsell eller ber om å bli
                  fjernet.
                </li>
                <li>
                  <strong>Besøksstatistikken</strong> inneholder ingen personopplysninger.
                </li>
              </ul>
            </Section>

            <Section title="Dine rettigheter">
              <p>
                Du kan be om innsyn i opplysningene vi har om deg, og be om at de rettes eller
                slettes. Du kan også be oss begrense behandlingen, protestere mot den, eller få
                opplysningene utlevert i et vanlig format. Ta kontakt på e-postadressene over, så
                svarer vi innen en måned.
              </p>
              <p>
                Mener du at vi behandler opplysningene dine i strid med regelverket, kan du klage
                til{" "}
                <a href="https://www.datatilsynet.no" target="_blank" rel="noreferrer noopener">
                  Datatilsynet
                </a>
                .
              </p>
            </Section>
          </div>
        </div>
      </main>

      <SiteFooter site={site} />
    </>
  );
}
