import Link from "next/link";
import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { CTA_PRIMARY } from "@/lib/cta";
import { localePath, type Locale } from "@/i18n/config";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("common.notFound");
  return { title: t("title"), robots: { index: false } };
}

export default async function NotFound() {
  const t = await getTranslations("common.notFound");
  const locale = (await getLocale()) as Locale;
  return (
    <main id="contenido" className="mx-auto flex min-h-[70vh] max-w-xl flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="font-display text-4xl uppercase tracking-tight">{t("heading")}</h1>
      <p className="text-sm text-muted-foreground">{t("body")}</p>
      <Link href={localePath(locale)} className={`${CTA_PRIMARY} inline-flex items-center px-5 py-2.5 text-sm`}>
        {t("home")}
      </Link>
    </main>
  );
}
