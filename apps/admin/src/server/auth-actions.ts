"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { AUTH_LOGIN_PATH } from "@/lib/auth";
import { isAllowedEmail } from "@/lib/auth/allowlist";
import { readSession, SESSION_COOKIE, type AdminSession } from "@/lib/auth/session";
import { API_URL } from "@/lib/api";

const WEEK = 60 * 60 * 24 * 7;
const MONTH = 60 * 60 * 24 * 30;

type LoginStart =
  | { ok: false; error: string }
  | {
      ok: true;
      challengeId: string;
      emailed: boolean;
      code?: string;
      mailError?: string;
    }
  /** Two-factor is off for this user: the login finished in one step. */
  | { ok: true; done: true; mustChangePassword: boolean };

type LoginFinish = { error: string | null; mustChangePassword?: boolean };

export async function startLogin(
  email: string,
  password: string,
  remember: boolean,
): Promise<LoginStart> {
  const trimmed = email.trim().toLowerCase();

  if (!isAllowedEmail(trimmed)) {
    return { ok: false, error: "Denne e-postadressen har ikke tilgang til dashbordet." };
  }

  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: trimmed, password }),
    });

    const body = await response.json().catch(() => null);

    if (!response.ok) {
      return { ok: false, error: readMessage(body, "Feil e-post eller passord.") };
    }

    // The user has turned off the one-time code, so the token comes right away.
    if (typeof body.accessToken === "string") {
      await setSessionCookie(body.accessToken, remember);
      return { ok: true, done: true, mustChangePassword: body.mustChangePassword === true };
    }

    return {
      ok: true,
      challengeId: body.challengeId,
      emailed: Boolean(body.emailed),
      ...(typeof body.code === "string" ? { code: body.code } : {}),
      ...(typeof body.mailError === "string" ? { mailError: body.mailError } : {}),
    };
  } catch {
    return { ok: false, error: "Kan ikke nå innloggingstjenesten. Sjekk at API-et kjører." };
  }
}

export async function verifyLogin(
  challengeId: string,
  code: string,
  remember: boolean,
): Promise<LoginFinish> {
  try {
    const response = await fetch(`${API_URL}/auth/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ challengeId, code: code.trim() }),
    });

    const body = await response.json().catch(() => null);

    if (!response.ok) {
      return { error: readMessage(body, "Feil kode. Prøv igjen.") };
    }

    await setSessionCookie(body.accessToken, remember);

    return { error: null, mustChangePassword: body.mustChangePassword === true };
  } catch {
    return { error: "Kan ikke nå innloggingstjenesten. Sjekk at API-et kjører." };
  }
}

export type AdminUserRow = {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  mustChangePassword: boolean;
  twoFactorEnabled: boolean;
};

export async function listAdminUsers(): Promise<AdminUserRow[]> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return [];

  try {
    const response = await fetch(`${API_URL}/auth/users`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!response.ok) return [];
    return (await response.json()) as AdminUserRow[];
  } catch {
    return [];
  }
}

export async function changePassword(
  currentPassword: string,
  newPassword: string,
): Promise<{ error: string | null }> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) {
    return { error: "Du er ikke logget inn. Logg inn på nytt." };
  }

  try {
    const response = await fetch(`${API_URL}/auth/change-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ currentPassword, newPassword }),
    });

    const body = await response.json().catch(() => null);

    if (!response.ok) {
      return { error: readMessage(body, "Klarte ikke å bytte passordet.") };
    }

    // The API returns a fresh token without the must-change flag.
    if (typeof body?.accessToken === "string") {
      await setSessionCookie(body.accessToken, false);
    }

    return { error: null };
  } catch {
    return { error: "Kan ikke nå innloggingstjenesten. Sjekk at API-et kjører." };
  }
}

export type InviteResult =
  | { ok: false; error: string }
  | {
      ok: true;
      emailed: boolean;
      tempPassword?: string;
      mailError?: string;
      allowlisted: boolean;
    };

export async function inviteAdminUser(name: string, email: string): Promise<InviteResult> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) {
    return { ok: false, error: "Du er ikke logget inn. Logg inn på nytt." };
  }

  try {
    const response = await fetch(`${API_URL}/auth/users`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name: name.trim(), email: email.trim().toLowerCase() }),
    });

    const body = await response.json().catch(() => null);

    if (!response.ok) {
      return { ok: false, error: readMessage(body, "Klarte ikke å opprette brukeren.") };
    }

    return {
      ok: true,
      emailed: Boolean(body.emailed),
      ...(typeof body.tempPassword === "string" ? { tempPassword: body.tempPassword } : {}),
      ...(typeof body.mailError === "string" ? { mailError: body.mailError } : {}),
      // The env allowlist is a separate gate; warn when it would block the login.
      allowlisted: isAllowedEmail(email.trim().toLowerCase()),
    };
  } catch {
    return { ok: false, error: "Kan ikke nå innloggingstjenesten. Sjekk at API-et kjører." };
  }
}

/** Turns the one-time e-mail code at login on or off for the signed-in user. */
export async function setTwoFactorLogin(enabled: boolean): Promise<{ error: string | null }> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) {
    return { error: "Du er ikke logget inn. Logg inn på nytt." };
  }

  try {
    const response = await fetch(`${API_URL}/auth/two-factor`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ enabled }),
    });

    const body = await response.json().catch(() => null);

    if (!response.ok) {
      return { error: readMessage(body, "Klarte ikke å endre innstillingen.") };
    }

    return { error: null };
  } catch {
    return { error: "Kan ikke nå innloggingstjenesten. Sjekk at API-et kjører." };
  }
}

export async function deleteAdminUser(id: string): Promise<{ error: string | null }> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) {
    return { error: "Du er ikke logget inn. Logg inn på nytt." };
  }

  try {
    const response = await fetch(`${API_URL}/auth/users/${encodeURIComponent(id)}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    const body = await response.json().catch(() => null);

    if (!response.ok) {
      return { error: readMessage(body, "Klarte ikke å slette brukeren.") };
    }

    return { error: null };
  } catch {
    return { error: "Kan ikke nå innloggingstjenesten. Sjekk at API-et kjører." };
  }
}

export async function logout() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
  redirect(AUTH_LOGIN_PATH);
}

export async function getSession(): Promise<AdminSession | null> {
  const store = await cookies();
  return readSession(store.get(SESSION_COOKIE)?.value);
}

async function setSessionCookie(token: string, remember: boolean) {
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: remember ? MONTH : WEEK,
  });
}

function readMessage(body: unknown, fallback: string): string {
  if (body && typeof body === "object" && "message" in body) {
    const { message } = body as { message: unknown };
    if (typeof message === "string" && message.trim()) return message;
    if (Array.isArray(message) && typeof message[0] === "string") return message[0];
  }
  return fallback;
}
