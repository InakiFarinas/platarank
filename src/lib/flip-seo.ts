import { getTranslations } from "next-intl/server";
import type { Faq } from "@/components/json-ld";
import { intlLocale, type Locale } from "@/i18n/config";
import { FLIP_ITEMS } from "@/lib/flip-items";

/** Whole number with locale thousands separators (es-AR / en-US / pt-BR). */
export const formatIntLocale = (n: number, locale: Locale) => Math.round(n).toLocaleString(intlLocale(locale));

export type FlipSeo = {
  title: string;
  pageTitle: string;
  pageDescription: string;
  intro: string;
};

/** Same shape as station-seo.ts's `getStationSeo`, but flipping is one fixed page (no station
 * param) -- everything lives in its own "flipping" namespace instead of `stations.seo.<type>`. */
export async function getFlipSeo(locale: Locale): Promise<FlipSeo> {
  const t = await getTranslations({ locale, namespace: "flipping" });
  return {
    title: t("seo.title"),
    pageTitle: t("seo.pageTitle"),
    pageDescription: t("seo.pageDescription"),
    intro: t("seo.intro", { count: formatIntLocale(FLIP_ITEMS.length, locale) }),
  };
}

export async function flipDescription(locale: Locale): Promise<string> {
  const t = await getTranslations({ locale, namespace: "flipping" });
  return t("seo.metaDescription", { count: formatIntLocale(FLIP_ITEMS.length, locale) });
}

export async function flipFaqs(locale: Locale): Promise<Faq[]> {
  const t = await getTranslations({ locale, namespace: "flipping" });
  return [
    { q: t("seo.faq1Q"), a: t("seo.faq1A") },
    { q: t("seo.faq2Q"), a: t("seo.faq2A") },
    { q: t("seo.faq3Q"), a: t("seo.faq3A") },
  ];
}
