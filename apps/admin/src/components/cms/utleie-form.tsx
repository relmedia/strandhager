"use client";

import Link from "next/link";

import { ArrowUpRight, Plus, Tags } from "lucide-react";

import { ConfirmDelete } from "@/components/cms/confirm-delete";
import { StringListField, TextField, TextareaField } from "@/components/cms/fields";
import { ImageField } from "@/components/cms/image-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { mediaUrl } from "@/lib/media";
import type { FacilityIcon, UtleieContent } from "@/types/site-content";

const FACILITY_ICONS: { value: FacilityIcon; label: string }[] = [
  { value: "kitchen", label: "Kjøkken" },
  { value: "parking", label: "Parkering" },
  { value: "accessibility", label: "Tilgjengelighet" },
  { value: "outdoor", label: "Uteområde" },
];

type UtleieFormProps = {
  value: UtleieContent;
  onChange: (value: UtleieContent) => void;
};

/**
 * Prices used to be plain text here, but they now drive the booking
 * calculation, so they live with the rest of the booking settings.
 */
function PricesMoved() {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-muted/40 p-4">
      <div className="flex items-start gap-3">
        <Tags className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
        <div>
          <p className="font-medium text-sm">Prisene ligger under Priser</p>
          <p className="mt-1 text-muted-foreground text-sm">
            De vises på nettsiden og brukes til å regne ut hva en booking koster, så de
            redigeres ett sted.
          </p>
        </div>
      </div>

      <Button asChild variant="outline" size="sm">
        <Link href="/priser">
          Gå til Priser
          <ArrowUpRight className="size-4" />
        </Link>
      </Button>
    </div>
  );
}

export function UtleieForm({ value, onChange }: UtleieFormProps) {
  const set = <K extends keyof UtleieContent>(key: K, v: UtleieContent[K]) =>
    onChange({ ...value, [key]: v });

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <TextField label="Overlinje" value={value.eyebrow} onChange={(v) => set("eyebrow", v)} />
        <TextField label="Tittel" value={value.title} onChange={(v) => set("title", v)} />
      </div>
      <TextareaField label="Ingress" value={value.lead} onChange={(v) => set("lead", v)} rows={3} />
      <TextareaField label="Brødtekst" value={value.body} onChange={(v) => set("body", v)} />

      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <Label>Kapasitet – antall</Label>
          <Input
            type="number"
            value={value.capacity.value}
            onChange={(event) =>
              set("capacity", { ...value.capacity, value: Number(event.target.value) || 0 })
            }
          />
        </div>
        <TextField
          label="Kapasitet – enhet"
          value={value.capacity.unit}
          onChange={(v) => set("capacity", { ...value.capacity, unit: v })}
        />
        <TextField
          label="Kapasitet – etikett"
          value={value.capacity.label}
          onChange={(v) => set("capacity", { ...value.capacity, label: v })}
        />
      </div>

      <ImageField label="Hovedbilde" value={value.image} onChange={(v) => set("image", v)} />
      <TextField
        label="Hovedbilde – alternativ tekst"
        value={value.imageAlt}
        onChange={(v) => set("imageAlt", v)}
      />

      <Separator />

      <div className="space-y-4">
        <Label className="text-base">Fasiliteter</Label>
        {value.facilities.map((facility, index) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: rows are positional and editable
          <div key={index} className="flex gap-2">
            <select
              value={facility.icon}
              className="h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-xs"
              onChange={(event) =>
                set(
                  "facilities",
                  value.facilities.map((f, i) =>
                    i === index ? { ...f, icon: event.target.value as FacilityIcon } : f,
                  ),
                )
              }
            >
              {FACILITY_ICONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <Input
              value={facility.label}
              onChange={(event) =>
                set(
                  "facilities",
                  value.facilities.map((f, i) =>
                    i === index ? { ...f, label: event.target.value } : f,
                  ),
                )
              }
            />
            <ConfirmDelete
              label="Fjern fasilitet"
              title="Fjerne fasilitet?"
              description={`"${facility.label || "Uten navn"}" tas ut av fasilitetslisten når du lagrer.`}
              onConfirm={() =>
                set(
                  "facilities",
                  value.facilities.filter((_, i) => i !== index),
                )
              }
            />
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() =>
            set("facilities", [...value.facilities, { icon: "kitchen", label: "" }])
          }
        >
          <Plus className="size-4" />
          Legg til fasilitet
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <StringListField
          label="Passer til"
          values={value.uses}
          onChange={(v) => set("uses", v)}
          addLabel="Legg til bruksområde"
        />
        <StringListField
          label="Utstyr til disposisjon"
          values={value.equipment}
          onChange={(v) => set("equipment", v)}
          addLabel="Legg til utstyr"
        />
      </div>

      <Separator />

      <PricesMoved />

      <Separator />

      <div className="space-y-4">
        <Label className="text-base">Galleri (bildestripe)</Label>
        {value.gallery.map((item, index) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: rows are positional and editable
          <div key={index} className="space-y-3 rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <span className="font-medium text-muted-foreground text-sm">
                Bilde {index + 1}
              </span>
              <ConfirmDelete
                label="Fjern galleribilde"
                title={`Fjerne bilde ${index + 1} fra bildestripen?`}
                description={`${item.caption || "Bildet"} tas ut av bildestripen når du lagrer. Selve filen blir liggende.`}
                previewSrc={item.src ? mediaUrl(item.src) : undefined}
                onConfirm={() =>
                  set(
                    "gallery",
                    value.gallery.filter((_, i) => i !== index),
                  )
                }
              />
            </div>
            <ImageField
              label="Bilde"
              value={item.src}
              onChange={(src) =>
                set(
                  "gallery",
                  value.gallery.map((g, i) => (i === index ? { ...g, src } : g)),
                )
              }
            />
            <div className="grid gap-4 md:grid-cols-2">
              <TextField
                label="Bildetekst"
                value={item.caption}
                onChange={(caption) =>
                  set(
                    "gallery",
                    value.gallery.map((g, i) => (i === index ? { ...g, caption } : g)),
                  )
                }
              />
              <TextField
                label="Alternativ tekst"
                value={item.alt}
                onChange={(alt) =>
                  set(
                    "gallery",
                    value.gallery.map((g, i) => (i === index ? { ...g, alt } : g)),
                  )
                }
              />
            </div>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => set("gallery", [...value.gallery, { src: "", alt: "", caption: "" }])}
        >
          <Plus className="size-4" />
          Legg til galleribilde
        </Button>
      </div>

    </div>
  );
}
