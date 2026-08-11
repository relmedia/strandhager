"use client";

import { useEffect, useState } from "react";

import { CalendarRange, LoaderCircle, Minus, Plus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { getSpace, updateSpace } from "@/lib/booking";
import type { Space } from "@/types/booking";

const MIN_DAYS = 1;
const MAX_DAYS = 365;

const clamp = (value: number) => Math.min(MAX_DAYS, Math.max(MIN_DAYS, value));

export function BookingSettingsForm({ slug }: { slug: string }) {
  const [space, setSpace] = useState<Space | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  /** Kept as text so the field can be emptied while typing a new number. */
  const [maxDays, setMaxDays] = useState("");

  useEffect(() => {
    let active = true;

    getSpace(slug)
      .then((loaded) => {
        if (!active) return;
        setSpace(loaded);
        setMaxDays(String(loaded.maxBookingDays));
      })
      .catch((cause) => {
        if (!active) return;
        setError(
          cause instanceof Error ? cause.message : "Klarte ikke å hente innstillingene",
        );
      });

    return () => {
      active = false;
    };
  }, [slug]);

  const parsed = Number.parseInt(maxDays, 10);
  const valid = Number.isInteger(parsed) && parsed >= MIN_DAYS && parsed <= MAX_DAYS;
  const dirty = space !== null && valid && parsed !== space.maxBookingDays;

  const step = (delta: number) =>
    setMaxDays(String(clamp((valid ? parsed : (space?.maxBookingDays ?? 1)) + delta)));

  async function save() {
    if (!space || !valid) return;
    setSaving(true);

    try {
      const updated = await updateSpace(slug, { maxBookingDays: parsed });
      setSpace(updated);
      setMaxDays(String(updated.maxBookingDays));
      toast.success("Bookingreglene er lagret");
    } catch (cause) {
      toast.error(
        cause instanceof Error ? cause.message : "Klarte ikke å lagre innstillingene",
      );
    } finally {
      setSaving(false);
    }
  }

  if (error) {
    return (
      <p className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-destructive text-sm">
        {error}
      </p>
    );
  }

  if (!space) {
    return (
      <div className="max-w-2xl">
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarRange className="size-4 text-muted-foreground" />
            Bookingregler
          </CardTitle>
          <CardDescription>
            Regler som gjelder når gjester booker {space.name} på nettsiden.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-5">
          <div className="flex flex-col gap-4 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="max-booking-days">Maks lengde per booking</Label>
              <p className="text-muted-foreground text-sm">
                Det lengste sammenhengende oppholdet en gjest kan velge i kalenderen.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label="Færre dager"
                onClick={() => step(-1)}
                disabled={valid && parsed <= MIN_DAYS}
              >
                <Minus className="size-4" />
              </Button>
              <div className="relative">
                <Input
                  id="max-booking-days"
                  inputMode="numeric"
                  value={maxDays}
                  onChange={(event) =>
                    setMaxDays(event.target.value.replace(/\D/g, ""))
                  }
                  onBlur={() => {
                    if (valid) setMaxDays(String(clamp(parsed)));
                  }}
                  className="w-24 pr-12 text-right tabular-nums"
                  aria-invalid={!valid}
                />
                <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-muted-foreground text-sm">
                  dgr
                </span>
              </div>
              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label="Flere dager"
                onClick={() => step(1)}
                disabled={valid && parsed >= MAX_DAYS}
              >
                <Plus className="size-4" />
              </Button>
            </div>
          </div>

          <p className="text-muted-foreground text-xs">
            {valid
              ? `Gjester kan booke opptil ${parsed} ${parsed === 1 ? "dag" : "dager"} sammenhengende. Lengre opphold må avtales direkte med styret.`
              : `Velg et antall mellom ${MIN_DAYS} og ${MAX_DAYS} dager.`}
          </p>
        </CardContent>

        <CardFooter className="flex items-center gap-3">
          <Button onClick={() => void save()} disabled={!dirty || saving}>
            {saving ? <LoaderCircle className="size-4 animate-spin" /> : null}
            Lagre
          </Button>
          {dirty ? (
            <span className="text-muted-foreground text-xs">Ulagrede endringer</span>
          ) : null}
        </CardFooter>
      </Card>
    </div>
  );
}
