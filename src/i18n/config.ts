export const locales = ["es", "en", "pt"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "es";

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

/** Route keys -> URL slug per locale. The folders under app/[locale] keep the Spanish names (the
 * `es` slugs); English and Portuguese URLs are rewritten to them in next.config.ts. Always build hrefs with
 * `localePath` so links, canonicals and the sitemap stay in sync with those rewrites. */
export const ROUTES = {
  alchemy: { es: "alquimia", en: "alchemy", pt: "alquimia" },
  refining: { es: "refinado", en: "refining", pt: "refino" },
  cooking: { es: "cocina", en: "cooking", pt: "culinaria" },
  gear: { es: "equipo", en: "gear", pt: "equipamento" },
  mounts: { es: "monturas", en: "mounts", pt: "montarias" },
  artifacts: { es: "artefactos", en: "artifacts", pt: "artefatos" },
  calculator: { es: "calculadora", en: "calculator", pt: "calculadora" },
  about: { es: "acerca", en: "about", pt: "sobre" },
  methodology: { es: "metodologia", en: "methodology", pt: "metodologia" },
  privacy: { es: "privacidad", en: "privacy", pt: "privacidade" },
  terms: { es: "terminos", en: "terms", pt: "termos" },
  recipe: { es: "receta", en: "recipe", pt: "receita" },
} as const;

export type RouteKey = keyof typeof ROUTES;

/** `/es`, `/en`, `/en/artifacts`, `/en/recipe/T4_BAG?x=1`. `sub` is appended verbatim (already encoded). */
export function localePath(locale: Locale, route?: RouteKey, sub?: string): string {
  if (!route) return `/${locale}`;
  return `/${locale}/${ROUTES[route][locale]}${sub ?? ""}`;
}

/** BCP 47 tag for number and date formatting (es-AR, en-US, pt-BR -- the audience's own
 * conventions: 1.234,5 in Spanish and Portuguese, 1,234.5 in English). */
export function intlLocale(locale: Locale): string {
  return locale === "en" ? "en-US" : locale === "pt" ? "pt-BR" : "es-AR";
}

/** Pick the value for a locale from a per-locale record -- the one way to branch on language in
 * code (instead of `locale === "en" ? ... : ...`, which silently gave Portuguese the Spanish). */
export function byLocale<T>(locale: Locale, values: Record<Locale, T>): T {
  return values[locale];
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
