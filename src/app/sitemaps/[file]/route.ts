import { SITEMAP_FILES, sitemapFile } from "@/lib/server/sitemap";

// One sitemap file per station (only recipes whose page is indexable) plus the fixed pages, rebuilt
// hourly from the same shared market data the rankings read (no extra database reads).
export const revalidate = 3600;
export const dynamicParams = false;

export function generateStaticParams() {
  return SITEMAP_FILES.map((f) => ({ file: `${f}.xml` }));
}

export async function GET(_request: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params;
  const xml = await sitemapFile(file.replace(/\.xml$/, ""));
  if (!xml) return new Response("Not found", { status: 404 });
  return new Response(xml, { headers: { "Content-Type": "application/xml; charset=utf-8" } });
}
