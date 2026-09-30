import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowDown, ArrowUp } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { breadcrumbSchema, faqSchema, FaqList, JsonLd, type Faq } from "@/components/json-ld";
import { formatSilver, qualityLabel } from "@/components/recipes/format";
import { CITY_THEMES } from "@/lib/city-theme";
import type { Location } from "@/lib/aodp/cities";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { CTA_PRIMARY, CTA_SECONDARY } from "@/lib/cta";
import { isLocale, localePath, stationRoute, type Locale } from "@/i18n/config";
import { itemIconUrl } from "@/lib/item-icons";
import { itemName } from "@/lib/item-names";
import { absoluteUrl, pageMetadata } from "@/lib/seo";
import { loadItemRow } from "@/lib/server/item-data";
import { isIndexableRow } from "@/lib/server/sitemap";
import { formatAgeLocale, formatIntLocale } from "@/lib/station-seo";
import type { StationType } from "@/lib/server/station-data";
import recipesJson from "@/data/generated/recipes.json";

// Rendered on first visit and then refreshed hourly, like the rankings; not pre-built (6k+ items).
export const revalidate = 3600;
export const dynamicParams = true;
export function generateStaticParams() {
  return [];
}

type Params = { locale: string; itemId: string };
type Variant = { itemId: string; tier: number; enchant: number };

const tierless = (id: string) => id.replace(/^T[0-9]+_/, "");

function itemLabel(r: { nameEs: string; nameEn?: string | null; namePt?: string | null; tier: number; enchant: number }, locale: Locale) {
  return `${itemName(r, locale)} T${r.tier}${r.enchant > 0 ? `.${r.enchant}` : ""}`;
}

function variantsOf(baseItemId: string, itemId: string): Variant[] {
  const suffix = tierless(baseItemId);
  return (recipesJson as (Variant & { baseItemId: string })[])
    .filter((v) => tierless(v.baseItemId) === suffix && v.itemId !== itemId)
    .sort((a, b) => a.tier - b.tier || a.enchant - b.enchant);
}

function pct(v: number | null) {
  return v === null ? "--" : `${Math.round(v * 100)}%`;
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { locale, itemId: raw } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "stations.recipe" });
  const row = await loadItemRow(decodeURIComponent(raw));
  if (!row) return { title: t("notFound"), robots: { index: false } };
  const r = row.recipe;
  const sub = `/${encodeURIComponent(r.itemId)}`;
  const label = itemLabel(r, locale);
  const title = t("title", { label });
  // Same test the sitemap uses to list it (src/lib/server/sitemap.ts).
  if (!isIndexableRow(row) || row.costPerUnit === null || row.profitPerUnit === null || row.sellRefPrice === null) {
    return pageMetadata({ locale, route: "recipe", sub, title, index: false });
  }
  const description = t("metaDescription", {
    label,
    cost: formatIntLocale(row.costPerUnit, locale),
    sell: formatIntLocale(row.sellRefPrice, locale),
    profit: formatIntLocale(row.profitPerUnit, locale),
    margin: pct(row.marginPct),
    perDay: formatSilver(row.platinumPerDay),
  });
  return pageMetadata({ locale, route: "recipe", sub, title, description });
}

