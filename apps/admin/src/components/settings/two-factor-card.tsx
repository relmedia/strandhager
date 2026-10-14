"use client";

import { type FormEvent, useState } from "react";

import { useRouter } from "next/navigation";

import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { setTwoFactorLogin } from "@/server/auth-actions";

export function TwoFactorCard({ enabled }: { enabled: boolean }) {
  const router = useRouter();
  const [checked, setChecked] = useState(enabled);
  const [saving, setSaving] = useState(false);
  // Turning it off asks for the password first, so a borrowed or stolen
  // session cannot quietly remove the protection.
  const [confirmingOff, setConfirmingOff] = useState(false);
  const [password, setPassword] = useState("");

  async function apply(value: boolean, currentPassword?: string) {
    setSaving(true);
    const result = await setTwoFactorLogin(value, currentPassword);
    setSaving(false);

    if (result.error) {
      toast.error(result.error);
      return false;
    }

    setChecked(value);
    toast.success(
      value
        ? "Tofaktor er slått på. Du får en engangskode på e-post når du logger inn."
        : "Tofaktor er slått av. Du logger nå inn med bare passord.",
    );
    router.refresh();
    return true;
  }

  function toggle(value: boolean) {
    if (value) {
      setConfirmingOff(false);
      void apply(true);
    } else {
      setConfirmingOff(true);
    }
  }

  async function confirmOff(event: FormEvent) {
    event.preventDefault();
    if (await apply(false, password)) {
      setConfirmingOff(false);
    }
    setPassword("");
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

      <CardContent className="space-y-3 pt-4">
        <div className="flex items-center justify-between gap-4 rounded-lg border px-4 py-3">
          <Label htmlFor="two-factor" className="font-normal">
            Engangskode på e-post ved innlogging
          </Label>
          <Switch
            id="two-factor"
            checked={checked && !confirmingOff}
            onCheckedChange={toggle}
            disabled={saving}
          />
        </div>

        {confirmingOff ? (
          <form onSubmit={(event) => void confirmOff(event)} className="space-y-2 rounded-lg border p-4">
            <Label htmlFor="two-factor-password">Bekreft med passordet ditt</Label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                id="two-factor-password"
                type="password"
                autoComplete="current-password"
                autoFocus
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
              <Button type="submit" variant="destructive" disabled={saving || !password}>
                Slå av tofaktor
              </Button>
              <Button
                type="button"
                variant="ghost"
                disabled={saving}
                onClick={() => {
                  setConfirmingOff(false);
                  setPassword("");
                }}
              >
                Avbryt
              </Button>
            </div>
          </form>
        ) : null}
      </CardContent>
    </Card>
  );
}
