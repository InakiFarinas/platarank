import type { Metadata } from "next";
import { defaultLocale, localePath, locales, type Locale, type RouteKey } from "@/i18n/config";
import recipesJson from "@/data/generated/recipes.json";

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://platarank.vercel.app";
export const SITE_NAME = "PlataRank";
export const DISCORD_URL = "https://discord.gg/ZZRcGSEXeh";

/** Recipe count for a station, from the bundled game data (no DB read), so meta descriptions never go stale. */
export function recipeCount(stationType: string): number {
  return (recipesJson as { stationType: string }[]).filter((r) => r.stationType === stationType).length;
}

/** Per-locale social image (app/[locale]/opengraph-image.tsx). Set explicitly because a page-level
 * openGraph object replaces the one the file convention injects. */
export const ogImage = (locale: Locale) => [{ url: `/${locale}/opengraph-image/og`, width: 1200, height: 630 }];

export const OG_LOCALE: Record<Locale, string> = { es: "es_AR", en: "en_US", pt: "pt_BR" };

/** Per-page metadata with its own canonical, hreflang alternates, Open Graph and Twitter fields
 * (child pages otherwise inherit the generic root ones, including a missing og:url). `route` +
 * `sub` identify the page independent of locale (e.g. route "recipe", sub "/T4_BAG"). */
export function pageMetadata({
  locale,
  route,
  sub,
  title,
  description,
  index = true,
}: {
  locale: Locale;
  route?: RouteKey;
  sub?: string;
  title: string;
  description?: string;
  index?: boolean;
}): Metadata {
  const path = localePath(locale, route, sub);
  return {
    title,
    ...(description ? { description } : {}),
    alternates: {
      canonical: path,
      languages: { ...Object.fromEntries(locales.map((l) => [l, localePath(l, route, sub)])), "x-default": localePath(defaultLocale, route, sub) },
    },
    ...(index ? {} : { robots: { index: false } }),
    openGraph: { title: `${title} -- ${SITE_NAME}`, ...(description ? { description } : {}), url: path, siteName: SITE_NAME, type: "website", locale: OG_LOCALE[locale], images: ogImage(locale) },
    twitter: { card: "summary_large_image", title: `${title} -- ${SITE_NAME}`, ...(description ? { description } : {}), images: ogImage(locale) },
  };
}

export function absoluteUrl(path: string): string {
  return `${SITE_URL}${path}`;
}