export default async function RecipeItemPage({ params }: { params: Promise<Params> }) {
  const { locale, itemId: raw } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "stations.recipe" });
  const ts = await getTranslations({ locale, namespace: "stations" });
  // Reuses the ranking row's own derivation strings (quality breakdown, discarded outliers) so this
  // page shows exactly the same "trust the derivation" detail instead of a shorter, inconsistent copy.
  const tr = await getTranslations({ locale, namespace: "rankingUi.row" });
  // Reuses the Foundry's own gain/loss sr-only copy for the verdict block below, instead of
  // inventing a second "gana"/"pierde" pair.
  const tf = await getTranslations({ locale, namespace: "artifacts.foundry" });
  const DISCARD_REASONS = ["outlier_low", "outlier_high", "outlier_self"];
  const row = await loadItemRow(decodeURIComponent(raw));
  if (!row) notFound();

  const fmt = (n: number) => formatIntLocale(n, locale);
  const r = row.recipe;
  const label = itemLabel(r, locale);
  const stationType = r.stationType as StationType;
  const stationName = ts(`names.${stationType}`);
  const variants = variantsOf(r.baseItemId, r.itemId);
  const path = localePath(locale, "recipe", `/${encodeURIComponent(r.itemId)}`);
  const calcHref = `${localePath(locale, "calculator")}?item=${encodeURIComponent(r.itemId)}`;
  const stationHref = localePath(locale, stationRoute(stationType));

  const cost = row.costPerUnit;
  const sell = row.sellRefPrice;
  const profit = row.profitPerUnit;
  const priced = row.hasData && cost !== null && sell !== null && profit !== null;

  const faqs: Faq[] = priced
    ? [
        {
          q: t("faqCostQ", { label }),
          a: t("faqCostA", {
            cost: fmt(cost),
            returnNote: row.returnRatePct > 0 ? t("returnNote", { rate: row.returnRatePct.toFixed(1) }) : "",
          }),
        },
        {
          q: t("faqProfitQ", { label }),
          a: t("faqProfitA", {
            profitable: profit > 0 ? "yes" : "no",
            profit: fmt(profit),
            margin: pct(row.marginPct),
            perDay: formatSilver(row.platinumPerDay),
            volume: formatSilver(row.avgDailyVolume30d),
            share: Math.round(row.marketSharePct * 100),
          }),
        },
        { q: t("faqAssumptionsQ"), a: t("faqAssumptionsA") },
      ]
    : [];

  const b = (c: React.ReactNode) => <strong>{c}</strong>;

  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: "PlataRank", url: absoluteUrl(localePath(locale)) },
          { name: stationName, url: absoluteUrl(stationHref) },
          { name: label, url: absoluteUrl(path) },
        ])}
      />
      {faqs.length > 0 && <JsonLd data={faqSchema(faqs)} />}
      <SiteHeader title={label} description={t("headerDescription", { station: stationName })} />
      <main id="contenido" className="mx-auto max-w-4xl px-3 pb-8 sm:px-6">
        <div className="flex items-start gap-4">
          <Image src={itemIconUrl(r.itemId, 1, 128)} alt={label} width={96} height={96} unoptimized className="h-24 w-24 shrink-0" />
          <div className="min-w-0 text-sm leading-relaxed sm:text-base">
            {priced ? (
              <p>
                {t.rich("summary", {
                  b,
                  label,
                  margin: pct(row.marginPct),
                  age: formatAgeLocale((k, v) => ts(`age.${k}`, v), row.sellRefAgeSeconds),
                })}
              </p>
            ) : (
              <p>{t.rich("noData", { b, label })}</p>
            )}
            {priced && (
              <div
                className={`mt-3 inline-flex items-center gap-2 rounded-md border-2 border-double px-3 py-2 ${
                  profit >= 0 ? "border-money/30 bg-money/5" : "border-destructive/30 bg-destructive/5"
                }`}
              >
                <span className="text-xs text-muted-foreground">{t("silverPerDay")}</span>
                <span className={`inline-flex items-center gap-1 font-mono text-xl font-semibold tabular-nums ${profit >= 0 ? "text-money" : "text-destructive"}`}>
                  {profit >= 0 ? <ArrowUp className="h-4 w-4" aria-hidden="true" /> : <ArrowDown className="h-4 w-4" aria-hidden="true" />}
                  <span className="sr-only">{profit >= 0 ? tf("gains") : tf("loses")}</span>
                  {formatSilver(row.platinumPerDay ?? 0)}
                </span>
              </div>
            )}
            <div className="mt-4 flex flex-wrap gap-3">
              <Link href={calcHref} className={`${CTA_PRIMARY} inline-flex min-h-11 items-center px-4 text-sm`}>
                {t("openCalc")}
              </Link>
              <Link href={stationHref} className={`${CTA_SECONDARY} inline-flex min-h-11 items-center px-4 text-sm`}>
                {t("stationRanking", { station: stationName.toLocaleLowerCase(locale) })}
              </Link>
            </div>
          </div>
        </div>

        {priced && (
          <section className="mt-10">
            <h2 className="font-display text-2xl uppercase tracking-tight">{t("howHeading")}</h2>
            <div className="mt-4 max-w-md rounded-md border border-border bg-card/40 p-4">
              <dl className="space-y-1.5 text-sm">
                {(
                  [
                    [t("costPerUnit"), fmt(cost), false],
                    [t("sellPrice"), fmt(sell), false],
                    [t("netRevenue"), fmt(row.revenuePerUnitNet ?? 0), false],
                    [t("profitPerUnit"), fmt(profit), true],
                    [t("dailyVolume"), fmt(row.avgDailyVolume30d), false],
                    [t("silverPerDay"), fmt(row.platinumPerDay ?? 0), true],
                    [tr("marketShare"), `${Math.round(row.marketSharePct * 100)}%`, false],
                  ] as const
                ).map(([k, v, tone]) => (
                  <div key={k} className="flex items-baseline justify-between gap-3">
                    <dt className="text-muted-foreground">{k}</dt>
                    <dd className={`font-mono tabular-nums ${tone ? (profit >= 0 ? "text-money" : "text-destructive") : ""}`}>{v}</dd>
                  </div>
                ))}
              </dl>
              {row.qualityBreakdown && (
                <div className="mt-4 text-sm">
                  <h3 className="mb-1 font-medium text-foreground">{tr("byQuality")}</h3>
                  <ul className="space-y-0.5">
                    {row.qualityBreakdown.map((q) => (
                      <li
                        key={q.quality}
                        className={`flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5 ${q.liquid ? "" : "opacity-70"}`}
                      >
                        <span className="text-muted-foreground">{qualityLabel(q.quality, locale)}</span>
                        <span
                          className={`ml-auto shrink-0 font-mono tabular-nums ${q.liquid ? "" : "underline decoration-dashed decoration-muted-foreground underline-offset-4"}`}
                        >
                          {q.price !== null ? tr("silverAmount", { value: formatSilver(q.price) }) : tr("noDataShort")}
                          {!q.liquid && tr("noLiquidity")}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {row.discarded.length > 0 && (
                <div className="mt-4 text-sm">
                  <h3 className="mb-1 font-medium text-foreground">{tr("discarded")}</h3>
                  <ul className="space-y-0.5">
                    {row.discarded.map((d, i) => (
                      <li key={i} className="text-muted-foreground">
                        <span className={CITY_THEMES[d.city as Location]?.text}>{d.city}</span>: {formatSilver(d.price)} --{" "}
                        {DISCARD_REASONS.includes(d.reason) ? tr(`discard_${d.reason}` as "discard_outlier_low") : d.reason}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </section>
        )}

        <section className="mt-10">
          <h2 className="font-display text-2xl uppercase tracking-tight">{t("materials")}</h2>
          <div className="mt-4 overflow-x-auto rounded-sm border border-border bg-card">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground">
                  <th scope="col" className="px-3 py-2 font-normal">{t("colMaterial")}</th>
                  <th scope="col" className="px-3 py-2 text-right font-normal">{t("colQty")}</th>
                  <th scope="col" className="px-3 py-2 text-right font-normal">{t("colPrice")}</th>
                  <th scope="col" className="px-3 py-2 font-normal">{t("colCity")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {row.materials.map((m) => (
                  <tr key={m.itemId}>
                    <th scope="row" className="px-3 py-2 text-left font-normal">{itemName(m, locale)}</th>
                    <td className="px-3 py-2 text-right font-mono tabular-nums">{m.count}</td>
                    <td className="px-3 py-2 text-right font-mono tabular-nums">{m.buyRefPrice === null ? "--" : fmt(m.buyRefPrice)}</td>
                    <td className="px-3 py-2 text-muted-foreground">{m.cheapestCity ?? (m.bred ? t("bred") : "--")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {variants.length > 0 && (
          <section className="mt-10">
            <h2 className="font-display text-2xl uppercase tracking-tight">{t("variants")}</h2>
            <ul className="mt-4 flex flex-wrap gap-2">
              {variants.map((v) => (
                <li key={v.itemId}>
                  <Link
                    href={localePath(locale, "recipe", `/${encodeURIComponent(v.itemId)}`)}
                    // Up to 12 tier/enchant siblings: prefetching them all rendered ~12 uncached
                    // pages (each a Supabase read) per recipe visit. They load on click instead.
                    prefetch={false}
                    className="inline-flex min-h-6 items-center rounded-sm border border-border px-2.5 py-1 font-mono text-xs text-muted-foreground transition-colors hover:text-foreground"
                  >
                    T{v.tier}
                    {v.enchant > 0 ? `.${v.enchant}` : ""}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {faqs.length > 0 && <FaqList faqs={faqs} className="mt-12" />}

        <SiteFooter className="mt-12">
          <p className="text-xs text-muted-foreground">
            {t("footerData")}{" "}
            <Link href={localePath(locale, "methodology")} className="underline underline-offset-2 hover:text-foreground">
              {t("methodology")}
            </Link>
            .
          </p>
        </SiteFooter>
      </main>
    </>
  );
}
