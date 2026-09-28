import Link from "next/link";
import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { CTA_PRIMARY } from "@/lib/cta";
import { localePath, type Locale } from "@/i18n/config";
import { SITE_NAME } from "@/lib/seo";

// Static on purpose: Next resolves not-found metadata outside the [locale] layout, where
// setRequestLocale hasn't run, so getTranslations() there made next-intl read headers() -- the
// wrong language (always Spanish) on real 404s, and a 500 ("Page changed from static to dynamic at
// runtime") when the first segment isn't a locale ("/hero.png"). The title is rendered below instead.
export const metadata: Metadata = { robots: { index: false } };

export default async function NotFound() {
  const t = await getTranslations("common.notFound");
  const locale = (await getLocale()) as Locale;
  return (
    <>
      <title>{`${t("title")} -- ${SITE_NAME}`}</title>
      <main id="contenido" className="mx-auto flex min-h-[70vh] max-w-xl flex-col items-center justify-center gap-4 px-6 text-center">
        <h1 className="font-display text-4xl uppercase tracking-tight">{t("heading")}</h1>
        <p className="text-sm text-muted-foreground">{t("body")}</p>
        <Link href={localePath(locale)} className={`${CTA_PRIMARY} inline-flex items-center px-5 py-2.5 text-sm`}>
          {t("home")}
        </Link>
      </main>
    </>
  );
}
