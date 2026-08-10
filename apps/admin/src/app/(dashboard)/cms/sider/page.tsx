import Link from "next/link";

import { ArrowRight } from "lucide-react";

import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const pages = [
  {
    title: "Forside",
    href: "/cms/forside",
    path: "/",
    description: "Hero, utleie, parsellene, kart, kontaktinfo, meny og bunntekst.",
  },
  {
    title: "Gallerier",
    href: "/cms/galleri",
    path: "/galleri/…",
    description: "Én side per galleri. Last opp bilder, sorter og skriv alternativ tekst.",
  },
];

export default function Page() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="font-semibold text-2xl tracking-tight">Sider</h1>
        <p className="text-muted-foreground text-sm">
          Sidene på nettstedet. Velg en side for å redigere innholdet.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {pages.map((page) => (
          <Link key={page.href} href={page.href} className="block">
            <Card className="h-full transition-colors hover:bg-muted/50">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  {page.title}
                  <ArrowRight className="size-4 text-muted-foreground" />
                </CardTitle>
                <CardDescription>
                  <span className="block font-mono text-xs">{page.path}</span>
                  {page.description}
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
