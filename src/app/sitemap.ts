import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";
import { defaultLocale, localePath, locales, type RouteKey } from "@/i18n/config";
import recipesJson from "@/data/generated/recipes.json";

// Ranking pages change with every hourly ingest; the calculator and legal pages are near-static.
const ROUTE_LIST: { route?: RouteKey; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"]; priority: number; live?: boolean; lastModified?: string }[] = [
  { changeFrequency: "hourly", priority: 1, live: true },
  { route: "alchemy", changeFrequency: "hourly", priority: 0.9, live: true },
  { route: "refining", changeFrequency: "hourly", priority: 0.9, live: true },
  { route: "cooking", changeFrequency: "hourly", priority: 0.9, live: true },
  { route: "gear", changeFrequency: "hourly", priority: 0.9, live: true },
  { route: "mounts", changeFrequency: "hourly", priority: 0.9, live: true },
  { route: "artifacts", changeFrequency: "hourly", priority: 0.8, live: true },
  { route: "calculator", changeFrequency: "weekly", priority: 0.8 },
  { route: "about", changeFrequency: "yearly", priority: 0.3, lastModified: "2026-09-27" },
  { route: "methodology", changeFrequency: "monthly", priority: 0.6, lastModified: "2026-09-27" },
  { route: "privacy", changeFrequency: "yearly", priority: 0.2, lastModified: "2026-09-19" },
  { route: "terms", changeFrequency: "yearly", priority: 0.2, lastModified: "2026-09-19" },
];

const alternates = (route?: RouteKey, sub?: string) => ({
  languages: { ...Object.fromEntries(locales.map((l) => [l, `${SITE_URL}${localePath(l, route, sub)}`])), "x-default": `${SITE_URL}${localePath(defaultLocale, route, sub)}` },
});

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const pages = ROUTE_LIST.flatMap((r) =>
    locales.map((locale) => ({
      url: `${SITE_URL}${localePath(locale, r.route)}`,
      lastModified: r.live ? now : r.lastModified,
      changeFrequency: r.changeFrequency,
      priority: r.priority,
      alternates: alternates(r.route),
    })),
  );
  // One page per recipe (rendered on demand, refreshed hourly like the rankings).
  const items = (recipesJson as { itemId: string }[]).flatMap((r) => {
    const sub = `/${encodeURIComponent(r.itemId)}`;
    return locales.map((locale) => ({
      url: `${SITE_URL}${localePath(locale, "recipe", sub)}`,
      lastModified: now,
      changeFrequency: "daily" as const,
      priority: 0.5,
      alternates: alternates("recipe", sub),
    }));
  });
  return [...pages, ...items];
}
