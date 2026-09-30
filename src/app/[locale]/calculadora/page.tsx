import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { pageMetadata } from "@/lib/seo";
import { breadcrumbSchema, JsonLd } from "@/components/json-ld";
import { absoluteUrl } from "@/lib/seo";
import { isLocale, localePath } from "@/i18n/config";
import { Calculator } from "@/components/calculator/calculator";
import { CommunitySponsors } from "@/components/community-sponsors";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "calculator.meta" });
  return pageMetadata({ locale, route: "calculator", title: t("title"), description: t("description") });
}

export default async function CalculadoraPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "calculator.meta" });
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebApplication",
          name: t("appName"),
          url: absoluteUrl(localePath(locale, "calculator")),
          applicationCategory: "GameApplication",
          operatingSystem: "Web",
          inLanguage: locale,
          description: t("appDescription"),
          offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
        }}
      />
      <JsonLd
        data={breadcrumbSchema([
          { name: "PlataRank", url: absoluteUrl(localePath(locale)) },
          { name: t("breadcrumb"), url: absoluteUrl(localePath(locale, "calculator")) },
        ])}
      />
      <SiteHeader title={t("headerTitle")} description={t("headerDescription")} />
      <main id="contenido" className="mx-auto max-w-5xl px-3 pb-24 sm:px-6 lg:pb-8">
        <Calculator />
        <section className="mt-12 border-t border-border pt-10">
          <CommunitySponsors />
        </section>
        <SiteFooter locale={locale} className="mt-8">
          <p className="text-xs text-muted-foreground">{t("dataSource")}</p>
        </SiteFooter>
      </main>
    </>
  );
}
