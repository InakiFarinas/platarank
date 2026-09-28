import { getTranslations } from "next-intl/server";
import type { Faq } from "@/components/json-ld";
import { intlLocale, type Locale } from "@/i18n/config";
import { recipeCount } from "@/lib/seo";
import type { StationType } from "@/lib/server/station-data";

export const STATION_TYPES: StationType[] = ["alchemy", "refining", "cooking", "gear", "mount"];

/** Whole number with locale thousands separators (es-AR / en-US). */
export const formatIntLocale = (n: number, locale: Locale) => Math.round(n).toLocaleString(intlLocale(locale));

type AgeT = (key: "none" | "minutes" | "hours" | "days", values?: { n: number }) => string;

/** Age of a price ("hace 3h" / "3h ago"); `t` is the `stations.age` translator. */
export function formatAgeLocale(t: AgeT, seconds: number | null): string {
  if (seconds === null) return t("none");
  const hours = seconds / 3600;
  if (hours < 1) return t("minutes", { n: Math.max(1, Math.round(seconds / 60)) });
  if (hours < 48) return t("hours", { n: Math.round(hours) });
  return t("days", { n: Math.round(hours / 24) });
}

export type StationSeo = {
  name: string;
  /** Page <title> (the site name is appended by the root template). */
  title: string;
  subject: string;
  intro: string;
  extraFaq: Faq;
  pageTitle: string;
  pageDescription: string;
};

export async function getStationSeo(type: StationType, locale: Locale): Promise<StationSeo> {
  const t = await getTranslations({ locale, namespace: "stations" });
  return {
    name: t(`names.${type}`),
    title: t(`seo.${type}.title`),
    subject: t(`seo.${type}.subject`),
    intro: t(`seo.${type}.intro`),
    extraFaq: { q: t(`seo.${type}.faqQ`), a: t(`seo.${type}.faqA`) },
    pageTitle: t(`seo.${type}.pageTitle`),
    pageDescription: t(`seo.${type}.pageDescription`),
  };
}

export async function stationDescription(type: StationType, locale: Locale): Promise<string> {
  const t = await getTranslations({ locale, namespace: "stations" });
  return t("stationDescription", { subject: t(`seo.${type}.subject`), count: formatIntLocale(recipeCount(type), locale) });
}

export async function stationFaqs(type: StationType, locale: Locale): Promise<Faq[]> {
  const t = await getTranslations({ locale, namespace: "stations" });
  const s = await getStationSeo(type, locale);
  return [
    { q: t("commonFaq.silverPerDayQ"), a: t("commonFaq.silverPerDayA") },
    s.extraFaq,
    { q: t("commonFaq.sourcesQ"), a: t("commonFaq.sourcesA") },
  ];
}
