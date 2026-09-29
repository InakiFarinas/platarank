import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { faqSchema, FaqList, JsonLd, type Faq } from "@/components/json-ld";
import { DISCORD_URL, pageMetadata } from "@/lib/seo";
import { ArrowRight, CheckCircle2, TrendingUp } from "lucide-react";
import { formatSilver } from "@/components/recipes/format";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { CTA_PRIMARY, CTA_SECONDARY } from "@/lib/cta";
import { CommunitySponsors } from "@/components/community-sponsors";
import { itemIconUrl } from "@/lib/item-icons";
import { itemName } from "@/lib/item-names";
import { isLocale, localePath, stationRoute, type Locale } from "@/i18n/config";
import { formatAgeLocale, formatIntLocale, STATION_TYPES } from "@/lib/station-seo";
import type { TopRecipe } from "@/lib/server/top-recipes";
import { loadTopRecipesShared } from "@/lib/server/shared-cache";
import { recipeCounts } from "@/lib/recipes-data";
import type { StationType } from "@/lib/server/station-data";

// The ranking preview is live data: refresh it on the same cadence as the ranking pages.
export const revalidate = 3600;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "home" });
  return pageMetadata({ locale, title: t("title"), description: t("description") });
}

async function loadLive(): Promise<{ top: TopRecipe[]; counts: Record<string, number> }> {
  try {
    return { top: await loadTopRecipesShared(5), counts: recipeCounts() };
  } catch {
    // The page must still render if the database is unreachable; it just loses the live block.
    return { top: [], counts: {} };
  }
}


