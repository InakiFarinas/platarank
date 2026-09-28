import { NextResponse, type NextRequest } from "next/server";
import { localePath } from "@/i18n/config";

// "/" picks the locale from Accept-Language (English browsers -> /en, Portuguese -> /pt, everyone
// else -> /es).
// Temporary redirect: the answer depends on the request header, so it must not be cached as permanent.
export function GET(request: NextRequest) {
  const preferred = request.headers.get("accept-language")?.trim().toLowerCase() ?? "";
  const locale = preferred.startsWith("en") ? "en" : preferred.startsWith("pt") ? "pt" : "es";
  const res = NextResponse.redirect(new URL(localePath(locale), request.url), 307);
  res.headers.set("Vary", "Accept-Language");
  return res;
}
