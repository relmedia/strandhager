"use client";

import { Plus } from "lucide-react";

import { ConfirmDelete } from "@/components/cms/confirm-delete";
import { StringListField, TextField, TextareaField } from "@/components/cms/fields";
import { ImageField } from "@/components/cms/image-field";
import { MediaLibraryPicker } from "@/components/cms/media-library-picker";
import { PdfField } from "@/components/cms/pdf-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { mediaUrl } from "@/lib/media";
import type {
  Architect,
  ArchitectDocument,
  CabinFeatureIcon,
  ParselleneContent,
} from "@/types/site-content";

const CABIN_ICONS: { value: CabinFeatureIcon; label: string }[] = [
  { value: "living", label: "Oppholdsrom" },
  { value: "kitchen", label: "Kjøkken" },
  { value: "storage", label: "Bod" },
  { value: "compost", label: "Biodo" },
  { value: "loft", label: "Hems" },
  { value: "winter", label: "Vinterisolert" },
];

type ParselleneFormProps = {
  value: ParselleneContent;
  onChange: (value: ParselleneContent) => void;
};

export function ParselleneForm({ value, onChange }: ParselleneFormProps) {
  const set = <K extends keyof ParselleneContent>(key: K, v: ParselleneContent[K]) =>
    onChange({ ...value, [key]: v });

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <TextField label="Overlinje" value={value.eyebrow} onChange={(v) => set("eyebrow", v)} />
        <TextField label="Tittel" value={value.title} onChange={(v) => set("title", v)} />
      </div>
      <TextareaField label="Ingress" value={value.lead} onChange={(v) => set("lead", v)} rows={3} />
      <TextareaField label="Brødtekst" value={value.body} onChange={(v) => set("body", v)} />
      <TextareaField
        label="Uthevet avsnitt"
        value={value.details}
        onChange={(v) => set("details", v)}
      />

      <Separator />

      <div className="space-y-4">
        <Label className="text-base">Nøkkeltall</Label>
        {value.stats.map((stat, index) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: rows are positional and editable
          <div key={index} className="grid gap-2 md:grid-cols-[120px_120px_1fr_36px]">
            <Input
              type="number"
              value={stat.value}
              placeholder="Tall"
              onChange={(event) =>
                set(
                  "stats",
                  value.stats.map((s, i) =>
                    i === index ? { ...s, value: Number(event.target.value) || 0 } : s,
                  ),
                )
              }
            />
            <Input
              value={stat.unit}
              placeholder="Enhet"
              onChange={(event) =>
                set(
                  "stats",
                  value.stats.map((s, i) =>
                    i === index ? { ...s, unit: event.target.value } : s,
                  ),
                )
              }
            />
            <Input
              value={stat.label}
              placeholder="Etikett"
              onChange={(event) =>
                set(
                  "stats",
                  value.stats.map((s, i) =>
                    i === index ? { ...s, label: event.target.value } : s,
                  ),
                )
              }
            />
            <ConfirmDelete
              label="Fjern nøkkeltall"
              title="Fjerne nøkkeltall?"
              description={`"${stat.label || "Uten navn"}" tas ut av tallrekken når du lagrer.`}
              onConfirm={() =>
                set(
                  "stats",
                  value.stats.filter((_, i) => i !== index),
                )
              }
            />
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => set("stats", [...value.stats, { value: 0, unit: "", label: "" }])}
        >
          <Plus className="size-4" />
          Legg til nøkkeltall
        </Button>
      </div>

      <Separator />

      <div className="space-y-4">
        <Label className="text-base">Innhold i hyttene</Label>
        <TextField
          label="Overskrift"
          value={value.cabin.title}
          onChange={(v) => set("cabin", { ...value.cabin, title: v })}
        />
        {value.cabin.features.map((feature, index) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: rows are positional and editable
          <div key={index} className="flex gap-2">
            <select
              value={feature.icon}
              className="h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-xs"
              onChange={(event) =>
                set("cabin", {
                  ...value.cabin,
                  features: value.cabin.features.map((f, i) =>
                    i === index ? { ...f, icon: event.target.value as CabinFeatureIcon } : f,
                  ),
                })
              }
            >
              {CABIN_ICONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <Input
              value={feature.label}
              onChange={(event) =>
                set("cabin", {
                  ...value.cabin,
                  features: value.cabin.features.map((f, i) =>
                    i === index ? { ...f, label: event.target.value } : f,
                  ),
                })
              }
            />
            <ConfirmDelete
              label="Fjern punkt"
              title="Fjerne punkt?"
              description={`"${feature.label || "Uten navn"}" tas ut av listen over hva hyttene inneholder når du lagrer.`}
              onConfirm={() =>
                set("cabin", {
                  ...value.cabin,
                  features: value.cabin.features.filter((_, i) => i !== index),
                })
              }
            />
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() =>
            set("cabin", {
              ...value.cabin,
              features: [...value.cabin.features, { icon: "living", label: "" }],
            })
          }
        >
          <Plus className="size-4" />
          Legg til punkt
        </Button>
      </div>

      <Separator />

      <div className="space-y-4">
        <ImageField label="Hovedbilde" value={value.image} onChange={(v) => set("image", v)} />
        <TextField
          label="Hovedbilde – alternativ tekst"
          value={value.imageAlt}
          onChange={(v) => set("imageAlt", v)}
        />
      </div>

      <Separator />

      <div className="space-y-4">
        <Label className="text-base">Galleri (bildestripe)</Label>
        {value.gallery.map((item, index) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: rows are positional and editable
          <div key={index} className="space-y-3 rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <span className="font-medium text-muted-foreground text-sm">Bilde {index + 1}</span>
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
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => set("gallery", [...value.gallery, { src: "", alt: "", caption: "" }])}
          >
            <Plus className="size-4" />
            Legg til galleribilde
          </Button>
          <MediaLibraryPicker
            folder="alle"
            usedSrcs={value.gallery.map((item) => item.src)}
            onAdd={(picked) =>
              set("gallery", [
                ...value.gallery,
                ...picked.map((image) => ({ src: image.src, alt: "", caption: "" })),
              ])
            }
            triggerLabel="Legg til fra media"
            title="Mediebiblioteket"
            description="Velg ett eller flere bilder som allerede er lastet opp."
          />
        </div>
      </div>

      <Separator />

      <div className="space-y-4">
        <Label className="text-base">Hagestyret</Label>
        <div className="grid gap-4 md:grid-cols-2">
          <TextField
            label="Overskrift"
            value={value.board.title}
            onChange={(v) => set("board", { ...value.board, title: v })}
          />
          <TextField
            label="E-post"
            value={value.board.email}
            onChange={(v) => set("board", { ...value.board, email: v })}
          />
        </div>
        <TextareaField
          label="Brødtekst"
          value={value.board.body}
          onChange={(v) => set("board", { ...value.board, body: v })}
          rows={3}
        />
        <StringListField
          label="Oppgaver"
          values={value.board.tasks}
          onChange={(v) => set("board", { ...value.board, tasks: v })}
          addLabel="Legg til oppgave"
        />
      </div>

      <Separator />

      <div className="space-y-4">
        <Label className="text-base">Arkitektene</Label>
        <TextField
          label="Overskrift"
          value={value.architects.title}
          onChange={(v) => set("architects", { ...value.architects, title: v })}
        />
        {value.architects.people.map((person, index) => {
          const patchPerson = (patch: Partial<Architect>) =>
            set("architects", {
              ...value.architects,
              people: value.architects.people.map((p, i) =>
                i === index ? { ...p, ...patch } : p,
              ),
            });

          const doc = person.document ?? { label: "", url: "", preview: "", previewAlt: "" };
          const patchDocument = (patch: Partial<ArchitectDocument>) =>
            patchPerson({ document: { ...doc, ...patch } });

          return (
            // biome-ignore lint/suspicious/noArrayIndexKey: rows are positional and editable
            <div key={index} className="space-y-3 rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <span className="font-medium text-muted-foreground text-sm">
                  {person.name || `Arkitekt ${index + 1}`}
                </span>
                <ConfirmDelete
                  label="Fjern arkitekt"
                  title="Fjerne arkitekt?"
                  description={`"${person.name || "Uten navn"}" tas ut av listen når du lagrer.`}
                  onConfirm={() =>
                    set("architects", {
                      ...value.architects,
                      people: value.architects.people.filter((_, i) => i !== index),
                    })
                  }
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <TextField
                  label="Navn"
                  value={person.name}
                  onChange={(name) => patchPerson({ name })}
                />
                <TextField
                  label="Rolle"
                  value={person.role}
                  onChange={(role) => patchPerson({ role })}
                />
              </div>

              <Separator />

              <p className="text-muted-foreground text-xs">
                Tegning som kan lastes ned. La PDF-en stå tom for å vise arkitekten uten lenke.
              </p>
              <div className="grid gap-4 md:grid-cols-2">
                <TextField
                  label="Lenketekst"
                  value={doc.label}
                  onChange={(label) => patchDocument({ label })}
                  hint='Vises som "Illustrasjonsplan (PDF)".'
                />
                <PdfField
                  label="PDF"
                  value={doc.url}
                  onChange={(url) => patchDocument({ url })}
                />
              </div>
              <ImageField
                label="Forhåndsvisning"
                value={doc.preview}
                onChange={(preview) => patchDocument({ preview })}
              />
              <TextField
                label="Forhåndsvisning – alternativ tekst"
                value={doc.previewAlt}
                onChange={(previewAlt) => patchDocument({ previewAlt })}
              />
            </div>
          );
        })}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() =>
            set("architects", {
              ...value.architects,
              people: [...value.architects.people, { name: "", role: "" }],
            })
          }
        >
          <Plus className="size-4" />
          Legg til arkitekt
        </Button>
      </div>

      <Separator />

      <div className="space-y-4">
        <Label className="text-base">Venteliste</Label>
        <TextField
          label="Overskrift"
          value={value.waitlist.title}
          onChange={(v) => set("waitlist", { ...value.waitlist, title: v })}
        />
        <TextareaField
          label="Brødtekst"
          value={value.waitlist.body}
          onChange={(v) => set("waitlist", { ...value.waitlist, body: v })}
          rows={3}
        />
        <div className="grid gap-4 md:grid-cols-2">
          <TextField
            label="Facebook – knappetekst"
            value={value.waitlist.facebookLabel}
            onChange={(v) => set("waitlist", { ...value.waitlist, facebookLabel: v })}
          />
          <TextField
            label="Facebook – lenke"
            value={value.waitlist.facebookUrl}
            onChange={(v) => set("waitlist", { ...value.waitlist, facebookUrl: v })}
          />
          <TextField
            label="Kontaktperson"
            value={value.waitlist.contactName}
            onChange={(v) => set("waitlist", { ...value.waitlist, contactName: v })}
          />
          <TextField
            label="Kontakt – e-post"
            value={value.waitlist.email}
            onChange={(v) => set("waitlist", { ...value.waitlist, email: v })}
          />
        </div>
      </div>
    </div>
  );
}
