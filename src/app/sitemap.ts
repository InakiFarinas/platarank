import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";
import recipesJson from "@/data/generated/recipes.json";

// Ranking pages change with every hourly ingest; the calculator and legal pages are near-static.
const ROUTES: { path: string; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"]; priority: number; live?: boolean; lastModified?: string }[] = [
  { path: "", changeFrequency: "hourly", priority: 1, live: true },
  { path: "/alquimia", changeFrequency: "hourly", priority: 0.9, live: true },
  { path: "/refinado", changeFrequency: "hourly", priority: 0.9, live: true },
  { path: "/cocina", changeFrequency: "hourly", priority: 0.9, live: true },
  { path: "/equipo", changeFrequency: "hourly", priority: 0.9, live: true },
  { path: "/monturas", changeFrequency: "hourly", priority: 0.9, live: true },
  { path: "/calculadora", changeFrequency: "weekly", priority: 0.8 },
  { path: "/acerca", changeFrequency: "yearly", priority: 0.3, lastModified: "2026-09-27" },
  { path: "/metodologia", changeFrequency: "monthly", priority: 0.6, lastModified: "2026-09-27" },
  { path: "/privacidad", changeFrequency: "yearly", priority: 0.2, lastModified: "2026-09-19" },
  { path: "/terminos", changeFrequency: "yearly", priority: 0.2, lastModified: "2026-09-19" },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const pages = ROUTES.map((r) => ({
    url: `${SITE_URL}/es${r.path}`,
    lastModified: r.live ? now : r.lastModified,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }));
  // One page per recipe (rendered on demand, refreshed hourly like the rankings).
  const items = (recipesJson as { itemId: string }[]).map((r) => ({
    url: `${SITE_URL}/es/receta/${encodeURIComponent(r.itemId)}`,
    lastModified: now,
    changeFrequency: "daily" as const,
    priority: 0.5,
  }));
  return [...pages, ...items];
}
