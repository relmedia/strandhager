"use client";

import { useEffect, useState } from "react";

import { CircleCheck, CircleDashed, KeyRound, LoaderCircle, PlugZap, Webhook } from "lucide-react";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  getVippsSettings,
  registerVippsWebhook,
  testVippsConnection,
  updateVippsSettings,
} from "@/lib/vipps";
import type { VippsSettings } from "@/types/vipps";

type Draft = {
  enabled: boolean;
  production: boolean;
  clientId: string;
  merchantSerial: string;
  clientSecret: string;
  subscriptionKey: string;
};

/** Says where a value comes from when it is not saved on this page. */
function EnvNote({ source }: { source: "db" | "env" | null }) {
  if (source !== "env") return null;
  return <span className="text-muted-foreground text-xs"> · fra serverens .env</span>;
}

export function VippsSettingsForm() {
  const [settings, setSettings] = useState<VippsSettings | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [registering, setRegistering] = useState(false);

  useEffect(() => {
    getVippsSettings()
      .then((loaded) => {
        setSettings(loaded);
        setDraft(toDraft(loaded));
      })
      .catch((cause) => {
        setError(cause instanceof Error ? cause.message : "Klarte ikke å hente innstillingene");
      });
  }, []);

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) =>
    setDraft((current) => (current ? { ...current, [key]: value } : current));

  // The test and the webhook use what is saved, so unsaved edits must go first.
  const dirty =
    settings !== null &&
    draft !== null &&
    JSON.stringify(draft) !== JSON.stringify(toDraft(settings));

  function apply(updated: VippsSettings) {
    setSettings(updated);
    setDraft(toDraft(updated));
  }

  async function save() {
    if (!draft) return;
    setSaving(true);

    try {
      apply(
        await updateVippsSettings({
          enabled: draft.enabled,
          production: draft.production,
          clientId: draft.clientId,
          merchantSerial: draft.merchantSerial,
          // Untouched secret fields mean "keep the stored ones".
          ...(draft.clientSecret ? { clientSecret: draft.clientSecret } : {}),
          ...(draft.subscriptionKey ? { subscriptionKey: draft.subscriptionKey } : {}),
        }),
      );
      toast.success("Innstillingene er lagret");
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "Klarte ikke å lagre innstillingene");
    } finally {
      setSaving(false);
    }
  }

  async function test() {
    setTesting(true);
    try {
      const result = await testVippsConnection();
      if (result.ok) toast.success(result.message);
      else toast.error(result.message);
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "Klarte ikke å teste tilkoblingen");
    } finally {
      setTesting(false);
    }
  }

  async function registerWebhook() {
    setRegistering(true);
    try {
      apply(await registerVippsWebhook());
      toast.success("Webhooken er registrert hos Vipps");
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "Klarte ikke å registrere webhooken");
    } finally {
      setRegistering(false);
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
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      {settings.mock ? (
        <p className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-4 text-amber-800 text-sm dark:text-amber-200">
          VIPPS_MOCK er slått på i serverens .env. Ingen ekte betalinger tas imot – alle
          Vipps-kall later bare som de lykkes.
        </p>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeyRound className="size-4 text-muted-foreground" />
            Vipps
            {settings.active ? (
              <Badge className="bg-green-500/10 text-green-700 dark:bg-green-500/15 dark:text-green-300">
                Aktiv
              </Badge>
            ) : (
              <Badge variant="secondary">Ikke aktiv</Badge>
            )}
          </CardTitle>
          <CardDescription>
            Gjester betaler bookinger med Vipps. Nøklene finner du i{" "}
            <a
              href="https://portal.vippsmobilepay.com"
              target="_blank"
              rel="noreferrer noopener"
              className="underline underline-offset-2"
            >
              Vipps-portalen
            </a>{" "}
            under Utvikler → API-nøkler.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-5">
          <div className="flex items-center justify-between gap-4 rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label htmlFor="vipps-enabled">Ta imot betaling med Vipps</Label>
              <p className="text-muted-foreground text-sm">
                Slås dette av, bekreftes bookinger uten betalingslenke – nøklene beholdes.
              </p>
            </div>
            <Switch
              id="vipps-enabled"
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
                <Badge variant="destructive">Ekte penger</Badge>
              ) : (
                <span className="text-muted-foreground text-xs">
                  Testmiljøet bruker Vipps sin test-app, ingen penger flyttes.
                </span>
              )}
            </div>
            <p className="text-muted-foreground text-xs">
              Test- og produksjonsnøkler er forskjellige – bytt nøklene når du bytter miljø.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="vipps-client-id">
                Client ID
                <EnvNote source={settings.sources.clientId} />
              </Label>
              <Input
                id="vipps-client-id"
                autoComplete="off"
                value={draft.clientId}
                onChange={(event) => set("clientId", event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="vipps-msn">
                Merchant Serial Number (MSN)
                <EnvNote source={settings.sources.merchantSerial} />
              </Label>
              <Input
                id="vipps-msn"
                inputMode="numeric"
                autoComplete="off"
                value={draft.merchantSerial}
                onChange={(event) => set("merchantSerial", event.target.value)}
                placeholder="123456"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="vipps-client-secret">
              Client secret
              <EnvNote source={settings.sources.clientSecret} />
            </Label>
            <Input
              id="vipps-client-secret"
              type="password"
              autoComplete="off"
              value={draft.clientSecret}
              onChange={(event) => set("clientSecret", event.target.value)}
              placeholder={
                settings.clientSecretHint
                  ? `Lagret (${settings.clientSecretHint}) – skriv inn for å bytte`
                  : ""
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="vipps-subscription-key">
              Subscription key (Ocp-Apim-Subscription-Key)
              <EnvNote source={settings.sources.subscriptionKey} />
            </Label>
            <Input
              id="vipps-subscription-key"
              type="password"
              autoComplete="off"
              value={draft.subscriptionKey}
              onChange={(event) => set("subscriptionKey", event.target.value)}
              placeholder={
                settings.subscriptionKeyHint
                  ? `Lagret (${settings.subscriptionKeyHint}) – skriv inn for å bytte`
                  : ""
              }
            />
            <p className="text-muted-foreground text-xs">
              Hemmelighetene vises aldri igjen her. La feltet stå tomt for å beholde den lagrede.
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
            <Webhook className="size-4 text-muted-foreground" />
            Webhook
          </CardTitle>
          <CardDescription>
            Vipps sier fra hit når en gjest har betalt, slik at bookingen markeres som betalt og
            pengene trekkes automatisk. Uten webhook må betalingsstatusen settes for hånd.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-3">
          <div className="flex items-start gap-2 text-sm">
            {settings.webhook.registered ? (
              <>
                <CircleCheck className="mt-0.5 size-4 shrink-0 text-green-600" />
                <div className="min-w-0">
                  <p>Registrert</p>
                  <p className="break-all text-muted-foreground text-xs">{settings.webhook.url}</p>
                </div>
              </>
            ) : settings.webhook.manualSecret ? (
              <>
                <CircleCheck className="mt-0.5 size-4 shrink-0 text-green-600" />
                <p>Satt opp manuelt (hemmeligheten ligger i serverens .env).</p>
              </>
            ) : (
              <>
                <CircleDashed className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <p className="text-muted-foreground">Ikke registrert.</p>
              </>
            )}
          </div>
          <p className="text-muted-foreground text-xs">
            Registreres mot miljøet som er valgt over. Bytter du miljø, registrer på nytt.
          </p>
        </CardContent>

        <CardFooter>
          <Button
            variant="outline"
            onClick={() => void registerWebhook()}
            disabled={registering || dirty || !settings.complete}
          >
            {registering ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : (
              <Webhook className="size-4" />
            )}
            {settings.webhook.registered ? "Registrer på nytt" : "Registrer webhook"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

function toDraft(settings: VippsSettings): Draft {
  return {
    enabled: settings.enabled,
    production: settings.production,
    clientId: settings.clientId ?? "",
    merchantSerial: settings.merchantSerial ?? "",
    clientSecret: "",
    subscriptionKey: "",
  };
}
