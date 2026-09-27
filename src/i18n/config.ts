export const locales = ["es", "en"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "es";

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

/** Route keys -> URL slug per locale. The folders under app/[locale] keep the Spanish names (the
 * `es` slugs); English URLs are rewritten to them in next.config.ts. Always build hrefs with
 * `localePath` so links, canonicals and the sitemap stay in sync with those rewrites. */
export const ROUTES = {
  alchemy: { es: "alquimia", en: "alchemy" },
  refining: { es: "refinado", en: "refining" },
  cooking: { es: "cocina", en: "cooking" },
  gear: { es: "equipo", en: "gear" },
  mounts: { es: "monturas", en: "mounts" },
  artifacts: { es: "artefactos", en: "artifacts" },
  calculator: { es: "calculadora", en: "calculator" },
  about: { es: "acerca", en: "about" },
  methodology: { es: "metodologia", en: "methodology" },
  privacy: { es: "privacidad", en: "privacy" },
  terms: { es: "terminos", en: "terms" },
  recipe: { es: "receta", en: "recipe" },
} as const;

export type RouteKey = keyof typeof ROUTES;

/** `/es`, `/en`, `/en/artifacts`, `/en/recipe/T4_BAG?x=1`. `sub` is appended verbatim (already encoded). */
export function localePath(locale: Locale, route?: RouteKey, sub?: string): string {
  if (!route) return `/${locale}`;
  return `/${locale}/${ROUTES[route][locale]}${sub ?? ""}`;
}

/** Route key for a station type (StationType in server/station-data.ts). */
export function stationRoute(type: "alchemy" | "refining" | "cooking" | "gear" | "mount"): RouteKey {
  return type === "mount" ? "mounts" : type;
}

/** The same page in another locale, from a visible pathname like `/en/recipe/T4_BAG`. Unknown
 * paths fall back to the target locale's home. */
export function switchLocalePath(pathname: string, target: Locale): string {
  const [, current, slug, ...rest] = pathname.split("/");
  if (!current || !isLocale(current)) return localePath(target);
  if (!slug) return localePath(target);
  const key = (Object.keys(ROUTES) as RouteKey[]).find((k) => ROUTES[k][current] === slug);
  return key ? localePath(target, key, rest.length ? `/${rest.join("/")}` : "") : localePath(target);
}
