"use client";

import { Plus } from "lucide-react";

import { ConfirmDelete } from "@/components/cms/confirm-delete";
import { TextField, TextareaField } from "@/components/cms/fields";
import { ImageField } from "@/components/cms/image-field";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { mediaUrl } from "@/lib/media";
import type { HeroContent } from "@/types/site-content";

type HeroFormProps = {
  value: HeroContent;
  onChange: (value: HeroContent) => void;
};

export function HeroForm({ value, onChange }: HeroFormProps) {
  const set = <K extends keyof HeroContent>(key: K, v: HeroContent[K]) =>
    onChange({ ...value, [key]: v });

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <TextField label="Overlinje" value={value.eyebrow} onChange={(v) => set("eyebrow", v)} />
        <TextField label="Metatekst" value={value.meta} onChange={(v) => set("meta", v)} />
        <TextField
          label="Overskrift – linje 1"
          value={value.headline[0] ?? ""}
          onChange={(v) => set("headline", [v, value.headline[1] ?? ""])}
        />
        <TextField
          label="Overskrift – linje 2"
          value={value.headline[1] ?? ""}
          onChange={(v) => set("headline", [value.headline[0] ?? "", v])}
        />
      </div>

      <TextareaField
        label="Støttetekst"
        value={value.support}
        onChange={(v) => set("support", v)}
        rows={3}
      />

      <div className="grid gap-4 md:grid-cols-2">
        <TextField
          label="Primærknapp – tekst"
          value={value.primaryCta.label}
          onChange={(v) => set("primaryCta", { ...value.primaryCta, label: v })}
        />
        <TextField
          label="Primærknapp – lenke"
          value={value.primaryCta.href}
          onChange={(v) => set("primaryCta", { ...value.primaryCta, href: v })}
        />
        <TextField
          label="Sekundærknapp – tekst"
          value={value.secondaryCta.label}
          onChange={(v) => set("secondaryCta", { ...value.secondaryCta, label: v })}
        />
        <TextField
          label="Sekundærknapp – lenke"
          value={value.secondaryCta.href}
          onChange={(v) => set("secondaryCta", { ...value.secondaryCta, href: v })}
        />
      </div>

      <Separator />

      <div className="space-y-4">
        <Label className="text-base">Bildekarusell</Label>
        {value.slides.map((slide, index) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: rows are positional and editable
          <div key={index} className="space-y-3 rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <span className="font-medium text-muted-foreground text-sm">
                Bilde {index + 1}
              </span>
              <ConfirmDelete
                label="Fjern bilde"
                title={`Fjerne bilde ${index + 1} fra karusellen?`}
                description="Bildet tas ut av hero-karusellen når du lagrer. Selve filen blir liggende."
                previewSrc={slide.src ? mediaUrl(slide.src) : undefined}
                onConfirm={() =>
                  set(
                    "slides",
                    value.slides.filter((_, i) => i !== index),
                  )
                }
              />
            </div>
            <ImageField
              label="Bilde"
              value={slide.src}
              onChange={(src) =>
                set(
                  "slides",
                  value.slides.map((s, i) => (i === index ? { ...s, src } : s)),
                )
              }
            />
            <TextField
              label="Alternativ tekst"
              value={slide.alt}
              onChange={(alt) =>
                set(
                  "slides",
                  value.slides.map((s, i) => (i === index ? { ...s, alt } : s)),
                )
              }
            />
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => set("slides", [...value.slides, { src: "", alt: "" }])}
        >
          <Plus className="size-4" />
          Legg til bilde
        </Button>
      </div>
    </div>
  );
}
