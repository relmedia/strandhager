"use server";

import { redirect } from "next/navigation";

import { AUTH_LOGIN_PATH } from "@/lib/auth";
import { isAllowedEmail } from "@/lib/auth/allowlist";
import { auth } from "@/lib/auth/server";

function mapAuthError(error: { message?: string; code?: string } | null | undefined) {
  const message = error?.message || "";
  const code = error?.code || "";

  if (
    message === "Not Found" ||
    message.includes("404") ||
    code.includes("NETWORK") ||
    message.toLowerCase().includes("fetch failed")
  ) {
    return "Kan ikke nå Neon Auth. Sjekk NEON_AUTH_BASE_URL i apps/admin/.env.local.";
  }

  if (
    message.toLowerCase().includes("unauthorized") ||
    message.toLowerCase().includes("invalid email or password") ||
    code === "UNAUTHORIZED"
  ) {
    return "Feil e-post eller passord.";
  }

  return message || "Feil e-post eller passord.";
}

export async function signInWithEmail(formData: FormData) {
  if (!process.env.NEON_AUTH_BASE_URL) {
    return {
      error:
        "NEON_AUTH_BASE_URL mangler. Kopier Auth URL fra Neon Console → Project → Branch → Auth → Configuration.",
    };
  }

  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!isAllowedEmail(email)) {
    return { error: "Denne e-postadressen har ikke tilgang til dashbordet." };
  }

  const { error } = await auth.signIn.email({
    email,
    password,
  });

  if (error) {
    return { error: mapAuthError(error) };
  }

  return { error: null };
}

export async function signUpWithEmail(formData: FormData) {
  if (!process.env.NEON_AUTH_BASE_URL) {
    return {
      error:
        "NEON_AUTH_BASE_URL mangler. Kopier Auth URL fra Neon Console → Project → Branch → Auth → Configuration.",
    };
  }

  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const name = String(formData.get("name") ?? email.split("@")[0] ?? "Admin");

  const { error } = await auth.signUp.email({
    email,
    password,
    name,
  });

  if (error) {
    return { error: mapAuthError(error) || "Kunne ikke opprette konto." };
  }

  // Some projects require verified email before sign-in; attempt sign-in immediately.
  const signIn = await auth.signIn.email({ email, password });
  if (signIn.error) {
    return {
      error:
        mapAuthError(signIn.error) ||
        "Konto opprettet, men innlogging feilet. Prøv å logge inn manuelt.",
    };
  }

  return { error: null };
}

export async function logout() {
  await auth.signOut();
  redirect(AUTH_LOGIN_PATH);
}

export async function requireSession() {
  const { data: session } = await auth.getSession();

  if (!session?.user) {
    redirect(AUTH_LOGIN_PATH);
  }

  return session;
}

export async function getOptionalSession() {
  const { data: session } = await auth.getSession();
  return session;
}
