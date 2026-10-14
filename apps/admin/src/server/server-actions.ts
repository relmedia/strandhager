"use server";

import { cookies } from "next/headers";

import { PREFERENCE_DEFAULTS, type PreferenceKey } from "@/lib/preferences/preferences-config";

/**
 * Server actions are public endpoints – anything exported from a "use server"
 * file can be called with any arguments. So this only ever writes the
 * dashboard's own preference cookies, and only short plain values: it must
 * never become a way to overwrite the session cookie or plant something else.
 */
const PREFERENCE_KEYS = new Set<string>(Object.keys(PREFERENCE_DEFAULTS));
const SAFE_VALUE = /^[A-Za-z0-9_-]{1,40}$/;

export async function setValueToCookie(
  key: PreferenceKey,
  value: string,
  options: { path?: string; maxAge?: number } = {},
): Promise<void> {
  if (!PREFERENCE_KEYS.has(key) || !SAFE_VALUE.test(value)) return;

  const cookieStore = await cookies();
  cookieStore.set(key, value, {
    path: options.path ?? "/",
    maxAge: options.maxAge ?? 60 * 60 * 24 * 7, // default: 7 days
    sameSite: "lax",
  });
}

export async function getPreference<T extends string>(key: string, allowed: readonly T[], fallback: T): Promise<T> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(key);
  const value = cookie ? cookie.value.trim() : undefined;
  return allowed.includes(value as T) ? (value as T) : fallback;
}
