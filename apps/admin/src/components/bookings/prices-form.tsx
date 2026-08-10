"use client";

import { useEffect, useState } from "react";

import { Plus, TriangleAlert } from "lucide-react";
import { toast } from "sonner";

import { ConfirmDelete } from "@/components/cms/confirm-delete";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { getSpace, updateSpace } from "@/lib/booking";
import type { Rate, Space } from "@/types/booking";

const WEEKDAYS = [
  { value: 1, short: "Man", long: "mandag" },
  { value: 2, short: "Tir", long: "tirsdag" },
  { value: 3, short: "Ons", long: "onsdag" },
  { value: 4, short: "Tor", long: "torsdag" },
  { value: 5, short: "Fre", long: "fredag" },
  { value: 6, short: "Lør", long: "lørdag" },
  { value: 7, short: "Søn", long: "søndag" },
];

/** Rates are edited as a list with no server ids until they are saved. */
type Draft = Omit<Rate, "id"> & { key: string };

let nextKey = 0;
const newKey = () => `rate-${nextKey++}`;

export function PricesForm({ slug }: { slug: string }) {
  const [space, setSpace] = useState<Space | null>(null);
  const [rates, setRates] = useState<Draft[]>([]);
  const [cleaningFee, setCleaningFee] = useState("");
  const [priceNote, setPriceNote] = useState("");
  const [noticeDays, setNoticeDays] = useState("");
  const [maxGuests, setMaxGuests] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    getSpace(slug)
      .then((data) => {
        if (!active) return;
        hydrate(data);
      })
      .catch((cause: unknown) => {
        if (!active) return;
        setError(cause instanceof Error ? cause.message : "Klarte ikke å hente prisene");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
    // hydrate only reads state setters, which are stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  function hydrate(data: Space) {
    setSpace(data);
    setRates(data.rates.map((rate) => ({ ...rate, key: newKey() })));
    setCleaningFee(String(data.cleaningFee));
    setPriceNote(data.priceNote ?? "");
    setNoticeDays(String(data.noticeDays));
    setMaxGuests(String(data.maxGuests));
  }

  function patch(key: string, changes: Partial<Draft>) {
    setRates((current) =>
      current.map((rate) => (rate.key === key ? { ...rate, ...changes } : rate)),
    );
  }

  function toggleWeekday(key: string, weekday: number) {
    setRates((current) =>
      current.map((rate) => {
        if (rate.key !== key) return rate;

        const weekdays = rate.weekdays.includes(weekday)
          ? rate.weekdays.filter((day) => day !== weekday)
          : [...rate.weekdays, weekday].sort((a, b) => a - b);

        return { ...rate, weekdays };
      }),
    );
  }

  async function save() {
    setSaving(true);
    try {
      const updated = await updateSpace(slug, {
        cleaningFee: Number(cleaningFee) || 0,
        priceNote: priceNote.trim(),
        noticeDays: Number(noticeDays) || 0,
        maxGuests: Number(maxGuests) || 1,
        rates: rates.map((rate) => ({
          label: rate.label.trim(),
          weekdays: rate.weekdays,
          amount: Number(rate.amount) || 0,
        })),
      });
      hydrate(updated);
      toast.success("Prisene er lagret");
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "Klarte ikke å lagre");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!space) {
    return (
      <p className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-destructive text-sm">
        {error ?? "Fant ikke lokalet."}
      </p>
    );
  }

  // Every weekday needs a rate, otherwise those days cannot be booked at all.
  const covered = new Set(rates.flatMap((rate) => rate.weekdays));
  const uncovered = WEEKDAYS.filter((day) => !covered.has(day.value));
  const overlapping = WEEKDAYS.filter(
    (day) => rates.filter((rate) => rate.weekdays.includes(day.value)).length > 1,
  );

  return (
    <div className="space-y-6">
      <section className="space-y-4 rounded-lg border p-5">
        <div>
          <h2 className="font-medium">Dagspriser</h2>
          <p className="mt-1 text-muted-foreground text-sm">
            Hver pris gjelder for ukedagene du huker av. Prisen ganges med antall dager
            gjesten leier.
          </p>
        </div>

        <div className="space-y-3">
          {rates.map((rate) => (
            <div key={rate.key} className="rounded-lg border bg-card p-4">
              <div className="grid gap-3 sm:grid-cols-[1fr_9rem_auto] sm:items-end">
                <div className="space-y-1.5">
                  <Label htmlFor={`${rate.key}-label`}>Navn</Label>
                  <Input
                    id={`${rate.key}-label`}
                    value={rate.label}
                    placeholder="Hverdager"
                    onChange={(event) => patch(rate.key, { label: event.target.value })}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor={`${rate.key}-amount`}>Kroner pr. dag</Label>
                  <Input
                    id={`${rate.key}-amount`}
                    type="number"
                    min={0}
                    value={rate.amount}
                    onChange={(event) =>
                      patch(rate.key, { amount: Number(event.target.value) })
                    }
                  />
                </div>

                <ConfirmDelete
                  label={`Fjern prisen ${rate.label || "uten navn"}`}
                  title="Fjerne denne prisen?"
                  description={`Dagene «${rate.label || "uten navn"}» dekker blir uten pris, og kan da ikke bookes før du gir dem en ny pris.`}
                  onConfirm={() =>
                    setRates((current) => current.filter((item) => item.key !== rate.key))
                  }
                />
              </div>

              <fieldset className="mt-4">
                <legend className="text-muted-foreground text-xs">Gjelder</legend>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {WEEKDAYS.map((day) => {
                    const on = rate.weekdays.includes(day.value);
                    return (
                      <button
                        key={day.value}
                        type="button"
                        onClick={() => toggleWeekday(rate.key, day.value)}
                        aria-pressed={on}
                        aria-label={day.long}
                        className={`rounded-md px-3 py-1.5 font-medium text-xs transition-colors ${
                          on
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground hover:bg-accent hover:text-foreground"
                        }`}
                      >
                        {day.short}
                      </button>
                    );
                  })}
                </div>
              </fieldset>
            </div>
          ))}
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() =>
            setRates((current) => [
              ...current,
              { key: newKey(), label: "", weekdays: [], amount: 0 },
            ])
          }
        >
          <Plus className="size-4" />
          Legg til pris
        </Button>

        {uncovered.length > 0 ? (
          <Warning>
            {uncovered.map((day) => day.long).join(", ")} har ingen pris, og kan derfor ikke
            bookes. Huk av disse dagene på en av prisene over.
          </Warning>
        ) : null}

        {overlapping.length > 0 ? (
          <Warning>
            {overlapping.map((day) => day.long).join(", ")} er dekket av flere priser. Den
            øverste prisen i listen blir brukt.
          </Warning>
        ) : null}
      </section>

      <section className="space-y-4 rounded-lg border p-5">
        <div>
          <h2 className="font-medium">Tillegg og regler</h2>
          <p className="mt-1 text-muted-foreground text-sm">
            Gjelder {space.name} og vises på nettsiden.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="cleaning">Utvask (kr)</Label>
            <Input
              id="cleaning"
              type="number"
              min={0}
              value={cleaningFee}
              onChange={(event) => setCleaningFee(event.target.value)}
            />
            <p className="text-muted-foreground text-xs">
              Legges til én gang per booking.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notice">Varslingsfrist (dager)</Label>
            <Input
              id="notice"
              type="number"
              min={0}
              value={noticeDays}
              onChange={(event) => setNoticeDays(event.target.value)}
            />
            <p className="text-muted-foreground text-xs">
              Hvor lang tid i forveien folk må booke.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="guests">Maks antall gjester</Label>
            <Input
              id="guests"
              type="number"
              min={1}
              value={maxGuests}
              onChange={(event) => setMaxGuests(event.target.value)}
            />
            <p className="text-muted-foreground text-xs">
              Øvre grense i bookingskjemaet.
            </p>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="note">Liten tekst under prisene</Label>
          <Input
            id="note"
            value={priceNote}
            placeholder="Alle priser er oppgitt inkl. mva."
            onChange={(event) => setPriceNote(event.target.value)}
          />
        </div>
      </section>

      <div className="flex items-center gap-3">
        <Button onClick={save} disabled={saving}>
          {saving ? <Spinner className="size-4" /> : null}
          Lagre priser
        </Button>
        <p className="text-muted-foreground text-sm">
          Endringer gjelder nye bookinger. Bookinger som allerede er lagt inn beholder
          prisen de fikk.
        </p>
      </div>
    </div>
  );
}

function Warning({ children }: { children: React.ReactNode }) {
  return (
    <p className="flex items-start gap-2 rounded-md bg-amber-50 p-3 text-amber-900 text-sm dark:bg-amber-500/10 dark:text-amber-200">
      <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
      {children}
    </p>
  );
}
