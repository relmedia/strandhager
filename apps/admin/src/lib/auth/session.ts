import { jwtVerify, type JWTPayload } from "jose";

export const SESSION_COOKIE = "admin_token";

export type AdminSession = {
  id: string;
  email: string;
  name: string;
  /** The user logged in with a temporary password and must pick a new one. */
  mustChangePassword: boolean;
};

function secret() {
  const value = process.env.AUTH_JWT_SECRET;
  if (!value) {
    throw new Error("AUTH_JWT_SECRET mangler. Sett den i apps/admin/.env.local.");
  }
  return new TextEncoder().encode(value);
}

export async function readSession(token: string | undefined): Promise<AdminSession | null> {
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, secret());
    return fromPayload(payload);
  } catch {
    return null;
  }
}

function fromPayload(payload: JWTPayload): AdminSession | null {
  const id = typeof payload.sub === "string" ? payload.sub : null;
  const email = typeof payload.email === "string" ? payload.email : null;
  const name = typeof payload.name === "string" ? payload.name : email?.split("@")[0];
  if (!id || !email || !name) return null;
  return { id, email, name, mustChangePassword: payload.mustChangePassword === true };
}
