import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { LegalPage } from "@/components/legal-page";
import { isLocale } from "@/i18n/config";
import { pageMetadata } from "@/lib/seo";
import Es from "./content/es";
import En from "./content/en";
import Pt from "./content/pt";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "legal" });
  return pageMetadata({ locale, route: "privacy", title: t("privacy.title"), description: t("privacy.description") });
}

export default async function PrivacidadPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "legal" });
  return (
    <LegalPage locale={locale} title={t("privacy.heading")} updated={t("privacy.updated")}>
      {{ es: <Es />, en: <En />, pt: <Pt /> }[locale]}
    </LegalPage>
  );
}
