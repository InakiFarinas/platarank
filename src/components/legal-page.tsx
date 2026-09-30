import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import type { Locale } from "@/i18n/config";

const DATE_LOCALE: Record<Locale, string> = { es: "es-AR", en: "en-US", pt: "pt-BR" };

/** `updated` is an ISO date (YYYY-MM-DD); it is formatted per locale here. */
export async function LegalPage({ locale, title, updated, children }: { locale: Locale; title: string; updated: string; children: ReactNode }) {
  const t = await getTranslations({ locale, namespace: "legal" });
  const date = new Intl.DateTimeFormat(DATE_LOCALE[locale], { dateStyle: "long", timeZone: "UTC" }).format(new Date(`${updated}T00:00:00Z`));
  return (
    <>
      <SiteHeader title={title} description={t("updatedLabel", { date })} />
      <main id="contenido" className="mx-auto max-w-3xl px-3 pb-8 sm:px-6">
        <div className="space-y-4 text-sm leading-relaxed text-muted-foreground [&_a]:text-money [&_a]:underline [&_a]:underline-offset-2 [&_code]:rounded [&_code]:bg-card [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-xs [&_code]:text-foreground [&_h2]:mt-8 [&_h2]:border-t [&_h2]:border-border [&_h2]:pt-6 [&_h2]:font-heading [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-foreground [&_li]:ml-5 [&_li]:list-disc [&_strong]:text-foreground">
          {children}
        </div>
        <SiteFooter className="mt-12">
          <p className="text-xs text-muted-foreground">{t("disclaimer")}</p>
        </SiteFooter>
      </main>
    </>
  );
}
