import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { LegalPage } from "@/components/legal-page";
import { JsonLd } from "@/components/json-ld";
import { isLocale, localePath } from "@/i18n/config";
import { absoluteUrl, pageMetadata } from "@/lib/seo";
import Es from "./content/es";
import En from "./content/en";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "legal" });
  return pageMetadata({ locale, route: "methodology", title: t("methodology.title"), description: t("methodology.description") });
}

export default async function MetodologiaPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "legal" });
  return (
    <LegalPage locale={locale} title={t("methodology.heading")} updated={t("methodology.updated")}>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "TechArticle",
          headline: t("methodology.title"),
          url: absoluteUrl(localePath(locale, "methodology")),
          inLanguage: locale,
          dateModified: t("methodology.updated"),
          author: { "@id": absoluteUrl("/#organization") },
          publisher: { "@id": absoluteUrl("/#organization") },
        }}
      />
      {locale === "es" ? <Es /> : <En />}
    </LegalPage>
  );
}
