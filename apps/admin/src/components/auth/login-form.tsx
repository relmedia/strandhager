"use client";

import { useState } from "react";

import { useRouter, useSearchParams } from "next/navigation";

import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldContent, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { AUTH_HOME_PATH } from "@/lib/auth";
import { authClient } from "@/lib/auth/client";
import { signInWithEmail } from "@/server/auth-actions";

const formSchema = z.object({
  email: z.string().email({ message: "Skriv inn en gyldig e-postadresse." }),
  password: z.string().min(8, { message: "Passordet må være minst 8 tegn." }),
  remember: z.boolean().optional(),
});

type LoginFormValues = z.infer<typeof formSchema>;

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [oauthLoading, setOauthLoading] = useState(false);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
      remember: false,
    },
  });

  const redirectTo = searchParams.get("redirectTo");
  const destination = redirectTo?.startsWith("/") ? redirectTo : AUTH_HOME_PATH;

  const onSubmit = async (data: LoginFormValues) => {
    const formData = new FormData();
    formData.set("email", data.email);
    formData.set("password", data.password);

    const result = await signInWithEmail(formData);

    if (result.error) {
      toast.error(result.error);
      form.setError("password", { message: result.error });
      return;
    }

    toast.success("Innlogget.");
    router.replace(destination);
    router.refresh();
  };

  const signInWithGoogle = async () => {
    setOauthLoading(true);

    const { error } = await authClient.signIn.social({
      provider: "google",
      callbackURL: destination,
      errorCallbackURL: "/login",
    });

    if (error) {
      setOauthLoading(false);
      toast.error(error.message || "Kunne ikke starte Google-innlogging.");
    }
  };

  const isSubmitting = form.formState.isSubmitting;
  const busy = isSubmitting || oauthLoading;

  return (
    <div className="flex flex-col gap-4">
      <Button
        type="button"
        variant="outline"
        className="w-full border-[#d5ddd0] bg-white text-[#20261c] hover:bg-[#eef3e8]"
        disabled={busy}
        onClick={signInWithGoogle}
      >
        <GoogleIcon className="size-4" />
        {oauthLoading ? "Åpner Google …" : "Fortsett med Google"}
      </Button>

      <div className="flex items-center gap-3">
        <Separator className="flex-1 bg-[#d5ddd0]" />
        <span className="text-[#47503f] text-xs uppercase tracking-wide">eller</span>
        <Separator className="flex-1 bg-[#d5ddd0]" />
      </div>

      <form noValidate onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
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
          className="w-full bg-[#4c901c] text-white hover:bg-[#3b6e1a]"
          type="submit"
          disabled={busy}
        >
          {isSubmitting ? "Logger inn …" : "Logg inn"}
        </Button>
      </form>
    </div>
  );
}
