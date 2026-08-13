"use client";

import { useState, type FormEvent } from "react";

import { useRouter, useSearchParams } from "next/navigation";

import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { REGEXP_ONLY_DIGITS } from "input-otp";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldContent, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { AUTH_HOME_PATH } from "@/lib/auth";
import { startLogin, verifyLogin } from "@/server/auth-actions";

const credentialsSchema = z.object({
  email: z.string().email({ message: "Skriv inn en gyldig e-postadresse." }),
  password: z.string().min(8, { message: "Passordet må være minst 8 tegn." }),
  remember: z.boolean().optional(),
});

type Credentials = z.infer<typeof credentialsSchema>;

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [challenge, setChallenge] = useState<{
    id: string;
    emailed: boolean;
    code?: string;
    mailError?: string;
  } | null>(null);
  const [code, setCode] = useState("");
  const [verifying, setVerifying] = useState(false);

  const form = useForm<Credentials>({
    resolver: zodResolver(credentialsSchema),
    defaultValues: {
      email: "",
      password: "",
      remember: false,
    },
  });

  const redirectTo = searchParams.get("redirectTo");
  const destination = redirectTo?.startsWith("/") ? redirectTo : AUTH_HOME_PATH;
  const denied = searchParams.get("feil") === "ingen-tilgang";

  const onCredentials = async (data: Credentials) => {
    const result = await startLogin(data.email, data.password, Boolean(data.remember));

    if (!result.ok) {
      toast.error(result.error);
      form.setError("password", { message: result.error });
      return;
    }

    // Two-factor is off for this user: already logged in.
    if ("done" in result) {
      if (result.mustChangePassword) {
        router.replace("/bytt-passord");
        router.refresh();
        return;
      }
      toast.success("Innlogget.");
      router.replace(destination);
      router.refresh();
      return;
    }

    setChallenge({
      id: result.challengeId,
      emailed: result.emailed,
      code: result.code,
      mailError: result.mailError,
    });
    setCode(result.code ?? "");
    if (result.mailError) {
      toast.error("Koden kunne ikke sendes på e-post.");
    } else if (result.emailed) {
      toast.success("Vi har sendt en kode til e-posten din.");
    } else {
      toast.success("Skriv inn koden for å fullføre innloggingen.");
    }
  };

  const onCode = async (event: FormEvent) => {
    event.preventDefault();
    if (!challenge || code.length !== 6) return;

    setVerifying(true);
    const result = await verifyLogin(challenge.id, code, Boolean(form.getValues("remember")));
    setVerifying(false);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    if (result.mustChangePassword) {
      router.replace("/bytt-passord");
      router.refresh();
      return;
    }

    toast.success("Innlogget.");
    router.replace(destination);
    router.refresh();
  };

  const busy = form.formState.isSubmitting || verifying;

  if (challenge) {
    return (
      <form noValidate onSubmit={onCode} className="flex flex-col gap-4">
        {challenge.mailError ? (
          <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-800 text-sm">
            {challenge.mailError}
          </p>
        ) : (
          <p className="text-[#47503f] text-sm">
            {challenge.emailed
              ? "Skriv inn den sekssifrede koden vi sendte til e-posten din."
              : "E-post er ikke satt opp ennå, så koden er fylt inn under. Bekreft for å logge inn."}
          </p>
        )}
        <Field className="gap-1.5">
          <FieldLabel htmlFor="login-code">Kode</FieldLabel>
          <InputOTP
            id="login-code"
            maxLength={6}
            pattern={REGEXP_ONLY_DIGITS}
            value={code}
            onChange={setCode}
            disabled={busy}
            autoFocus
            inputMode="numeric"
            autoComplete="one-time-code"
            containerClassName="w-full"
          >
            <InputOTPGroup className="w-full gap-2">
              {Array.from({ length: 6 }, (_, index) => (
                <InputOTPSlot
                  key={index}
                  index={index}
                  className="size-auto h-14 min-w-0 flex-1 rounded-lg border border-[#d5ddd0] bg-white font-mono text-lg text-[#20261c] first:rounded-lg first:border-l last:rounded-lg data-[active=true]:border-[#4c901c] data-[active=true]:ring-[#4c901c]/30"
                />
              ))}
            </InputOTPGroup>
          </InputOTP>
        </Field>
        <Button
          className="h-11 w-full bg-[#4c901c] px-4 text-white hover:bg-[#3b6e1a]"
          type="submit"
          disabled={busy || code.length !== 6}
        >
          {verifying ? "Bekrefter …" : "Bekreft kode"}
        </Button>
        <button
          type="button"
          className="text-[#47503f] text-sm underline-offset-4 hover:underline"
          onClick={() => {
            setChallenge(null);
            setCode("");
          }}
          disabled={busy}
        >
          Tilbake til e-post og passord
        </button>
      </form>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {denied ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-800 text-sm">
          Kontoen din har ikke tilgang til dashbordet. Be styret om å legge til
          e-postadressen din, eller logg inn med en annen konto.
        </div>
      ) : null}

      <form noValidate onSubmit={form.handleSubmit(onCredentials)} className="flex flex-col gap-4">
        <FieldGroup className="gap-4">
          <Controller
            control={form.control}
            name="email"
            render={({ field, fieldState }) => (
              <Field className="gap-1.5" data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="login-email">E-postadresse</FieldLabel>
                <Input
                  {...field}
                  id="login-email"
                  type="email"
                  placeholder="deg@eksempel.no"
                  autoComplete="email"
                  aria-invalid={fieldState.invalid}
                  disabled={busy}
                  className="h-11 px-3"
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
          <Controller
            control={form.control}
            name="password"
            render={({ field, fieldState }) => (
              <Field className="gap-1.5" data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="login-password">Passord</FieldLabel>
                <Input
                  {...field}
                  id="login-password"
                  type="password"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  aria-invalid={fieldState.invalid}
                  disabled={busy}
                  className="h-11 px-3"
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
          <Controller
            control={form.control}
            name="remember"
            render={({ field, fieldState }) => (
              <Field orientation="horizontal" data-invalid={fieldState.invalid}>
                <Checkbox
                  id="login-remember"
                  name={field.name}
                  checked={field.value}
                  onCheckedChange={(checked) => field.onChange(Boolean(checked))}
                  aria-invalid={fieldState.invalid}
                  disabled={busy}
                />
                <FieldContent>
                  <FieldLabel htmlFor="login-remember" className="font-normal">
                    Husk meg i 30 dager
                  </FieldLabel>
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </FieldContent>
              </Field>
            )}
          />
        </FieldGroup>
        <Button
          className="h-11 w-full bg-[#4c901c] px-4 text-white hover:bg-[#3b6e1a]"
          type="submit"
          disabled={busy}
        >
          {form.formState.isSubmitting ? "Sender kode …" : "Send innloggingskode"}
        </Button>
      </form>
    </div>
  );
}
