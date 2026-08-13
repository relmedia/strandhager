"use client";

import { useState, type FormEvent } from "react";

import { useRouter } from "next/navigation";

import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { AUTH_HOME_PATH } from "@/lib/auth";
import { changePassword } from "@/server/auth-actions";

/** First-login step for invited users: swap the temporary password for their own. */
export function FirstPasswordForm() {
  const router = useRouter();
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

    toast.success("Passordet er lagret. Velkommen!");
    router.replace(AUTH_HOME_PATH);
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <Field className="gap-1.5">
        <FieldLabel htmlFor="first-current">Midlertidig passord</FieldLabel>
        <Input
          id="first-current"
          type="password"
          autoComplete="current-password"
          placeholder="Passordet fra e-posten"
          value={current}
          onChange={(event) => setCurrent(event.target.value)}
          disabled={saving}
          required
          className="h-11 px-3"
        />
      </Field>

      <Field className="gap-1.5">
        <FieldLabel htmlFor="first-new">Nytt passord</FieldLabel>
        <Input
          id="first-new"
          type="password"
          autoComplete="new-password"
          placeholder="••••••••"
          value={next}
          onChange={(event) => setNext(event.target.value)}
          disabled={saving}
          required
          minLength={8}
          className="h-11 px-3"
        />
      </Field>

      <Field className="gap-1.5">
        <FieldLabel htmlFor="first-repeat">Gjenta nytt passord</FieldLabel>
        <Input
          id="first-repeat"
          type="password"
          autoComplete="new-password"
          placeholder="••••••••"
          value={repeat}
          onChange={(event) => setRepeat(event.target.value)}
          disabled={saving}
          required
          minLength={8}
          className="h-11 px-3"
        />
      </Field>

      <Button
        className="h-11 w-full bg-[#4c901c] px-4 text-white hover:bg-[#3b6e1a]"
        type="submit"
        disabled={saving || !current || !next || !repeat}
      >
        {saving ? "Lagrer …" : "Lagre passord og fortsett"}
      </Button>
    </form>
  );
}
