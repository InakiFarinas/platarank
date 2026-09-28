"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useId, useState, useSyncExternalStore } from "react";
import { Calculator, ChevronDown, Droplet } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { formatAge, formatPercent, formatSilver, enchantLabel, qualityLabel } from "./format";
import { CTA_SECONDARY } from "@/lib/cta";
import { itemIconUrl } from "@/lib/item-icons";
import { CITY_THEMES } from "@/lib/city-theme";
import type { Location } from "@/lib/aodp/cities";
import type { JournalLine, QualityBreakdownEntry, RecipeRow as RecipeRowData } from "@/lib/recipe-math";
import { cn } from "@/lib/utils";
import { localePath, type Locale } from "@/i18n/config";
import { itemName } from "@/lib/item-names";
import { journalBaseName, journalItemName } from "@/lib/journals";
import { breedingLabelValues } from "@/lib/formulas/breeding";

const DISCARD_REASONS = ["outlier_low", "outlier_high", "outlier_self"];

/** Screen readers otherwise get the row's raw concatenated text nodes (name, tier badge, every
 * stat) with no structure -- this gives the row/card button a clean, single accessible name. */
function rowAriaLabel(row: RecipeRowData, t: ReturnType<typeof useTranslations>, locale: Locale): string {
  const { recipe } = row;
  const tier = `T${recipe.tier}${enchantLabel(recipe.enchant)}`;
  const dataNote = row.hasData ? "" : t("insufficientDataSuffix");
  return t("ariaLabel", { name: itemName(recipe, locale), tier, value: formatSilver(row.platinumPerDay), dataNote });
}

const WIDE_QUERY = "(min-width: 640px)";

function subscribeWide(onChange: () => void) {
  const mq = window.matchMedia(WIDE_QUERY);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

/** Only one variant is mounted at a time (the other used to sit in the DOM under `display: none`,
 * doubling every row and its Sheet). The server snapshot is desktop, matching the SSR markup. */
function useIsWide() {
  return useSyncExternalStore(subscribeWide, () => window.matchMedia(WIDE_QUERY).matches, () => true);
}

export function RecipeRowItem({ row, rank }: { row: RecipeRowData; rank: number }) {
  const wide = useIsWide();
  return <div className="border-b border-border">{wide ? <LedgerRow row={row} rank={rank} /> : <ContractCard row={row} />}</div>;
}

/** Desktop: the original dense ledger row, unchanged -- density and inline expand stay exactly
 * as before per the Guild Ledger world's "ornament in chrome only" constraint. */
function LedgerRow({ row, rank }: { row: RecipeRowData; rank: number }) {
  const t = useTranslations("rankingUi.row");
  const locale = useLocale() as Locale;
  const [open, setOpen] = useState(false);
  const detailId = useId();
  const { recipe } = row;

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={detailId}
        aria-label={rowAriaLabel(row, t, locale)}
        className={cn("flex w-full items-center gap-4 px-3 py-3.5 text-left transition-colors hover:bg-accent/40", !row.hasData && "opacity-70")}
      >
        <div className="w-8 shrink-0">
          <span className="font-mono text-xs tabular-nums text-muted-foreground">{rank}</span>
        </div>

        <div className="flex min-w-0 flex-1 items-center gap-2">
          <ChevronDown
            className={cn("h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")}
          />
          {/* eslint-disable-next-line @next/next/no-img-element -- external CDN, thousands of virtualized rows, next/image adds no benefit here */}
          <img src={itemIconUrl(recipe.itemId)} alt="" width={24} height={24} className="h-6 w-6 shrink-0 object-contain" loading="lazy" />
          <span className="truncate text-sm font-medium">{itemName(recipe, locale)}</span>
          <Badge variant="secondary" className="shrink-0 font-mono text-xs tabular-nums">
            T{recipe.tier}
            {enchantLabel(recipe.enchant)}
          </Badge>
          {!row.hasData && (
            <Badge variant="outline" className="shrink-0 text-xs text-muted-foreground">
              {t("insufficientData")}
            </Badge>
          )}
        </div>

        <div className="hidden items-center justify-end gap-4 xl:flex">
          <Stat label={t("cost")} value={row.costPerUnit !== null ? formatSilver(row.costPerUnit) : "--"} mono />
          <Stat label={t("sellPrice")} value={row.sellRefPrice !== null ? formatSilver(row.sellRefPrice) : "--"} mono />
        </div>
        <div className="hidden w-20 shrink-0 text-right lg:block">
          <Stat
            label={t("bonusCity")}
            value={row.specialtyCity ?? "--"}
            className={row.specialtyCity ? CITY_THEMES[row.specialtyCity as Location]?.text : undefined}
          />
        </div>

        <div className="flex items-center justify-end gap-4 xl:gap-6">
          <Stat label={t("margin")} value={formatPercent(row.marginPct)} mono />
          <Stat label={t("volPerDay")} value={formatSilver(row.avgDailyVolume30d)} mono />
          <div className="w-24 text-right">
            <div className="font-mono text-lg font-semibold tabular-nums text-money">{formatSilver(row.platinumPerDay)}</div>
          </div>
        </div>
      </button>

      <div id={detailId} hidden={!open}>
        {open && <RowDetail row={row} />}
      </div>
    </div>
  );
}

