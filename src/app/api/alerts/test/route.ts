import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const WEBHOOK_PATTERN = /^https:\/\/(discord|discordapp)\.com\/api\/webhooks\/[0-9]+\/[A-Za-z0-9_-]+$/;

// Best-effort per-instance cooldown so the button can't be used to hammer a webhook until Discord
// rate-limits or removes it. (Serverless instances don't share memory; it still stops a stuck loop.)
const COOLDOWN_MS = 30_000;
const lastSent = new Map<string, number>();

/** Sends a test message to the signed-in user's saved Discord webhook. The URL is read from the
 * user's own row (RLS) and re-validated, so this can only ever post to a Discord webhook. */
export async function POST() {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const userId = userData.user.id;
  const now = Date.now();
  const wait = (lastSent.get(userId) ?? 0) + COOLDOWN_MS - now;
  if (wait > 0) {
    return NextResponse.json({ error: "cooldown" }, { status: 429, headers: { "Retry-After": String(Math.ceil(wait / 1000)) } });
  }
  lastSent.set(userId, now);
  if (lastSent.size > 1000) lastSent.delete(lastSent.keys().next().value as string);

  const { data } = await supabase.from("user_settings").select("discord_webhook_url").maybeSingle();
  const url = data?.discord_webhook_url as string | null | undefined;
  if (!url || !WEBHOOK_PATTERN.test(url)) return NextResponse.json({ error: "no_webhook" }, { status: 400 });

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: "PlataRank",
      content: "Prueba de PlataRank: los avisos de ganancia van a llegar a este canal.",
      allowed_mentions: { parse: [] },
    }),
    redirect: "error",
    signal: AbortSignal.timeout(8000),
  }).catch(() => null);

  if (!res?.ok) return NextResponse.json({ error: "discord_rejected" }, { status: 502 });
  return NextResponse.json({ ok: true });
}
