/**
 * Creates a dashboard user. Forwards to the API script that writes AdminUser.
 *
 * Usage, from the repo root:
 *   node apps/admin/scripts/create-admin.mjs deg@eksempel.no "passordet" "Fullt Navn"
 */
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const script = join(dirname(fileURLToPath(import.meta.url)), "../../api/scripts/create-admin.mjs");
const result = spawnSync(process.execPath, [script, ...process.argv.slice(2)], {
  stdio: "inherit",
});
process.exit(result.status ?? 1);