/** The #1 recipe's own arithmetic, one unit at a time, so the headline number can be checked by hand. */
async function HowItAdds({ row, locale }: { row: TopRecipe["row"]; locale: Locale }) {
  if (row.costPerUnit === null || row.sellRefPrice === null || row.revenuePerUnitNet === null || row.profitPerUnit === null) return null;
  const t = await getTranslations({ locale, namespace: "home.how" });
  const r = row.recipe;
  const fmt = (n: number) => formatIntLocale(n, locale);
  const lines: { label: string; value: string; total?: boolean }[] = [
    { label: t("cost"), value: fmt(row.costPerUnit) },
    { label: t("sell"), value: fmt(row.sellRefPrice) },
    { label: t("net"), value: fmt(row.revenuePerUnitNet) },
    { label: t("profit"), value: fmt(row.profitPerUnit), total: true },
    { label: t("volume", { share: Math.round(row.marketSharePct * 100) }), value: fmt(row.avgDailyVolume30d) },
  ];
  return (
    <div className="overflow-hidden rounded-sm border border-border bg-card">
      <h3 className="border-b border-border px-4 py-2.5 font-heading text-sm">
        {t("heading", { name: `${itemName(r, locale)} T${r.tier}${r.enchant > 0 ? `.${r.enchant}` : ""}` })}
      </h3>
      <dl className="space-y-1.5 px-4 py-3 text-sm">
        {lines.map((l) => (
          <div key={l.label} className={`flex items-baseline justify-between gap-3 ${l.total ? "border-t border-border pt-1.5 font-medium" : ""}`}>
            <dt className={l.total ? "" : "text-muted-foreground"}>{l.label}</dt>
            <dd className="font-mono tabular-nums">{l.value}</dd>
          </div>
        ))}
        <div className="flex items-baseline justify-between gap-3 border-t-2 border-double border-money/30 pt-2">
          <dt className="font-heading text-base">{t("perDay")}</dt>
          <dd className="font-mono text-lg tabular-nums text-money">{fmt(row.platinumPerDay ?? 0)}</dd>
        </div>
      </dl>
    </div>
  );
}

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  if (!isLocale(rawLocale)) notFound();
  const locale: Locale = rawLocale;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "home" });
  const ts = await getTranslations({ locale, namespace: "stations" });
  const fmt = (n: number) => formatIntLocale(n, locale);
  const faqs: Faq[] = [
    { q: t("faq.whatIsQ"), a: t("faq.whatIsA") },
    { q: t("faq.silverPerDayQ"), a: t("faq.silverPerDayA") },
    { q: t("faq.whatToCraftQ"), a: t("faq.whatToCraftA") },
    { q: t("faq.sourcesQ"), a: t("faq.sourcesA") },
    { q: t("faq.officialQ"), a: t("faq.officialA") },
  ];
  const capabilities = t.raw("capabilities") as string[];
  const stationName = (type: string) => ts(`names.${type as StationType}`);

  const { top, counts } = await loadLive();
  const totalRecipes = Object.values(counts).reduce((a, b) => a + b, 0);
  const best = top[0];
  const oldestAge = top.length > 0 ? Math.max(...top.map((x) => x.row.sellRefAgeSeconds ?? 0)) : null;
  const rankingHref = best ? localePath(locale, stationRoute(best.row.recipe.stationType as StationType)) : localePath(locale, "alchemy");
  const label = (r: { tier: number; enchant: number; nameEs: string; nameEn?: string | null; namePt?: string | null }) =>
    `${itemName(r, locale)} T${r.tier}${r.enchant > 0 ? `.${r.enchant}` : ""}`;

  return (
    <>
      <JsonLd data={faqSchema(faqs)} />
      <SiteHeader />
      <main id="contenido">
        <section className="relative overflow-hidden border-b border-money/20">
          <Image src="/hero.webp" alt="" fill priority sizes="100vw" className="object-cover object-[75%_center]" />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-background/10 sm:via-background/70 sm:to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/40" />

          <div className="relative mx-auto max-w-6xl px-3 py-20 sm:px-6 sm:py-28 lg:px-8">
            <div className="max-w-lg">
              <h1 className="font-display text-4xl uppercase leading-[1.05] tracking-tight sm:text-6xl">
                {t.rich("hero.title", { money: (c) => <span className="text-money">{c}</span> })}
              </h1>
              <p className="mt-5 max-w-md text-sm text-foreground/85 sm:text-base">{t("hero.body")}</p>
              <div className="mt-7 flex flex-wrap items-center gap-4">
                <Link
                  href={rankingHref}
                  className={`${CTA_PRIMARY} inline-flex min-h-11 items-center gap-2 px-5 text-sm outline outline-1 outline-offset-[3px] outline-money/40`}
                >
                  <TrendingUp className="h-4 w-4" />
                  {t("hero.viewRecipes")}
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href={localePath(locale, "calculator")}
                  className={`${CTA_SECONDARY} inline-flex min-h-11 items-center gap-2 px-5 text-sm`}
                >
                  {t("hero.openCalc")}
                </Link>
              </div>
              <p className="mt-8 border-t border-money/20 pt-4 text-xs text-muted-foreground">
                {totalRecipes > 0 ? t("hero.recipes", { count: fmt(totalRecipes) }) : ""}
                {t("hero.stats")}
                <a href={DISCORD_URL} target="_blank" rel="noopener noreferrer" className="text-money underline underline-offset-2">
                  {t("hero.discord")}
                </a>
              </p>
            </div>
          </div>
        </section>

        <section className="border-b border-border px-3 py-14 sm:px-6 sm:py-20 lg:px-8">
          <div className="mx-auto grid max-w-6xl grid-cols-1 items-start gap-10 lg:grid-cols-2">
            <div>
              <h2 className="font-display text-2xl uppercase tracking-tight sm:text-3xl">{t("top.heading")}</h2>
              <p className="mt-3 text-sm text-muted-foreground sm:text-base">{t("top.intro")}</p>
              {best && (
                <p className="mt-3 text-sm sm:text-base">
                  {t.rich("top.best", {
                    b: (c) => <strong>{c}</strong>,
                    name: label(best.row.recipe),
                    station: stationName(best.row.recipe.stationType).toLocaleLowerCase(locale),
                    perDay: formatSilver(best.row.platinumPerDay),
                  })}
                </p>
              )}
              <ul className="mt-5 space-y-2.5">
                {capabilities.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-money" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-4">
            {top.length > 0 && (
              <div className="overflow-hidden rounded-sm border-2 border-double border-money/30 bg-card">
                <div className="flex items-baseline justify-between gap-3 border-b-2 border-double border-money/30 bg-money/5 px-4 py-3">
                  <h3 className="font-heading text-sm">{t("top.listHeading")}</h3>
                  <span className="text-xs text-muted-foreground">{t("top.listNote")}</span>
                </div>
                <ul className="divide-y divide-border">
                  {top.map(({ row }) => {
                    const r = row.recipe;
                    return (
                      <li key={r.itemId}>
                        <Link
                          href={localePath(locale, "recipe", `/${encodeURIComponent(r.itemId)}`)}
                          className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-money/5"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={itemIconUrl(r.itemId, 1, 64)} alt="" width={40} height={40} className="h-10 w-10 shrink-0" />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm">{label(r)}</span>
                            <span className="block text-xs text-muted-foreground">
                              {t("top.meta", {
                                station: stationName(r.stationType),
                                margin: row.marginPct === null ? "--" : `${Math.round(row.marginPct * 100)}%`,
                                volume: formatSilver(row.avgDailyVolume30d),
                              })}
                            </span>
                          </span>
                          <span className="shrink-0 text-right font-mono text-sm tabular-nums text-money">{formatSilver(row.platinumPerDay)}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
                <p className="border-t border-border px-4 py-2 text-xs text-muted-foreground">
                  {t("top.tap", { age: formatAgeLocale((k, v) => ts(`age.${k}`, v), oldestAge) })}
                </p>
              </div>
            )}

            {best && <HowItAdds row={best.row} locale={locale} />}
            </div>
          </div>
        </section>

        <section className="border-b border-money/20 bg-money/[0.03] px-3 py-14 sm:px-6 sm:py-20 lg:px-8">
          <div className="mx-auto max-w-3xl">
            <h2 className="font-display text-2xl uppercase tracking-tight sm:text-3xl">{t("stations.heading")}</h2>
            <ul className="mt-6 divide-y divide-border rounded-sm border border-border bg-card">
              {STATION_TYPES.map((type) => (
                <li key={type}>
                  <Link href={localePath(locale, stationRoute(type))} className="group flex items-center gap-4 px-4 py-3.5 transition-colors hover:bg-money/5">
                    <span className="min-w-0 flex-1">
                      <span className="block font-display text-base uppercase tracking-tight">{stationName(type)}</span>
                      <span className="block text-xs text-muted-foreground">{t(`stationNotes.${type}`)}</span>
                    </span>
                    {counts[type] !== undefined && (
                      <span className="shrink-0 font-mono text-xs tabular-nums text-muted-foreground">
                        {t("stations.recipes", { count: fmt(counts[type]) })}
                      </span>
                    )}
                    <ArrowRight className="h-4 w-4 shrink-0 text-money transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="border-b border-border px-3 py-14 sm:px-6 sm:py-20 lg:px-8">
          <div className="mx-auto max-w-3xl">
            <h2 className="font-display text-2xl uppercase tracking-tight sm:text-3xl">{t("discord.heading")}</h2>
            <p className="mt-3 text-sm text-muted-foreground sm:text-base">{t("discord.body")}</p>
            <div className="mt-6 flex flex-wrap gap-4">
              <a
                href={DISCORD_URL}
                target="_blank"
                rel="noopener noreferrer"
                className={`${CTA_PRIMARY} inline-flex min-h-11 items-center gap-2 px-5 text-sm`}
              >
                {t("discord.join")}
                <ArrowRight className="h-4 w-4" />
              </a>
              <Link
                href={localePath(locale, "methodology")}
                className="inline-flex min-h-11 items-center rounded-sm border border-border px-5 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {t("discord.methodology")}
              </Link>
            </div>
          </div>
        </section>

        <section className="border-b border-border px-3 py-14 sm:px-6 sm:py-20 lg:px-8">
          <div className="mx-auto max-w-3xl">
            <CommunitySponsors />
          </div>
        </section>

        <section className="border-b border-border px-3 py-14 sm:px-6 sm:py-20 lg:px-8">
          <FaqList faqs={faqs} className="mx-auto max-w-3xl" />
        </section>

        <SiteFooter className="px-3 py-8 sm:px-6 lg:px-8" containerClassName="mx-auto max-w-6xl">
          <p className="text-xs text-muted-foreground">
            {t("footer.dataFrom")}{" "}
            <a
              href="https://www.albion-online-data.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 hover:text-foreground"
            >
              Albion Online Data Project
            </a>{" "}
            {t("footer.rest")}
          </p>
          <p className="text-xs text-muted-foreground">{t("footer.disclaimer")}</p>
        </SiteFooter>
      </main>
    </>
  );
}
