"use client";

import { useRouter, useSearchParams } from "next/navigation";

import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldContent, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { AUTH_HOME_PATH } from "@/lib/auth";
import { signInWithEmail } from "@/server/auth-actions";

const formSchema = z.object({
  email: z.string().email({ message: "Skriv inn en gyldig e-postadresse." }),
  password: z.string().min(8, { message: "Passordet må være minst 8 tegn." }),
  remember: z.boolean().optional(),
});

type LoginFormValues = z.infer<typeof formSchema>;

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

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

  const isSubmitting = form.formState.isSubmitting;
  const busy = isSubmitting;

  return (
    <div className="flex flex-col gap-4">
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
