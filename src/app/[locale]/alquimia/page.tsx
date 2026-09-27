import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { isLocale } from "@/i18n/config";
import { pageMetadata } from "@/lib/seo";
import { getStationSeo, stationDescription } from "@/lib/station-seo";
import { RecipePage } from "@/components/recipes/recipe-page";

export const revalidate = 3600;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  setRequestLocale(locale);
  return pageMetadata({
    locale,
    route: "alchemy",
    title: (await getStationSeo("alchemy", locale)).title,
    description: await stationDescription("alchemy", locale),
  });
}

export default async function AlquimiaPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);
  const seo = await getStationSeo("alchemy", locale);
  return <RecipePage stationType="alchemy" locale={locale} title={seo.pageTitle} description={seo.pageDescription} />;
}
