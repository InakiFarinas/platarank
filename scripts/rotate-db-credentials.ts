// Switches production from the all-powerful `postgres` connection to two least-privilege roles
// (created by supabase/least-privilege.sql):
//   platarank_web     read-only market data      -> Vercel DATABASE_URL + GitHub DATABASE_URL_READONLY
//   platarank_ingest  ingester + alert checker   -> GitHub DATABASE_URL
//
// Default is a dry run that only checks the plan. `--apply` sets fresh random passwords, verifies
// each role can do exactly what it should BEFORE touching any secret, then updates Vercel and
// GitHub. Passwords are never printed or written to disk.
//
//   pnpm tsx scripts/rotate-db-credentials.ts            # dry run
//   pnpm tsx scripts/rotate-db-credentials.ts --apply    # do it
import "dotenv/config";
import { randomBytes } from "node:crypto";
import { spawnSync } from "node:child_process";
import postgres from "postgres";

const apply = process.argv.includes("--apply");

const adminUrl = process.env.DATABASE_URL;
if (!adminUrl) throw new Error("DATABASE_URL is not set (it must be the current postgres connection).");
const parsed = new URL(adminUrl);
const projectRef = decodeURIComponent(parsed.username).split(".")[1];
if (!projectRef || !parsed.username.startsWith("postgres.")) {
  throw new Error("Expected the current DATABASE_URL to be the `postgres.<ref>` pooler user; refusing to guess.");
}

const urlFor = (role: string, password: string, port: string) =>
  `postgresql://${role}.${projectRef}:${encodeURIComponent(password)}@${parsed.hostname}:${port}${parsed.pathname}`;

const password = () => randomBytes(24).toString("base64url");

function run(cmd: string, args: string[], input: string) {
  const r = spawnSync(cmd, args, { input, encoding: "utf8", shell: true });
  if (r.status !== 0) throw new Error(`${cmd} ${args.slice(0, 3).join(" ")} failed: ${(r.stderr || r.stdout).trim().slice(0, 300)}`);
}

async function verify(label: string, url: string, expectations: { sql: string; ok: boolean }[]) {
  const c = postgres(url, { prepare: false, max: 1, connect_timeout: 20 });
  try {
    for (const e of expectations) {
      let allowed = true;
      try {
        await c.unsafe(e.sql);
      } catch {
        allowed = false;
      }
      if (allowed !== e.ok) throw new Error(`${label}: "${e.sql}" was ${allowed ? "allowed" : "denied"} but should be ${e.ok ? "allowed" : "denied"}`);
    }
    console.log(`  ok  ${label}`);
  } finally {
    await c.end({ timeout: 5 });
  }
}

async function main() {
  console.log(`Project ${projectRef} (${parsed.hostname})`);
  const webPw = password();
  const ingestPw = password();

  if (!apply) {
    console.log("Dry run: would set new passwords for platarank_web and platarank_ingest, verify them, then update");
    console.log("  - Vercel   production DATABASE_URL          -> platarank_web (port 6543)");
    console.log("  - GitHub   secret DATABASE_URL              -> platarank_ingest (port 5432)");
    console.log("  - GitHub   secret DATABASE_URL_READONLY     -> platarank_web (port 6543)");
    console.log("Re-run with --apply to execute.");
    return;
  }

  const admin = postgres(adminUrl!, { prepare: false, max: 1, connect_timeout: 20 });
  try {
    await admin.unsafe(`alter role platarank_web with password '${webPw}'`);
    await admin.unsafe(`alter role platarank_ingest with password '${ingestPw}'`);
  } finally {
    await admin.end({ timeout: 5 });
  }

  const webUrl = urlFor("platarank_web", webPw, "6543");
  const webSessionUrl = urlFor("platarank_web", webPw, "5432");
  const ingestUrl = urlFor("platarank_ingest", ingestPw, "5432");

  console.log("Verifying the new roles before touching any secret:");
  await verify("platarank_web    (read market data, nothing else)", webSessionUrl, [
    { sql: "select count(*) from public.recipes", ok: true },
    { sql: "select count(*) from public.market_aggregates", ok: true },
    { sql: "update public.recipes set name_es = name_es where item_id = '__none__'", ok: false },
    { sql: "select count(*) from public.plans", ok: false },
    { sql: "select count(*) from public.user_settings", ok: false },
    { sql: "select count(*) from public.ingest_state", ok: false },
  ]);
  await verify("platarank_ingest (write market data, read alert inputs)", ingestUrl, [
    { sql: "select count(*) from public.alerts", ok: true },
    { sql: "select count(*) from public.plans", ok: true },
    { sql: "select count(*) from public.user_settings", ok: true },
    { sql: "update public.market_aggregates set price = price where item_id = '__none__'", ok: true },
    { sql: "update public.alerts set last_error = last_error where id = '00000000-0000-0000-0000-000000000000'", ok: true },
    { sql: "delete from public.plans where id = '00000000-0000-0000-0000-000000000000'", ok: false },
    { sql: "delete from public.alerts where id = '00000000-0000-0000-0000-000000000000'", ok: false },
  ]);

  console.log("Updating secrets:");
  run("vercel", ["env", "rm", "DATABASE_URL", "production", "--yes"], "");
  run("vercel", ["env", "add", "DATABASE_URL", "production"], webUrl);
  console.log("  ok  Vercel production DATABASE_URL");
  run("gh", ["secret", "set", "DATABASE_URL"], ingestUrl);
  console.log("  ok  GitHub DATABASE_URL (ingest)");
  run("gh", ["secret", "set", "DATABASE_URL_READONLY"], webUrl);
  console.log("  ok  GitHub DATABASE_URL_READONLY");

  console.log("\nDone. Next: redeploy (git push or `vercel deploy --prod`), run the ingest workflow once,");
  console.log("then rotate the old postgres password in Supabase (Settings -> Database) and update your local .env.");
}

main().catch((err) => {
  console.error(String(err.message ?? err));
  process.exit(1);
});
