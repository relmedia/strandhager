"use client";

import { useState, type FormEvent } from "react";

import { LoaderCircle } from "lucide-react";
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
import { changePassword } from "@/server/auth-actions";

export function ChangePasswordCard() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [repeat, setRepeat] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();

    if (next.length < 8) {
      toast.error("Det nye passordet må være minst 8 tegn.");
      return;
    }
    if (next !== repeat) {
      toast.error("De nye passordene er ikke like.");
      return;
    }

    setSaving(true);
    const result = await changePassword(current, next);
    setSaving(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success("Passordet er byttet.");
    setCurrent("");
    setNext("");
    setRepeat("");
  }

  return (
    <Card>
      <form onSubmit={submit}>
        <CardHeader>
          <CardTitle>Bytt passord</CardTitle>
          <CardDescription>
            Skriv inn passordet du bruker i dag, og velg et nytt på minst 8 tegn.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="password-current">Nåværende passord</Label>
            <Input
              id="password-current"
              type="password"
              autoComplete="current-password"
              value={current}
              onChange={(event) => setCurrent(event.target.value)}
              disabled={saving}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password-new">Nytt passord</Label>
            <Input
              id="password-new"
              type="password"
              autoComplete="new-password"
              value={next}
              onChange={(event) => setNext(event.target.value)}
              disabled={saving}
              required
              minLength={8}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password-repeat">Gjenta nytt passord</Label>
            <Input
              id="password-repeat"
              type="password"
              autoComplete="new-password"
              value={repeat}
              onChange={(event) => setRepeat(event.target.value)}
              disabled={saving}
              required
              minLength={8}
            />
          </div>
        </CardContent>

        <CardFooter className="justify-end pt-4">
          <Button type="submit" disabled={saving || !current || !next || !repeat}>
            {saving ? <LoaderCircle className="size-4 animate-spin" /> : null}
            Bytt passord
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
