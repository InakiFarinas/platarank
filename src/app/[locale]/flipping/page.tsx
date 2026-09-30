import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { isLocale, localePath, type Locale } from "@/i18n/config";
import { pageMetadata, absoluteUrl } from "@/lib/seo";
import { getFlipSeo, flipDescription, flipFaqs } from "@/lib/flip-seo";
import { FlipExplorer } from "@/components/flipping/flip-explorer";
import { SiteFooter } from "@/components/site-footer";
import { breadcrumbSchema, faqSchema, FaqList, JsonLd } from "@/components/json-ld";
import { rankFlip, FLIP_ROW_LIMIT } from "@/lib/server/flip-data";
import { loadFlipRankSnapshotShared, loadFlipMarketShared } from "@/lib/server/shared-cache";
import { DEFAULT_FLIP_PARAMS } from "@/lib/flip-math";
import { DEFAULT_FLIP_FILTERS } from "@/lib/flip-filters";

export const revalidate = 3600;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  setRequestLocale(locale);
  const seo = await getFlipSeo(locale);
  return pageMetadata({ locale, route: "flipping", title: seo.title, description: await flipDescription(locale) });
}

export default async function FlippingPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);
  const seo = await getFlipSeo(locale);

  // Precomputed by the ingester; the fallback (first deploy, before its first run) ranks live.
  const { rows, total } =
    (await loadFlipRankSnapshotShared()) ??
    rankFlip(await loadFlipMarketShared(), DEFAULT_FLIP_PARAMS, DEFAULT_FLIP_FILTERS, FLIP_ROW_LIMIT, { key: "platinumPerDay", desc: true });

  return (
    <main id="contenido" className="mx-auto max-w-[1600px] px-3 pb-4 sm:px-6 sm:pb-8 lg:px-8">
      <FlipExplorer initialRows={rows} totalCount={total} title={seo.pageTitle} description={seo.pageDescription} />
      <FlipInfo locale={locale} />
      <Footer locale={locale} />
    </main>
  );
}

async function Footer({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: "flipping" });
  return (
    <SiteFooter locale={locale} className="mt-8">
      <p className="text-xs text-muted-foreground">
        {t("page.dataCredit")}{" "}
        <a href="https://www.albion-online-data.com/" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-foreground">
          The Albion Online Data Project
        </a>
      </p>
    </SiteFooter>
  );
}

async function FlipInfo({ locale }: { locale: Locale }) {
  const seo = await getFlipSeo(locale);
  const faqs = await flipFaqs(locale);
  return (
    <>
      <JsonLd data={faqSchema(faqs)} />
      <JsonLd data={breadcrumbSchema([{ name: "PlataRank", url: absoluteUrl(localePath(locale)) }, { name: seo.pageTitle, url: absoluteUrl(localePath(locale, "flipping")) }])} />
      <section className="mt-12 max-w-3xl">
        <h2 className="font-display text-2xl uppercase tracking-tight sm:text-3xl">{seo.title}</h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{seo.intro}</p>
        <FaqList faqs={faqs} className="mt-10" />
      </section>
    </>
  );
}
