import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

const ROUTES = ["", "/alquimia", "/refinado", "/cocina", "/equipo"];

export default function sitemap(): MetadataRoute.Sitemap {
  return ROUTES.map((route) => ({
    url: `${SITE_URL}/es${route}`,
    changeFrequency: "hourly",
    priority: route === "" ? 1 : 0.8,
  }));
}
