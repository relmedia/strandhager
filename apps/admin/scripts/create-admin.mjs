/**
 * Creates an admin user with a password in Neon Auth, since the Neon console
 * can only create passwordless users that cannot log in to the dashboard.
 *
 * Usage, from the repo root:
 *   node apps/admin/scripts/create-admin.mjs deg@eksempel.no "passordet" "Fullt Navn"
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const [email, password, name] = process.argv.slice(2);

if (!email || !password) {
  console.error('Bruk: node apps/admin/scripts/create-admin.mjs <e-post> <passord> ["Fullt Navn"]');
  process.exit(1);
}

if (password.length < 8) {
  console.error("Passordet må være minst 8 tegn.");
  process.exit(1);
}

// The auth URL lives in apps/admin/.env.local (or the environment).
let baseUrl = process.env.NEON_AUTH_BASE_URL;
if (!baseUrl) {
  const envFile = join(dirname(fileURLToPath(import.meta.url)), "..", ".env.local");
  const match = readFileSync(envFile, "utf8").match(/NEON_AUTH_BASE_URL="?([^"\r\n]+)"?/);
  baseUrl = match?.[1];
}

if (!baseUrl) {
  console.error("Fant ikke NEON_AUTH_BASE_URL i apps/admin/.env.local eller miljøet.");
  process.exit(1);
}

const response = await fetch(`${baseUrl}/sign-up/email`, {
  method: "POST",
  // Neon Auth insists on an Origin header for browser-style sign-ups.
  headers: { "Content-Type": "application/json", Origin: "http://localhost:3001" },
  body: JSON.stringify({
    email,
    password,
    name: name || email.split("@")[0],
  }),
});

const body = await response.json().catch(() => null);

if (!response.ok) {
  console.error(`Neon Auth svarte ${response.status}:`, body?.message ?? body);
  process.exit(1);
}

console.log(`Bruker opprettet: ${body?.user?.email ?? email}`);
console.log("Du kan nå logge inn på admin-siden med denne e-posten og passordet.");
