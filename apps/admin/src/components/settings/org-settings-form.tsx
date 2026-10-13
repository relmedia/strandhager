"use client";

import { useEffect, useState } from "react";

import { Building2, LoaderCircle } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { getOrgSettings, updateOrgSettings, type OrgSettings } from "@/lib/booking";

export function OrgSettingsForm() {
  const [settings, setSettings] = useState<OrgSettings | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  /** One contact detail per line, which is how the agreement prints them. */
  const [lines, setLines] = useState("");

  useEffect(() => {
    let active = true;

    getOrgSettings()
      .then((loaded) => {
        if (!active) return;
        hydrate(loaded);
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
  }, []);

  function hydrate(loaded: OrgSettings) {
    setSettings(loaded);
    setName(loaded.landlord.name);
    setLines(loaded.landlord.lines.join("\n"));
  }

  const parsedLines = lines
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const valid = name.trim().length > 0;
  const dirty =
    settings !== null &&
    (name.trim() !== settings.landlord.name ||
      parsedLines.join("\n") !== settings.landlord.lines.join("\n"));

  async function save() {
    if (!settings || !valid) return;
    setSaving(true);

    try {
      const updated = await updateOrgSettings({
        landlordName: name.trim(),
        landlordLines: parsedLines,
      });
      hydrate(updated);
      toast.success("Utleieropplysningene er lagret");
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

  if (!settings) {
    return (
      <div className="max-w-2xl">
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="size-4 text-muted-foreground" />
            Utleier på leieavtalen
          </CardTitle>
          <CardDescription>
            Slik står dere oppført som utleier på nye leieavtaler.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-5">
          <div className="space-y-1.5">
            <Label htmlFor="org-name">Navn</Label>
            <Input
              id="org-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              aria-invalid={!valid}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="org-lines">Kontaktlinjer</Label>
            <Textarea
              id="org-lines"
              rows={3}
              value={lines}
              onChange={(event) => setLines(event.target.value)}
            />
            <p className="text-muted-foreground text-xs">
              Én per linje, for eksempel e-post og telefon.
            </p>
          </div>

          <div className="rounded-lg border bg-muted/40 p-4">
            <p className="font-medium text-muted-foreground text-xs tracking-[0.14em] uppercase">
              Utleier
            </p>
            <p className="mt-1.5 font-medium text-sm">{name.trim() || "—"}</p>
            {parsedLines.map((line) => (
              <p key={line} className="mt-0.5 text-muted-foreground text-sm">
                {line}
              </p>
            ))}
          </div>

          <p className="text-muted-foreground text-xs">
            Gjelder bookinger som opprettes fra nå av. Avtaler som allerede er sendt ut
            beholder det som sto der da de ble inngått — enkeltavtaler kan fortsatt endres
            med pennen på bookingen.
          </p>
        </CardContent>

        <CardFooter className="flex items-center gap-3">
          <Button onClick={() => void save()} disabled={!dirty || !valid || saving}>
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
