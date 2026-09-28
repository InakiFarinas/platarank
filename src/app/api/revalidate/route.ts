import { timingSafeEqual } from "node:crypto";
import { revalidateTag } from "next/cache";
import { NextResponse, type NextRequest } from "next/server";

// Called by the hourly ingest (.github/workflows/ingest.yml) right after it stores new prices: drops
// the shared market cache (src/lib/server/shared-cache.ts) and, through its tag, the ISR pages built
// from it, so fresh prices show up within minutes of the ingest instead of up to an hour later. It
// adds no egress: the next visit re-reads each slice once, which the hourly expiry did anyway.
export const dynamic = "force-dynamic";

function authorized(request: NextRequest): boolean {
  const secret = process.env.REVALIDATE_SECRET;
  if (!secret) return false;
  const given = Buffer.from(request.headers.get("authorization") ?? "");
  const expected = Buffer.from(`Bearer ${secret}`);
  return given.length === expected.length && timingSafeEqual(given, expected);
}

export async function POST(request: NextRequest) {
  if (!authorized(request)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  revalidateTag("market");
  return NextResponse.json({ revalidated: true });
}
