import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { breadcrumbSchema, faqSchema, FaqList, JsonLd, type Faq } from "@/components/json-ld";
import { formatSilver } from "@/components/recipes/format";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { CTA_PRIMARY, CTA_SECONDARY } from "@/lib/cta";
import { isLocale, localePath, stationRoute, type Locale } from "@/i18n/config";
import { itemIconUrl } from "@/lib/item-icons";
import { itemName } from "@/lib/item-names";
import { absoluteUrl, pageMetadata } from "@/lib/seo";
import { loadItemRow } from "@/lib/server/item-data";
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

function itemLabel(r: { nameEs: string; nameEn?: string | null; tier: number; enchant: number }, locale: Locale) {
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
  if (!row.hasData || row.costPerUnit === null || row.profitPerUnit === null || row.sellRefPrice === null) {
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
                  cost: fmt(cost),
                  sell: fmt(sell),
                  profit: fmt(profit),
                  margin: pct(row.marginPct),
                  perDay: formatSilver(row.platinumPerDay),
                  age: formatAgeLocale((k, v) => ts(`age.${k}`, v), row.sellRefAgeSeconds),
                })}
              </p>
            ) : (
              <p>{t.rich("noData", { b, label })}</p>
            )}
            <div className="mt-4 flex flex-wrap gap-3">
              <Link href={calcHref} className={`${CTA_PRIMARY} inline-flex items-center px-4 py-2 text-sm`}>
                {t("openCalc")}
              </Link>
              <Link href={stationHref} className={`${CTA_SECONDARY} inline-flex items-center px-4 py-2 text-sm`}>
                {t("stationRanking", { station: stationName.toLocaleLowerCase(locale) })}
              </Link>
            </div>
          </div>
        </div>

        {priced && (
          <section className="mt-10">
            <h2 className="font-display text-2xl uppercase tracking-tight">{t("howHeading")}</h2>
            <dl className="mt-4 max-w-md space-y-1.5 text-sm">
              {[
                [t("costPerUnit"), fmt(cost)],
                [t("sellPrice"), fmt(sell)],
                [t("netRevenue"), fmt(row.revenuePerUnitNet ?? 0)],
                [t("profitPerUnit"), fmt(profit)],
                [t("dailyVolume"), fmt(row.avgDailyVolume30d)],
                [t("silverPerDay"), fmt(row.platinumPerDay ?? 0)],
              ].map(([k, v]) => (
                <div key={k} className="flex items-baseline justify-between gap-3">
                  <dt className="text-muted-foreground">{k}</dt>
                  <dd className="font-mono tabular-nums">{v}</dd>
                </div>
              ))}
            </dl>
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
