/**
 * Reconcile `profiles.is_admin` against the ADMIN_EMAILS env var.
 *
 * Usage:
 *   npx tsx scripts/sync-admin-flags.ts
 *
 * What it does:
 *   1. Reads ADMIN_EMAILS from .env.local
 *   2. Pulls every profile from Supabase
 *   3. Sets is_admin=true for any profile whose email is in the list (and
 *      doesn't already have it set)
 *   4. Clears is_admin=false for any profile whose email is NOT in the list
 *      but currently has is_admin=true
 *   5. Logs every change it makes
 *
 * Use this whenever you edit ADMIN_EMAILS so existing profiles sync without
 * waiting for those users to sign in again.
 *
 * Requires SUPABASE_SECRET_KEY (or SUPABASE_SERVICE_ROLE_KEY) to be set.
 */

// Load .env.local — Node 22+ has this built in. Older Node will need dotenv.
import { config as loadEnv } from "dotenv";
loadEnv({ path: ".env.local" });
loadEnv({ path: ".env" });

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SECRET_KEY =
  process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

function die(msg: string): never {
  console.error(`✗ ${msg}`);
  process.exit(1);
}

if (!SUPABASE_URL) die("NEXT_PUBLIC_SUPABASE_URL is missing");
if (!SECRET_KEY) die("SUPABASE_SECRET_KEY (or SUPABASE_SERVICE_ROLE_KEY) is missing");

console.log(`Admin emails (${ADMIN_EMAILS.length}):`);
for (const e of ADMIN_EMAILS) console.log(`  • ${e}`);
console.log();

const supabase = createClient(SUPABASE_URL, SECRET_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

type ProfileRow = { id: string; email: string; is_admin: boolean };

async function main(): Promise<void> {
  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("id, email, is_admin");

  if (error) die(error.message);
  const rows = (profiles ?? []) as ProfileRow[];
  console.log(`Found ${rows.length} profile${rows.length === 1 ? "" : "s"}.\n`);

  const toGrant: ProfileRow[] = [];
  const toRevoke: ProfileRow[] = [];

  for (const p of rows) {
    const shouldBe = ADMIN_EMAILS.includes((p.email ?? "").toLowerCase());
    if (shouldBe && !p.is_admin) toGrant.push(p);
    else if (!shouldBe && p.is_admin) toRevoke.push(p);
  }

  if (toGrant.length === 0 && toRevoke.length === 0) {
    console.log("✓ All profiles are already in sync. Nothing to do.");
    return;
  }

  for (const p of toGrant) {
    const { error: e } = await supabase
      .from("profiles")
      .update({ is_admin: true })
      .eq("id", p.id);
    if (e) console.error(`✗ Grant failed for ${p.email}: ${e.message}`);
    else console.log(`+ Granted admin: ${p.email}`);
  }

  for (const p of toRevoke) {
    const { error: e } = await supabase
      .from("profiles")
      .update({ is_admin: false })
      .eq("id", p.id);
    if (e) console.error(`✗ Revoke failed for ${p.email}: ${e.message}`);
    else console.log(`- Revoked admin: ${p.email}`);
  }

  console.log(`\n✓ Sync complete. Granted ${toGrant.length}, revoked ${toRevoke.length}.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
