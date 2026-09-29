import { sitemapIndex } from "@/lib/server/sitemap";

// Sitemap index: points at one file for the fixed pages and one per station (src/lib/server/sitemap.ts).
export const dynamic = "force-static";

export function GET() {
  return new Response(sitemapIndex(), { headers: { "Content-Type": "application/xml; charset=utf-8" } });
}
