/**
 * Create (or update) a dashboard login user via the Supabase Admin API.
 *
 * Usage (from apps/dashboard):
 *   node --env-file=.env.local scripts/create-user.mjs <email> <password>
 *
 * The user is created already email-confirmed so they can log in immediately.
 */
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secret = process.env.SUPABASE_SECRET_KEY;

if (!url || !secret) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY in .env.local");
  process.exit(1);
}

const [email, password] = process.argv.slice(2);

if (!email || !password) {
  console.error("Usage: node --env-file=.env.local scripts/create-user.mjs <email> <password>");
  process.exit(1);
}

const supabase = createClient(url, secret, { auth: { persistSession: false } });

const { data, error } = await supabase.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
});

if (!error) {
  console.log(`Created user: ${data.user.email} (${data.user.id})`);
  process.exit(0);
}

// User already exists: reset its password so it can log in.
if (error.message.toLowerCase().includes("already")) {
  const existing = await findUserByEmail(supabase, email);
  if (!existing) {
    console.error("User exists but could not be found to update.");
    process.exit(1);
  }
  const { error: updateError } = await supabase.auth.admin.updateUserById(existing.id, {
    password,
    email_confirm: true,
  });
  if (updateError) {
    console.error("Failed to update password:", updateError.message);
    process.exit(1);
  }
  console.log(`Updated password for existing user: ${email} (${existing.id})`);
  process.exit(0);
}

console.error("Failed to create user:", error.message);
process.exit(1);

async function findUserByEmail(client, targetEmail) {
  const target = targetEmail.toLowerCase();
  for (let page = 1; page <= 50; page++) {
    const { data: list, error: listError } = await client.auth.admin.listUsers({ page, perPage: 200 });
    if (listError) throw listError;
    const match = list.users.find((u) => u.email?.toLowerCase() === target);
    if (match) return match;
    if (list.users.length < 200) break;
  }
  return null;
}
