import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { isLocale } from "@/i18n/config";
import { pageMetadata } from "@/lib/seo";
import { FoundryTool } from "@/components/artifacts/foundry-tool";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { loadArtifactPools } from "@/lib/server/artifact-data";

export const revalidate = 3600;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "artifacts" });
  return pageMetadata({ locale, route: "artifacts", title: t("meta.title"), description: t("meta.description") });
}

export default async function ArtefactosPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "artifacts" });
  const pools = await loadArtifactPools();
  return (
    <>
      <SiteHeader title={t("page.title")} description={t("page.description")} />
      <main id="contenido" className="mx-auto max-w-5xl px-3 pb-8 sm:px-6">
        <FoundryTool pools={pools} />
        <SiteFooter locale={locale} className="mt-8">
          <p className="text-xs text-muted-foreground">{t("page.dataCredit")}</p>
        </SiteFooter>
      </main>
    </>
  );
}
