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
    route: "refining",
    title: (await getStationSeo("refining", locale)).title,
    description: await stationDescription("refining", locale),
  });
}

export default async function RefinadoPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);
  const seo = await getStationSeo("refining", locale);
  return <RecipePage stationType="refining" locale={locale} title={seo.pageTitle} description={seo.pageDescription} />;
}
