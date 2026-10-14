"use client";

import { useCallback, useEffect, useState } from "react";

import { BookOpenCheck, KeyRound, LoaderCircle, PlugZap, Receipt } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
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
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  getTripletexOptions,
  getTripletexSettings,
  testTripletexConnection,
  updateTripletexSettings,
} from "@/lib/tripletex";
import type { TripletexOptions, TripletexSettings } from "@/types/tripletex";

type Draft = {
  enabled: boolean;
  production: boolean;
  consumerToken: string;
  employeeToken: string;
  vatTypeId: string;
  paymentTypeId: string;
  sendInvoice: boolean;
  dueDays: string;
};

export function TripletexSettingsForm() {
  const [settings, setSettings] = useState<TripletexSettings | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [options, setOptions] = useState<TripletexOptions | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  const loadOptions = useCallback(async () => {
    try {
      setOptions(await getTripletexOptions());
    } catch {
      setOptions(null);
    }
  }, []);

  useEffect(() => {
    getTripletexSettings()
      .then((loaded) => {
        setSettings(loaded);
        setDraft(toDraft(loaded));
        if (loaded.complete) void loadOptions();
      })
      .catch((cause) => {
        setError(cause instanceof Error ? cause.message : "Klarte ikke å hente innstillingene");
      });
  }, [loadOptions]);

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) =>
    setDraft((current) => (current ? { ...current, [key]: value } : current));

  const dirty =
    settings !== null &&
    draft !== null &&
    JSON.stringify(draft) !== JSON.stringify(toDraft(settings));

  async function save() {
    if (!draft || !settings) return;
    setSaving(true);

    const environmentChanged = draft.production !== settings.production;
    try {
      const updated = await updateTripletexSettings({
        enabled: draft.enabled,
        production: draft.production,
        vatTypeId: draft.vatTypeId ? Number(draft.vatTypeId) : null,
        paymentTypeId: draft.paymentTypeId ? Number(draft.paymentTypeId) : null,
        sendInvoice: draft.sendInvoice,
        dueDays: Number(draft.dueDays) || 0,
        // Untouched token fields mean "keep the stored ones".
        ...(draft.consumerToken ? { consumerToken: draft.consumerToken } : {}),
        ...(draft.employeeToken ? { employeeToken: draft.employeeToken } : {}),
      });
      setSettings(updated);
      setDraft(toDraft(updated));
      toast.success(
        environmentChanged
          ? "Lagret. Velg MVA-type og innbetalingstype på nytt for dette miljøet."
          : "Innstillingene er lagret",
      );
      if (updated.complete) void loadOptions();
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "Klarte ikke å lagre innstillingene");
    } finally {
      setSaving(false);
    }
  }

  async function test() {
    setTesting(true);
    try {
      const result = await testTripletexConnection();
      if (result.ok) {
        toast.success(result.message);
        void loadOptions();
      } else {
        toast.error(result.message);
      }
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "Klarte ikke å teste tilkoblingen");
    } finally {
      setTesting(false);
    }
  }

  if (error) {
    return (
      <p className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-destructive text-sm">
        {error}
      </p>
    );
  }

  if (!draft || !settings) {
    return (
      <div className="max-w-2xl space-y-4">
        <Skeleton className="h-96 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const ready = Boolean(settings.vatTypeId && settings.paymentTypeId);
  const active = settings.enabled && settings.complete;

  return (
    <div className="max-w-2xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeyRound className="size-4 text-muted-foreground" />
            Tripletex
            {active && ready ? (
              <Badge className="bg-green-500/10 text-green-700 dark:bg-green-500/15 dark:text-green-300">
                Aktiv
              </Badge>
            ) : active ? (
              <Badge variant="secondary">Mangler valg nedenfor</Badge>
            ) : (
              <Badge variant="secondary">Ikke aktiv</Badge>
            )}
          </CardTitle>
          <CardDescription>
            Integrasjonen trenger to nøkler. <strong>Consumer token</strong> utstedes av Tripletex
            til integrasjonen – søk om API-tilgang via{" "}
            <a
              href="https://developer.tripletex.no"
              target="_blank"
              rel="noreferrer noopener"
              className="underline underline-offset-2"
            >
              developer.tripletex.no
            </a>
            , der du også får nøkler til testmiljøet. <strong>Employee token</strong> lager en
            administrator i Tripletex under brukerens API-tilgang; integrasjonen handler som den
            brukeren.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-5">
          <div className="flex items-center justify-between gap-4 rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label htmlFor="tripletex-enabled">Send bookinger til Tripletex</Label>
              <p className="text-muted-foreground text-sm">
                Slås dette av, sendes ingenting – nøklene og valgene beholdes.
              </p>
            </div>
            <Switch
              id="tripletex-enabled"
              checked={draft.enabled}
              onCheckedChange={(checked) => set("enabled", checked)}
            />
          </div>

          <div className="space-y-2">
            <Label>Miljø</Label>
            <div className="flex flex-wrap items-center gap-3">
              <ToggleGroup
                variant="outline"
                type="single"
                value={draft.production ? "production" : "test"}
                onValueChange={(value) => {
                  if (value) set("production", value === "production");
                }}
              >
                <ToggleGroupItem value="test">Test</ToggleGroupItem>
                <ToggleGroupItem value="production">Produksjon</ToggleGroupItem>
              </ToggleGroup>
              {draft.production ? (
                <Badge variant="destructive">Ekte regnskap</Badge>
              ) : (
                <span className="text-muted-foreground text-xs">
                  Testmiljøet er et eget testfirma hos Tripletex.
                </span>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tripletex-consumer">Consumer token</Label>
            <Input
              id="tripletex-consumer"
              type="password"
              autoComplete="off"
              value={draft.consumerToken}
              onChange={(event) => set("consumerToken", event.target.value)}
              placeholder={
                settings.consumerTokenHint
                  ? `Lagret (${settings.consumerTokenHint}) – skriv inn for å bytte`
                  : ""
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tripletex-employee">Employee token</Label>
            <Input
              id="tripletex-employee"
              type="password"
              autoComplete="off"
              value={draft.employeeToken}
              onChange={(event) => set("employeeToken", event.target.value)}
              placeholder={
                settings.employeeTokenHint
                  ? `Lagret (${settings.employeeTokenHint}) – skriv inn for å bytte`
                  : ""
              }
            />
            <p className="text-muted-foreground text-xs">
              Nøklene vises aldri igjen her. La feltet stå tomt for å beholde den lagrede.
            </p>
          </div>
        </CardContent>

        <CardFooter className="flex flex-wrap gap-3">
          <Button onClick={() => void save()} disabled={saving}>
            {saving ? <LoaderCircle className="size-4 animate-spin" /> : null}
            Lagre
          </Button>
          <Button
            variant="outline"
            onClick={() => void test()}
            disabled={testing || dirty || !settings.complete}
          >
            {testing ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : (
              <PlugZap className="size-4" />
            )}
            Test tilkobling
          </Button>
          {dirty ? (
            <span className="text-muted-foreground text-xs">Lagre før du tester.</span>
          ) : null}
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="size-4 text-muted-foreground" />
            Fakturering
          </CardTitle>
          <CardDescription>
            Når en booking bekreftes, opprettes gjesten som kunde og bookingen som faktura. Betales
            den med Vipps, registreres betalingen på fakturaen. Refunderes eller avlyses den,
            lages en kreditnota.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-5">
          {!settings.complete ? (
            <p className="text-muted-foreground text-sm">
              Lagre begge nøklene først, så hentes valgene under fra Tripletex.
            </p>
          ) : options && !options.ok ? (
            <p className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-destructive text-sm">
              {options.message}
            </p>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="tripletex-vat">MVA-type på fakturalinjene</Label>
            <NativeSelect
              id="tripletex-vat"
              className="w-full"
              value={draft.vatTypeId}
              disabled={!options?.ok}
              onChange={(event) => set("vatTypeId", event.target.value)}
            >
              <NativeSelectOption value="">Velg …</NativeSelectOption>
              {options?.vatTypes.map((type) => (
                <NativeSelectOption key={type.id} value={String(type.id)}>
                  {type.label}
                </NativeSelectOption>
              ))}
            </NativeSelect>
            <p className="text-muted-foreground text-xs">
              Utleie av lokaler er som regel unntatt fra merverdiavgift. Spør regnskapsføreren om
              dere er frivillig registrert.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tripletex-payment">Innbetalingstype for Vipps</Label>
            <NativeSelect
              id="tripletex-payment"
              className="w-full"
              value={draft.paymentTypeId}
              disabled={!options?.ok}
              onChange={(event) => set("paymentTypeId", event.target.value)}
            >
              <NativeSelectOption value="">Velg …</NativeSelectOption>
              {options?.paymentTypes.map((type) => (
                <NativeSelectOption key={type.id} value={String(type.id)}>
                  {type.label}
                </NativeSelectOption>
              ))}
            </NativeSelect>
            <p className="text-muted-foreground text-xs">
              Bestemmer hvilken konto Vipps-innbetalingene føres mot. Finnes ingen for Vipps, lag
              en i Tripletex under innbetalingstyper.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-[1fr_10rem] sm:items-end">
            <div className="flex items-center justify-between gap-4 rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label htmlFor="tripletex-send">Send fakturaen til gjesten</Label>
                <p className="text-muted-foreground text-sm">
                  Av: gjesten har allerede fått Vipps-lenke i bekreftelsen.
                </p>
              </div>
              <Switch
                id="tripletex-send"
                checked={draft.sendInvoice}
                onCheckedChange={(checked) => set("sendInvoice", checked)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tripletex-due">Forfall (dager)</Label>
              <Input
                id="tripletex-due"
                type="number"
                min={0}
                max={90}
                value={draft.dueDays}
                onChange={(event) => set("dueDays", event.target.value)}
              />
            </div>
          </div>
        </CardContent>

        <CardFooter>
          <Button onClick={() => void save()} disabled={saving || !dirty}>
            {saving ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : (
              <BookOpenCheck className="size-4" />
            )}
            Lagre
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

function toDraft(settings: TripletexSettings): Draft {
  return {
    enabled: settings.enabled,
    production: settings.production,
    consumerToken: "",
    employeeToken: "",
    vatTypeId: settings.vatTypeId ? String(settings.vatTypeId) : "",
    paymentTypeId: settings.paymentTypeId ? String(settings.paymentTypeId) : "",
    sendInvoice: settings.sendInvoice,
    dueDays: String(settings.dueDays),
  };
}
