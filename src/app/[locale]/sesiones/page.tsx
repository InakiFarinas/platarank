import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { isLocale } from "@/i18n/config";
import { pageMetadata } from "@/lib/seo";
import { SessionsView } from "@/components/sessions/sessions-view";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "sessions" });
  return pageMetadata({ locale, route: "sessions", title: t("meta.title"), index: false });
}

export default async function SesionesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "sessions" });
  return (
    <>
      <SiteHeader title={t("page.title")} description={t("page.description")} />
      <main id="contenido" className="mx-auto max-w-4xl px-3 pb-8 sm:px-6">
        <SessionsView />
        <SiteFooter locale={locale} className="mt-12">
          <p className="text-xs text-muted-foreground">{t("page.privacy")}</p>
        </SiteFooter>
      </main>
    </>
  );
}
