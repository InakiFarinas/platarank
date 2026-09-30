import { SITE_URL } from "@/lib/seo";
import { defaultLocale, localePath, locales, type RouteKey } from "@/i18n/config";
import { computeRecipeRow, DEFAULT_PARAMS, type RecipeRow } from "@/lib/recipe-math";
import { loadStationDataShared } from "@/lib/server/shared-cache";
import type { StationType } from "@/lib/server/station-data";

// The sitemap, split so no file is huge (the single one listed every recipe x 3 locales: 21k URLs,
// 14 MB) and so it only lists what the pages themselves let search engines index.

/** A recipe page is indexable only when it has the whole story to tell -- the same test its own
 * metadata uses to decide `noindex` (src/app/[locale]/receta/[itemId]/page.tsx). */
export function isIndexableRow(row: RecipeRow): boolean {
  return row.hasData && row.costPerUnit !== null && row.profitPerUnit !== null && row.sellRefPrice !== null;
}

export const SITEMAP_STATIONS: StationType[] = ["alchemy", "refining", "cooking", "gear", "mount"];
export const SITEMAP_FILES = ["pages", ...SITEMAP_STATIONS] as const;

type Entry = { route?: RouteKey; sub?: string; lastModified?: string };

// Ranking pages change with every hourly ingest; the rest carries the date it last really changed.
const PAGES: Entry[] = [
  {},
  { route: "alchemy" },
  { route: "refining" },
  { route: "cooking" },
  { route: "gear" },
  { route: "mounts" },
  { route: "artifacts" },
  { route: "flipping" },
  { route: "calculator" },
  { route: "about", lastModified: "2026-09-27" },
  { route: "methodology", lastModified: "2026-09-29" },
  { route: "privacy", lastModified: "2026-09-19" },
  { route: "terms", lastModified: "2026-09-19" },
];

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function urlset(entries: Entry[]): string {
  const urls = entries.flatMap((e) => {
    const alternates = locales
      .map((l) => `<xhtml:link rel="alternate" hreflang="${l}" href="${esc(SITE_URL + localePath(l, e.route, e.sub))}"/>`)
      .concat(`<xhtml:link rel="alternate" hreflang="x-default" href="${esc(SITE_URL + localePath(defaultLocale, e.route, e.sub))}"/>`)
      .join("");
    return locales.map(
      (l) => `<url><loc>${esc(SITE_URL + localePath(l, e.route, e.sub))}</loc>${e.lastModified ? `<lastmod>${e.lastModified}</lastmod>` : ""}${alternates}</url>`,
    );
  });
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls.join("\n")}\n</urlset>\n`;
}

/** One sitemap file: the fixed pages, or one station's indexable recipes. */
export async function sitemapFile(file: string): Promise<string | null> {
  if (file === "pages") return urlset(PAGES);
  if (!(SITEMAP_STATIONS as string[]).includes(file)) return null;
  // Same hourly shared market data the ranking pages read: no extra database reads.
  const data = await loadStationDataShared(file as StationType);
  const market = new Map(Object.entries(data.marketByItem));
  const entries = data.recipes
    .filter((r) => isIndexableRow(computeRecipeRow(r, market, DEFAULT_PARAMS)))
    .map((r): Entry => ({ route: "recipe", sub: `/${encodeURIComponent(r.itemId)}` }));
  return urlset(entries);
}

export function sitemapIndex(): string {
  const items = SITEMAP_FILES.map((f) => `<sitemap><loc>${SITE_URL}/sitemaps/${f}.xml</loc></sitemap>`).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${items}\n</sitemapindex>\n`;
}
