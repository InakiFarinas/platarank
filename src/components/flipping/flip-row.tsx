"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useId, useState, useSyncExternalStore } from "react";
import { ChevronDown, Truck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { formatAge, formatPercent, formatSilver } from "@/components/recipes/format";
import { CTA_SECONDARY } from "@/lib/cta";
import { itemIconUrl } from "@/lib/item-icons";
import { CITY_THEMES } from "@/lib/city-theme";
import type { Location } from "@/lib/aodp/cities";
import type { FlipRow as FlipRowData } from "@/lib/flip-math";
import { cn } from "@/lib/utils";
import { localePath, type Locale } from "@/i18n/config";
import { itemName } from "@/lib/item-names";

const DISCARD_REASONS = ["outlier_low", "outlier_high", "outlier_self"];

function rowAriaLabel(row: FlipRowData, t: ReturnType<typeof useTranslations>, locale: Locale): string {
  const dataNote = row.hasData ? "" : t("insufficientDataSuffix");
  return t("ariaLabel", { name: itemName(row.item, locale), tier: `T${row.item.tier}`, value: formatSilver(row.platinumPerDay), dataNote });
}

const WIDE_QUERY = "(min-width: 640px)";

function subscribeWide(onChange: () => void) {
  const mq = window.matchMedia(WIDE_QUERY);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

/** Same mobile-first hydration rationale as recipe-row.tsx's `useIsWide`: only one variant mounted
 * at a time, defaulting to the mobile shape so a pre-hydration mobile visitor sees it immediately. */
function useIsWide() {
  return useSyncExternalStore(subscribeWide, () => window.matchMedia(WIDE_QUERY).matches, () => false);
}

export function FlipRowItem({ row, rank }: { row: FlipRowData; rank: number }) {
  const wide = useIsWide();
  return <div className="border-b border-border">{wide ? <LedgerRow row={row} rank={rank} /> : <ContractCard row={row} />}</div>;
}

function LedgerRow({ row, rank }: { row: FlipRowData; rank: number }) {
  const t = useTranslations("flipping.row");
  const locale = useLocale() as Locale;
  const [open, setOpen] = useState(false);
  const detailId = useId();
  const { item } = row;

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
          <ChevronDown className={cn("h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")} />
          {/* eslint-disable-next-line @next/next/no-img-element -- external CDN, thousands of virtualized rows, next/image adds no benefit here */}
          <img src={itemIconUrl(item.itemId)} alt="" width={24} height={24} className="h-6 w-6 shrink-0 object-contain" loading="lazy" />
          <span className="truncate text-sm font-medium">{itemName(item, locale)}</span>
          <Badge variant="secondary" className="shrink-0 font-mono text-xs tabular-nums">
            T{item.tier}
          </Badge>
          {!row.hasData && (
            <Badge variant="outline" className="shrink-0 text-xs text-muted-foreground">
              {t("insufficientData")}
            </Badge>
          )}
        </div>

        <div className="hidden items-center justify-end gap-4 xl:flex">
          <Stat label={t("buy")} value={row.buyPrice !== null ? formatSilver(row.buyPrice) : "--"} city={row.buyCity} mono />
          <Stat label={t("sell")} value={row.sellPriceGross !== null ? formatSilver(row.sellPriceGross) : "--"} city={row.sellCity} mono />
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

function ContractCard({ row }: { row: FlipRowData }) {
  const t = useTranslations("flipping.row");
  const locale = useLocale() as Locale;
  const [sheetOpen, setSheetOpen] = useState(false);
  const { item } = row;

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
                <img src={itemIconUrl(item.itemId)} alt="" width={40} height={40} className="h-10 w-10 shrink-0 object-contain" loading="lazy" />
                <div className="min-w-0">
                  <span className="block truncate text-sm font-medium">{itemName(item, locale)}</span>
                  <div className="mt-0.5 flex items-center gap-1">
                    <Badge variant="secondary" className="font-mono text-xs tabular-nums">
                      T{item.tier}
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

            <div className="mt-2.5 flex items-center justify-between gap-3 text-xs text-muted-foreground">
              <span>
                {row.buyCity && <span className={CITY_THEMES[row.buyCity as Location]?.text}>{row.buyCity}</span>}
                {row.buyPrice !== null && ` ${formatSilver(row.buyPrice)}`}
                {" -> "}
                {row.sellCity && <span className={CITY_THEMES[row.sellCity as Location]?.text}>{row.sellCity}</span>}
                {row.sellPriceGross !== null && ` ${formatSilver(row.sellPriceGross)}`}
              </span>
              <span className="font-mono tabular-nums text-foreground">{formatPercent(row.marginPct)}</span>
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
          <SheetTitle className="font-heading text-base">{itemName(item, locale)}</SheetTitle>
        </SheetHeader>
        <RowDetail row={row} />
      </SheetContent>
    </Sheet>
  );
}

function Stat({ label, value, city, mono }: { label: string; value: string; city?: string | null; mono?: boolean }) {
  return (
    <div className="text-right">
      <div className={cn("text-xs text-foreground", mono && "font-mono tabular-nums")}>{value}</div>
      <div className={cn("text-xs text-muted-foreground", city && CITY_THEMES[city as Location]?.text)}>{city ?? label}</div>
    </div>
  );
}

function RowDetail({ row }: { row: FlipRowData }) {
  const t = useTranslations("flipping.row");
  const locale = useLocale() as Locale;
  return (
    <div className="bg-card/50 px-3 py-3 text-xs sm:px-9">
      <Link
        href={localePath(locale, "calculator", `?item=${encodeURIComponent(row.item.itemId)}&tab=transporte`)}
        className={`${CTA_SECONDARY} mb-3 inline-flex items-center gap-1.5 px-2.5 py-1`}
      >
        <Truck className="h-3.5 w-3.5" />
        {t("openTransport")}
      </Link>
      <dl className="space-y-1 text-muted-foreground">
        <Row
          k={t("buyAt")}
          v={
            row.buyCity
              ? `${row.buyCity} · ${t("silverAmount", { value: formatSilver(row.buyPrice) })} (${row.buyMethod === "order" ? t("buyMethodOrder") : t("buyMethodInstant")})`
              : t("noData")
          }
        />
        <Row k={t("ageBuy")} v={formatAge(row.buyAgeSeconds, locale)} />
        <Row
          k={t("sellAt")}
          v={
            row.sellCity
              ? `${row.sellCity} · ${t("silverAmount", { value: formatSilver(row.sellPriceGross) })} (${row.sellMethod === "instant" ? t("methodInstant") : t("methodListing")})`
              : t("noData")
          }
        />
        <Row k={t("ageSell")} v={formatAge(row.sellAgeSeconds, locale)} />
        <Row k={t("marginPerUnit")} v={row.marginPerUnit !== null ? t("silverAmount", { value: formatSilver(row.marginPerUnit) }) : "--"} />
        <Row k={t("marketShare")} v={`${Math.round(row.marketSharePct * 100)}%`} />
      </dl>
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
