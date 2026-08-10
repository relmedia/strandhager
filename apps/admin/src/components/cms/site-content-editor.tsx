"use client";

import { useEffect, useState } from "react";

import { Plus } from "lucide-react";
import { toast } from "sonner";

import { StringListField, TextField, TextareaField } from "@/components/cms/fields";
import { HeroForm } from "@/components/cms/hero-form";
import { ImageField } from "@/components/cms/image-field";
import { NavEditor, type NavTarget } from "@/components/cms/nav-editor";
import { ParselleneForm } from "@/components/cms/parsellene-form";
import { SectionPanel } from "@/components/cms/section-panel";
import { UtleieForm } from "@/components/cms/utleie-form";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useGalleries } from "@/hooks/use-galleries";
import { apiFetch } from "@/lib/api";
import type { SectionKey, SiteSections } from "@/types/site-content";

export function SiteContentEditor() {
  const [sections, setSections] = useState<SiteSections | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  // Only used to offer the gallery pages as menu destinations.
  const { galleries } = useGalleries();

  useEffect(() => {
    apiFetch<SiteSections>("/site-content")
      .then(setSections)
      .catch(() => setError("Kunne ikke laste innholdet. Sjekk at API-et kjører."));
  }, []);

  if (error) {
    return <p className="text-destructive text-sm">{error}</p>;
  }

  if (!sections) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground text-sm">
        <Spinner className="size-4" />
        Laster innhold …
      </div>
    );
  }

  const patch = <K extends SectionKey>(key: K, value: SiteSections[K]) =>
    setSections((current) => (current ? { ...current, [key]: value } : current));

  async function save(keys: SectionKey[], label: string) {
    if (!sections) return;
    setSaving(label);
    try {
      for (const key of keys) {
        await apiFetch(`/site-content/${key}`, {
          method: "PUT",
          body: JSON.stringify({ data: sections[key] }),
        });
      }
      toast.success(`${label} lagret. Endringene er synlige på nettsiden.`);
    } catch {
      toast.error(`Kunne ikke lagre ${label.toLowerCase()}.`);
    } finally {
      setSaving(null);
    }
  }

  const { general, nav, hero, utleie, parsellene, location, contact, footer } = sections;

  // Every place a menu item can actually point at, so editors pick a real
  // destination instead of typing an anchor that does not exist.
  const navTargets: NavTarget[] = [
    { value: "/", label: "Forsiden (toppen)" },
    { value: `#${utleie.id}`, label: `${utleie.eyebrow} – seksjon på forsiden` },
    { value: `#${parsellene.id}`, label: `${parsellene.eyebrow} – seksjon på forsiden` },
    { value: `#${location.id}`, label: `${location.eyebrow} – seksjon på forsiden` },
    ...(galleries ?? []).map((gallery) => ({
      value: `/galleri/${gallery.slug}`,
      label: `${gallery.title} – bildegalleri`,
    })),
  ];

  return (
    <Tabs defaultValue="generelt" className="gap-6">
      <TabsList>
        <TabsTrigger value="generelt">Generelt</TabsTrigger>
        <TabsTrigger value="hero">Hero</TabsTrigger>
        <TabsTrigger value="utleie">Utleie</TabsTrigger>
        <TabsTrigger value="parsellene">Parsellene</TabsTrigger>
        <TabsTrigger value="lokasjon">Hvor er vi</TabsTrigger>
        <TabsTrigger value="kontakt">Kontakt</TabsTrigger>
      </TabsList>

      <TabsContent value="generelt">
        <SectionPanel
          title="Generelt"
          description="Navn, logo, meny og bunntekst."
          saving={saving === "Generelt"}
          onSave={() => save(["general", "nav", "footer"], "Generelt")}
        >
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <TextField
                label="Navn"
                value={general.name}
                onChange={(v) => patch("general", { ...general, name: v })}
              />
              <TextField
                label="Slagord"
                value={general.tagline}
                onChange={(v) => patch("general", { ...general, tagline: v })}
              />
            </div>
            <ImageField
              label="Logo"
              value={general.logo}
              onChange={(v) => patch("general", { ...general, logo: v })}
            />

            <div className="space-y-4">
              <Label className="text-base">Meny</Label>
              <NavEditor value={nav} onChange={(v) => patch("nav", v)} targets={navTargets} />
            </div>

            <TextField
              label="Bunntekst (copyright)"
              value={footer.copyright}
              onChange={(v) => patch("footer", { ...footer, copyright: v })}
            />
          </div>
        </SectionPanel>
      </TabsContent>

      <TabsContent value="hero">
        <SectionPanel
          title="Hero"
          description="Toppen av forsiden: overskrift, tekster, knapper og bildekarusell."
          saving={saving === "Hero"}
          onSave={() => save(["hero"], "Hero")}
        >
          <HeroForm value={hero} onChange={(v) => patch("hero", v)} />
        </SectionPanel>
      </TabsContent>

      <TabsContent value="utleie">
        <SectionPanel
          title="Utleie"
          description="Utleieseksjonen: tekster, fasiliteter, utstyr, priser og galleri."
          saving={saving === "Utleie"}
          onSave={() => save(["utleie"], "Utleie")}
        >
          <UtleieForm value={utleie} onChange={(v) => patch("utleie", v)} />
        </SectionPanel>
      </TabsContent>

      <TabsContent value="parsellene">
        <SectionPanel
          title="Parsellene"
          description="Seksjonen om parsellene: tekster, nøkkeltall, hytteinnhold, bilder, hagestyret, arkitekter og venteliste."
          saving={saving === "Parsellene"}
          onSave={() => save(["parsellene"], "Parsellene")}
        >
          <ParselleneForm value={parsellene} onChange={(v) => patch("parsellene", v)} />
        </SectionPanel>
      </TabsContent>

      <TabsContent value="lokasjon">
        <SectionPanel
          title="Hvor er vi"
          description="Adresse, kart og bilde."
          saving={saving === "Hvor er vi"}
          onSave={() => save(["location"], "Hvor er vi")}
        >
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <TextField
                label="Overlinje"
                value={location.eyebrow}
                onChange={(v) => patch("location", { ...location, eyebrow: v })}
              />
              <TextField
                label="Tittel"
                value={location.title}
                onChange={(v) => patch("location", { ...location, title: v })}
              />
            </div>
            <TextareaField
              label="Brødtekst"
              value={location.body}
              onChange={(v) => patch("location", { ...location, body: v })}
              rows={3}
            />
            <StringListField
              label="Adresse"
              values={location.address}
              onChange={(v) => patch("location", { ...location, address: v })}
              addLabel="Legg til adresselinje"
            />
            <TextField
              label="Kartlenke (Google Maps)"
              value={location.mapUrl}
              onChange={(v) => patch("location", { ...location, mapUrl: v })}
            />
            <TextField
              label="Innebygd kart (embed-URL)"
              value={location.mapEmbed}
              onChange={(v) => patch("location", { ...location, mapEmbed: v })}
            />
            <ImageField
              label="Bilde"
              value={location.image}
              onChange={(v) => patch("location", { ...location, image: v })}
            />
            <TextField
              label="Bilde – alternativ tekst"
              value={location.imageAlt}
              onChange={(v) => patch("location", { ...location, imageAlt: v })}
            />
          </div>
        </SectionPanel>
      </TabsContent>

      <TabsContent value="kontakt">
        <SectionPanel
          title="Kontakt"
          description="Kontaktpersoner for utleie og parseller. Vises i bunnteksten og i utleieseksjonen."
          saving={saving === "Kontakt"}
          onSave={() => save(["contact"], "Kontakt")}
        >
          <div className="space-y-6">
            <div className="space-y-4">
              <Label className="text-base">Utleie / booking</Label>
              <div className="grid gap-4 md:grid-cols-3">
                <TextField
                  label="Navn"
                  value={contact.booking.name}
                  onChange={(v) =>
                    patch("contact", { ...contact, booking: { ...contact.booking, name: v } })
                  }
                />
                <TextField
                  label="E-post"
                  value={contact.booking.email}
                  onChange={(v) =>
                    patch("contact", { ...contact, booking: { ...contact.booking, email: v } })
                  }
                />
                <TextField
                  label="Telefon"
                  value={contact.booking.phone}
                  onChange={(v) =>
                    patch("contact", { ...contact, booking: { ...contact.booking, phone: v } })
                  }
                />
              </div>
            </div>
            <div className="space-y-4">
              <Label className="text-base">Parsellene</Label>
              <div className="grid gap-4 md:grid-cols-3">
                <TextField
                  label="Navn"
                  value={contact.plots.name}
                  onChange={(v) =>
                    patch("contact", { ...contact, plots: { ...contact.plots, name: v } })
                  }
                />
                <TextField
                  label="E-post"
                  value={contact.plots.email}
                  onChange={(v) =>
                    patch("contact", { ...contact, plots: { ...contact.plots, email: v } })
                  }
                />
              </div>
            </div>
          </div>
        </SectionPanel>
      </TabsContent>
    </Tabs>
  );
}
