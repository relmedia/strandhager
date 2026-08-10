"use client";

import { useEffect, useState } from "react";

import { KeyRound, LoaderCircle, Send } from "lucide-react";
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
import { Switch } from "@/components/ui/switch";
import { getMailSettings, sendTestEmail, updateMailSettings } from "@/lib/mail";
import type { MailSettings } from "@/types/mail";

type Draft = {
  enabled: boolean;
  apiKey: string;
  fromName: string;
  fromEmail: string;
  notifyEmail: string;
};

export function MailSettingsForm() {
  const [settings, setSettings] = useState<MailSettings | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [testTo, setTestTo] = useState("");
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    getMailSettings()
      .then((loaded) => {
        setSettings(loaded);
        setDraft(toDraft(loaded));
      })
      .catch((cause) => {
        setError(
          cause instanceof Error ? cause.message : "Klarte ikke å hente innstillingene",
        );
      });
  }, []);

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) =>
    setDraft((current) => (current ? { ...current, [key]: value } : current));

  async function save() {
    if (!draft) return;
    setSaving(true);

    try {
      const updated = await updateMailSettings({
        enabled: draft.enabled,
        fromName: draft.fromName,
        fromEmail: draft.fromEmail,
        notifyEmail: draft.notifyEmail,
        // An untouched key field means "keep the stored one".
        ...(draft.apiKey ? { apiKey: draft.apiKey } : {}),
      });

      setSettings(updated);
      setDraft(toDraft(updated));
      toast.success("Innstillingene er lagret");
    } catch (cause) {
      toast.error(
        cause instanceof Error ? cause.message : "Klarte ikke å lagre innstillingene",
      );
    } finally {
      setSaving(false);
    }
  }

  async function sendTest() {
    setTesting(true);

    try {
      await sendTestEmail(testTo);
      toast.success(`Testmelding sendt til ${testTo}`);
    } catch (cause) {
      toast.error(
        cause instanceof Error ? cause.message : "Klarte ikke å sende testmeldingen",
      );
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
        <Skeleton className="h-72 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeyRound className="size-4 text-muted-foreground" />
            Resend
          </CardTitle>
          <CardDescription>
            E-post sendes via{" "}
            <a
              href="https://resend.com"
              target="_blank"
              rel="noreferrer noopener"
              className="underline underline-offset-2"
            >
              Resend
            </a>
            . Avsenderadressen må tilhøre et domene som er verifisert der.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-5">
          <div className="flex items-center justify-between gap-4 rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label htmlFor="mail-enabled">Send e-post</Label>
              <p className="text-muted-foreground text-sm">
                Slås dette av, sendes ingenting – men nøkkelen beholdes.
              </p>
            </div>
            <Switch
              id="mail-enabled"
              checked={draft.enabled}
              onCheckedChange={(checked) => set("enabled", checked)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="mail-api-key">API-nøkkel</Label>
            <Input
              id="mail-api-key"
              type="password"
              autoComplete="off"
              value={draft.apiKey}
              onChange={(event) => set("apiKey", event.target.value)}
              placeholder={
                settings.hasApiKey
                  ? `Lagret (${settings.apiKeyHint}) – skriv inn for å bytte`
                  : "re_…"
              }
            />
            <p className="text-muted-foreground text-xs">
              Lages under API Keys i Resend-dashbordet. Nøkkelen vises aldri igjen her.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="mail-from-name">Avsendernavn</Label>
              <Input
                id="mail-from-name"
                value={draft.fromName}
                onChange={(event) => set("fromName", event.target.value)}
                placeholder="Ølberg strandhager"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="mail-from-email">Avsenderadresse</Label>
              <Input
                id="mail-from-email"
                type="email"
                value={draft.fromEmail}
                onChange={(event) => set("fromEmail", event.target.value)}
                placeholder="post@strandhager.no"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="mail-notify">Varslingsadresse</Label>
            <Input
              id="mail-notify"
              type="email"
              value={draft.notifyEmail}
              onChange={(event) => set("notifyEmail", event.target.value)}
              placeholder="felleshuset@strandhager.no"
            />
            <p className="text-muted-foreground text-xs">
              Hit går styrets kopier: nye bookinger, henvendelser og påmeldinger til
              ventelisten. Tomt felt betyr ingen varsler.
            </p>
          </div>
        </CardContent>

        <CardFooter>
          <Button onClick={() => void save()} disabled={saving}>
            {saving ? <LoaderCircle className="size-4 animate-spin" /> : null}
            Lagre
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="size-4 text-muted-foreground" />
            Send en test
          </CardTitle>
          <CardDescription>
            Sjekk at oppsettet virker ved å sende en testmelding til deg selv. Husk å
            lagre nøkkelen først.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form
            className="flex flex-col gap-3 sm:flex-row"
            onSubmit={(event) => {
              event.preventDefault();
              void sendTest();
            }}
          >
            <Input
              type="email"
              required
              value={testTo}
              onChange={(event) => setTestTo(event.target.value)}
              placeholder="din@epost.no"
              aria-label="E-postadresse testmeldingen sendes til"
            />
            <Button type="submit" disabled={testing || !testTo} className="sm:shrink-0">
              {testing ? (
                <LoaderCircle className="size-4 animate-spin" />
              ) : (
                <Send className="size-4" />
              )}
              Send test
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function toDraft(settings: MailSettings): Draft {
  return {
    enabled: settings.enabled,
    apiKey: "",
    fromName: settings.fromName,
    fromEmail: settings.fromEmail,
    notifyEmail: settings.notifyEmail ?? "",
  };
}