/** Mobile: "Registro de Contratos" -- each recipe as its own contract card instead of a dense
 * table row. Item render + name + tier center, plata/día hero metric top-right, liquidity +
 * quality gems in the body. The whole card is the tap target for the derivation sheet -- a small
 * pergamino icon under the hero figure is the only affordance, not a full-width button. */
function ContractCard({ row }: { row: RecipeRowData }) {
  const t = useTranslations("rankingUi.row");
  const locale = useLocale() as Locale;
  const [sheetOpen, setSheetOpen] = useState(false);
  const { recipe } = row;

  return (
    <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
      <SheetTrigger
        render={
          <button
            type="button"
            aria-label={rowAriaLabel(row, t, locale)}
            className={cn("block w-full px-3 py-3 text-left transition-colors hover:bg-accent/40", !row.hasData && "opacity-70")}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 flex-1 items-center gap-2.5">
                {/* eslint-disable-next-line @next/next/no-img-element -- external CDN, thousands of virtualized rows, next/image adds no benefit here */}
                <img src={itemIconUrl(recipe.itemId)} alt="" width={40} height={40} className="h-10 w-10 shrink-0 object-contain" loading="lazy" />
                <div className="min-w-0">
                  <span className="block truncate text-sm font-medium">{itemName(recipe, locale)}</span>
                  <div className="mt-0.5 flex items-center gap-1">
                    <Badge variant="secondary" className="font-mono text-xs tabular-nums">
                      T{recipe.tier}
                      {enchantLabel(recipe.enchant)}
                    </Badge>
                    {!row.hasData && (
                      <Badge variant="outline" className="text-xs text-muted-foreground">
                        {t("insufficientData")}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex shrink-0 flex-col items-end text-right">
                <div className="font-mono text-xl font-semibold tabular-nums text-money">{formatSilver(row.platinumPerDay)}</div>
                <div className="text-xs text-muted-foreground">{t("silverPerDay")}</div>
              </div>
            </div>

            <div className="mt-2.5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Droplet className="h-3 w-3" />
                <span className="font-mono tabular-nums text-foreground">{formatSilver(row.avgDailyVolume30d)}</span>
                {t("perDay")}
              </div>
              {row.qualityBreakdown && <QualityGems breakdown={row.qualityBreakdown} />}
            </div>

            <div className="mt-2.5 flex items-center justify-center gap-1 border-t border-dashed border-border pt-2 text-xs text-muted-foreground">
              {t("viewDetail")}
              <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
            </div>
          </button>
        }
      />
      <SheetContent side="bottom" className="max-h-[85dvh] overflow-y-auto border-t-2 border-double">
        <SheetHeader>
          <SheetTitle className="font-heading text-base">{itemName(recipe, locale)}</SheetTitle>
        </SheetHeader>
        <RowDetail row={row} />
      </SheetContent>
    </Sheet>
  );
}

function QualityGems({ breakdown }: { breakdown: QualityBreakdownEntry[] }) {
  const t = useTranslations("rankingUi.row");
  const locale = useLocale() as Locale;
  return (
    <div className="flex items-center gap-1">
      {breakdown.map((q) => {
        const label = `${qualityLabel(q.quality, locale)}${q.liquid ? "" : t("noLiquidity")}`;
        return (
          <span
            key={q.quality}
            role="img"
            aria-label={label}
            title={label}
            className={cn("h-2 w-2 rotate-45", q.liquid && q.price !== null ? "bg-money" : "bg-muted-foreground/30")}
          />
        );
      })}
    </div>
  );
}

function Stat({ label, value, mono, className }: { label: string; value: string; mono?: boolean; className?: string }) {
  return (
    <div className="text-right">
      <div className={cn("text-xs text-foreground", mono && "font-mono tabular-nums", className)}>{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

function specialtyLabel(row: RecipeRowData, t: ReturnType<typeof useTranslations>): string {
  const focus = row.focus ? t("withFocus") : t("withoutFocus");
  if (!row.specialtyCity) return t("noSpecialty", { focus });
  return t(row.specialtyActive ? "specialtyActive" : "specialtyInactive", { city: row.specialtyCity, focus });
}

function RowDetail({ row }: { row: RecipeRowData }) {
  const t = useTranslations("rankingUi.row");
  const locale = useLocale() as Locale;
  return (
    <div className="bg-card/50 px-3 py-3 text-xs sm:px-9">
      <Link
        href={localePath(locale, "calculator", `?item=${encodeURIComponent(row.recipe.itemId)}`)}
        className={`${CTA_SECONDARY} mb-3 inline-flex items-center gap-1.5 px-2.5 py-1`}
      >
        <Calculator className="h-3.5 w-3.5" />
        {t("openCalculator")}
      </Link>
      <div className="grid gap-4 sm:grid-cols-2">
        <section>
          <h3 className="mb-1.5 font-medium text-foreground">{t("sale")}</h3>
          <dl className="space-y-1 text-muted-foreground">
            <Row k={t("refPrice")} v={row.sellRefPrice !== null ? t("silverAmount", { value: formatSilver(row.sellRefPrice) }) : t("noData")} />
            {row.sellRefPrice === null && row.sellInstantPrice !== null && (
              <Row
                k={t("instantSell")}
                v={
                  row.sellInstantCity
                    ? t("instantSellAmountCity", { value: formatSilver(row.sellInstantPrice), city: row.sellInstantCity })
                    : t("instantSellAmount", { value: formatSilver(row.sellInstantPrice) })
                }
              />
            )}
            <Row k={t("medianOf")} v={t("citiesCount", { count: row.sellRefCitiesCount })} />
            <Row k={t("oldestData")} v={formatAge(row.sellRefAgeSeconds, locale)} />
            <Row k={t("assumedReturn")} v={`${Math.round(row.returnRatePct * 100)}% (${specialtyLabel(row, t)})`} />
            <Row k={t("itemValue")} v={formatSilver(Number(row.recipe.materialItemValue))} />
            <Row k={t("stationFeeBatch")} v={t("silverAmount", { value: formatSilver(row.feePerBatch) })} />
            <Row k={t("marketShare")} v={`${Math.round(row.marketSharePct * 100)}%`} />
          </dl>
          {row.qualityBreakdown && (
            <div className="mt-2">
              <h4 className="mb-1 font-medium text-foreground">{t("byQuality")}</h4>
              <ul className="space-y-0.5">
                {row.qualityBreakdown.map((q) => (
                  <li
                    key={q.quality}
                    className={cn("flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5", !q.liquid && "opacity-70")}
                  >
                    <span>{qualityLabel(q.quality, locale)}</span>
                    <span
                      className={cn(
                        "ml-auto shrink-0 font-mono tabular-nums text-foreground",
                        !q.liquid && "underline decoration-dashed decoration-muted-foreground underline-offset-4",
                      )}
                    >
                      {q.price !== null ? t("silverAmount", { value: formatSilver(q.price) }) : t("noDataShort")}
                      {!q.liquid && t("noLiquidity")}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {row.discarded.length > 0 && (
            <div className="mt-2">
              <h4 className="mb-1 font-medium text-foreground">{t("discarded")}</h4>
              <ul className="space-y-0.5">
                {row.discarded.map((d, i) => (
                  <li key={i} className="text-muted-foreground">
                    <span className={CITY_THEMES[d.city as Location]?.text}>{d.city}</span>: {formatSilver(d.price)} --{" "}
                    {DISCARD_REASONS.includes(d.reason) ? t(`discard_${d.reason}` as "discard_outlier_low") : d.reason}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>

        <section>
          <h3 className="mb-1.5 font-medium text-foreground">{t("materialsBatch", { size: row.recipe.batchSize })}</h3>
          <dl className="space-y-1 text-muted-foreground">
            {row.materials.map((m) => (
              <Row
                key={m.itemId}
                k={`${itemName(m, locale)} x${m.count}`}
                v={
                  m.buyRefPrice !== null
                    ? `${t("eachTo", { price: formatSilver(m.buyRefPrice), total: formatSilver(m.costContribution) })}${
                        m.bred
                          ? t("bred", breedingLabelValues(m.itemId))
                          : m.cheapestCity
                            ? ` · ${m.cheapestCity}`
                            : ""
                      }`
                    : t("noPriceData")
                }
              />
            ))}
          </dl>
          <Separator className="my-2" />
          <dl className="space-y-1 text-muted-foreground">
            <Row k={t("costPerUnit")} v={row.costPerUnit !== null ? t("silverAmount", { value: formatSilver(row.costPerUnit) }) : "--"} />
            <Row
              k={t("netRevenuePerUnit")}
              v={row.revenuePerUnitNet !== null ? t("silverAmount", { value: formatSilver(row.revenuePerUnitNet) }) : "--"}
            />
            <Row k={t("profitPerUnit")} v={row.profitPerUnit !== null ? t("silverAmount", { value: formatSilver(row.profitPerUnit) }) : "--"} />
          </dl>
          {row.journal && <JournalDetail journal={row.journal} />}
        </section>
      </div>
    </div>
  );
}

/** The labourer journal this craft fills: how much fame, how many journals per unit, and what buying
 * them empty and selling them full adds (or why it adds nothing). */
function JournalDetail({ journal }: { journal: JournalLine }) {
  const t = useTranslations("rankingUi.row");
  const locale = useLocale() as Locale;
  const journalsPerUnit = journal.journalsPerUnit.toLocaleString(locale, { maximumFractionDigits: 3 });
  return (
    <div className="mt-3">
      <h4 className="mb-1 flex items-center gap-2 font-medium text-foreground">
        {/* eslint-disable-next-line @next/next/no-img-element -- external CDN icon, same as every item icon here */}
        <img src={itemIconUrl(journal.emptyItemId)} alt="" width={24} height={24} className="h-6 w-6 shrink-0 object-contain" loading="lazy" />
        {t("journalTitle", { name: journalBaseName(journal, locale) })}
      </h4>
      <dl className="space-y-1 text-muted-foreground">
        <Row k={t("journalFame")} v={t("journalFameValue", { fame: formatSilver(journal.famePerCraft), max: formatSilver(journal.maxFame) })} />
        <Row k={t("journalsPerUnit")} v={journalsPerUnit} />
        <Row
          k={t("journalEmpty", { name: journalItemName(journal.emptyItemId, locale) })}
          v={
            journal.emptyPrice !== null
              ? `${t("silverAmount", { value: formatSilver(journal.emptyPrice) })}${journal.emptyCity ? ` · ${journal.emptyCity}` : ""}`
              : t("noPriceData")
          }
        />
        <Row k={t("journalFull", { name: journalItemName(journal.fullItemId, locale) })} v={journal.fullPrice !== null ? t("silverAmount", { value: formatSilver(journal.fullPrice) }) : t("noPriceData")} />
        <Row
          k={t("journalProfit")}
          v={
            journal.profitPerUnit === null
              ? t("journalNotAdded")
              : `${t("silverAmount", { value: formatSilver(journal.profitPerUnit) })}${journal.included ? "" : t("journalExcluded")}`
          }
        />
      </dl>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
      <dt>{k}</dt>
      <dd className="ml-auto shrink-0 font-mono tabular-nums text-foreground">{v}</dd>
    </div>
  );
}
