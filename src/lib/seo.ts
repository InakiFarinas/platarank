import type { Metadata } from "next";
import recipesJson from "@/data/generated/recipes.json";

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://platarank.vercel.app";
export const SITE_NAME = "PlataRank";
export const DISCORD_URL = "https://discord.gg/ZZRcGSEXeh";

/** Recipe count for a station, from the bundled game data (no DB read), so meta descriptions never go stale. */
export function recipeCount(stationType: string): number {
  return (recipesJson as { stationType: string }[]).filter((r) => r.stationType === stationType).length;
}

/** Per-page metadata with its own canonical, Open Graph and Twitter fields (child pages otherwise
 * inherit the generic root ones, including a missing og:url). */
export function pageMetadata({
  title,
  description,
  path,
  index = true,
}: {
  title: string;
  description?: string;
  path: string;
  index?: boolean;
}): Metadata {
  return {
    title,
    ...(description ? { description } : {}),
    alternates: { canonical: path },
    ...(index ? {} : { robots: { index: false } }),
    openGraph: { title: `${title} -- ${SITE_NAME}`, ...(description ? { description } : {}), url: path, siteName: SITE_NAME, type: "website", locale: "es_AR" },
    twitter: { card: "summary_large_image", title: `${title} -- ${SITE_NAME}`, ...(description ? { description } : {}), images: ["/opengraph-image"] },
  };
}

export function absoluteUrl(path: string): string {
  return `${SITE_URL}${path}`;
}
