"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import { toast } from "sonner";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { setTwoFactorLogin } from "@/server/auth-actions";

export function TwoFactorCard({ enabled }: { enabled: boolean }) {
  const router = useRouter();
  const [checked, setChecked] = useState(enabled);
  const [saving, setSaving] = useState(false);

  async function toggle(value: boolean) {
    setChecked(value);
    setSaving(true);
    const result = await setTwoFactorLogin(value);
    setSaving(false);

    if (result.error) {
      setChecked(!value);
      toast.error(result.error);
      return;
    }

    toast.success(
      value
        ? "Tofaktor er slått på. Du får en engangskode på e-post når du logger inn."
        : "Tofaktor er slått av. Du logger nå inn med bare passord.",
    );
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tofaktorautentisering</CardTitle>
        <CardDescription>
          Med tofaktor på må innloggingen bekreftes med en engangskode som sendes til
          e-posten din. Det beskytter kontoen selv om passordet skulle komme på avveie.
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-4">
        <div className="flex items-center justify-between gap-4 rounded-lg border px-4 py-3">
          <Label htmlFor="two-factor" className="font-normal">
            Engangskode på e-post ved innlogging
          </Label>
          <Switch
            id="two-factor"
            checked={checked}
            onCheckedChange={toggle}
            disabled={saving}
          />
        </div>
      </CardContent>
    </Card>
  );
}
