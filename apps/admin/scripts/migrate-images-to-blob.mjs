// One-off migration: moves the repo images referenced by the CMS content to
// Vercel Blob, so every site image is visible and manageable on the Media
// page in production. Uploads keep their readable filenames, and the stored
// content is rewritten to the new blob URLs.
//
// Run from apps/admin:  node scripts/migrate-images-to-blob.mjs
import { readFileSync } from "node:fs";
import { basename, extname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { upload } from "@vercel/blob/client";

const API = "https://strandhager-api.vercel.app";
const WEB_PUBLIC = fileURLToPath(new URL("../../web/public", import.meta.url));

// The logo is referenced from code (e-mails, PDF letterhead), so it stays.
const KEEP = new Set(["/images/logo.png"]);

const TYPES = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".avif": "image/avif",
};

const sections = await (await fetch(`${API}/site-content`)).json();

const referenced = [
  ...new Set(
    [...JSON.stringify(sections).matchAll(/\/images\/[^"\\]+/g)].map((m) => m[0]),
  ),
].filter((path) => !KEEP.has(path));

console.log(`${referenced.length} images to migrate\n`);

const map = new Map();

for (const path of referenced) {
  const name = basename(path);
  const bytes = readFileSync(join(WEB_PUBLIC, path));
  const file = new File([bytes], name, { type: TYPES[extname(name).toLowerCase()] });

  try {
    const blob = await upload(`uploads/${name}`, file, {
      access: "public",
      handleUploadUrl: `${API}/media/client-upload`,
    });
    map.set(path, blob.url);
    console.log(`ok      ${path} -> ${blob.url}`);
  } catch (error) {
    console.error(`FAILED  ${path}: ${error.message}`);
  }
}

let updated = 0;
for (const [key, value] of Object.entries(sections)) {
  const before = JSON.stringify(value);
  let after = before;
  for (const [from, to] of map) {
    after = after.replaceAll(`"${from}"`, `"${to}"`);
  }
  if (after === before) continue;

  const response = await fetch(`${API}/site-content/${key}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data: JSON.parse(after) }),
  });
  if (!response.ok) {
    throw new Error(`PUT ${key} failed: ${response.status} ${await response.text()}`);
  }
  updated += 1;
  console.log(`updated section: ${key}`);
}

// Verify nothing except the intentionally kept files still points at the repo.
const final = await (await fetch(`${API}/site-content`)).json();
const leftovers = [
  ...new Set(
    [...JSON.stringify(final).matchAll(/\/images\/[^"\\]+/g)].map((m) => m[0]),
  ),
].filter((path) => !KEEP.has(path));

console.log(`\nDone: ${map.size} uploaded, ${updated} sections updated.`);
console.log(
  leftovers.length === 0
    ? "No repo image references left (besides the logo)."
    : `Still referencing repo files: ${leftovers.join(", ")}`,
);
