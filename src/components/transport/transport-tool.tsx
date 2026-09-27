"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, Trash2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import type { Locale } from "@/i18n/config";
import { formatInt } from "@/lib/format";
import { itemName } from "@/lib/item-names";
import { itemIconUrl } from "@/lib/item-icons";
import { cn } from "@/lib/utils";
import { Field, Panel, SilverInput } from "@/components/calculator/ui";
import { Switch } from "@/components/ui/switch";
import rawResourcesJson from "@/data/generated/raw-resources.json";
import { BAG_CAPACITY_KG, MOUNTS, type MountId, type Tier } from "@/lib/transport/capacity";
import { computeTransportResult, itemWeightKg, type CargoLine, type TransportSetup } from "@/lib/transport/compute";

type RawResource = { itemId: string; tier: number; category: string; nameEs: string; nameEn?: string };
const RAW_RESOURCES = rawResourcesJson as RawResource[];

const CAPE_CATEGORIES = ["FIBER", "HIDE", "ORE", "ROCK", "WOOD"] as const;

const BAG_TIERS = Object.keys(BAG_CAPACITY_KG).map(Number) as Tier[];

type Hit = { itemId: string; nameEs: string; nameEn?: string | null; tier: number };

/** "Qué vas a transportar": crafted goods come from the same search the rest of the calculator
 * uses; raw resources (relevant when a gathering cape is equipped) aren't recipe outputs in this
 * app, so they're matched client-side against the small generated list instead. */
function useCargoSearch(query: string, locale: Locale) {
  const [craftedHits, setCraftedHits] = useState<Hit[]>([]);
  useEffect(() => {
    if (query.trim().length < 2) {
      setCraftedHits([]);
      return;
    }
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/calculator/search?q=${encodeURIComponent(query.trim())}`, { signal: ctrl.signal });
        if (!res.ok) throw new Error(String(res.status));
        setCraftedHits(await res.json());
      } catch (err) {
        if ((err as Error).name !== "AbortError") setCraftedHits([]);
      }
    }, 250);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [query]);

  const rawHits = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];
    return RAW_RESOURCES.filter((r) => itemName(r, locale).toLowerCase().includes(q)).slice(0, 8);
  }, [query, locale]);

  return { craftedHits, rawHits };
}

export function TransportTool() {
  const t = useTranslations("artifacts.transport");
  const locale = useLocale() as Locale;
  const [bagTier, setBagTier] = useState<Tier | null>(null);
  const [mountId, setMountId] = useState<MountId | null>(null);
  const [mountTier, setMountTier] = useState<Tier | null>(null);
  const [foodActive, setFoodActive] = useState(false);
  const [shoesCourierActive, setShoesCourierActive] = useState(false);
  const [capeCategory, setCapeCategory] = useState<string | null>(null);
  const [capeTier, setCapeTier] = useState<Tier | null>(null);
  const [lines, setLines] = useState<CargoLine[]>([]);
  const [query, setQuery] = useState("");
  const { craftedHits, rawHits } = useCargoSearch(query, locale);

  const mount = mountId ? MOUNTS.find((m) => m.id === mountId)! : null;
  const mountTiers = mount ? (Object.keys(mount.capacityByTier).map(Number) as Tier[]) : [];

  function addLine(itemId: string, name: string) {
    setLines((prev) => {
      const existing = prev.find((l) => l.itemId === itemId);
      if (existing) return prev.map((l) => (l.itemId === itemId ? { ...l, qty: l.qty + 1 } : l));
      return [...prev, { itemId, name, qty: 1 }];
    });
    setQuery("");
  }

  const setup: TransportSetup = { bagTier, mountId, mountTier, foodActive, shoesCourierActive, capeCategory, capeTier };
  const result = computeTransportResult(lines, setup);
  const overLimit = result.loadPct > 100;

  return (
    <div className="mt-4 grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_23rem]">
      <div className="space-y-4">
        <Panel title={t("capacity")}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t("bag")}>
              <select
                value={bagTier ?? ""}
                onChange={(e) => setBagTier(e.target.value === "" ? null : (Number(e.target.value) as Tier))}
                className="h-11 w-full rounded-md border border-border bg-background px-2.5 text-sm sm:h-9"
              >
                <option value="">{t("none")}</option>
                {BAG_TIERS.map((n) => (
                  <option key={n} value={n}>
                    T{n} -- {BAG_CAPACITY_KG[n]} kg
                  </option>
                ))}
              </select>
            </Field>

            <Field label={t("mount")}>
              <select
                value={mountId ?? ""}
                onChange={(e) => {
                  const id = (e.target.value || null) as MountId | null;
                  setMountId(id);
                  const m = id ? MOUNTS.find((x) => x.id === id) : null;
                  setMountTier(m ? (Number(Object.keys(m.capacityByTier)[0]) as Tier) : null);
                }}
                className="h-11 w-full rounded-md border border-border bg-background px-2.5 text-sm sm:h-9"
              >
                <option value="">{t("none")}</option>
                {MOUNTS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {t(`mounts.${m.id}`)}
                  </option>
                ))}
              </select>
            </Field>

            {mount && mountTiers.length > 1 && (
              <Field label={t("mountTier")}>
                <select
                  value={mountTier ?? ""}
                  onChange={(e) => setMountTier(Number(e.target.value) as Tier)}
                  className="h-11 w-full rounded-md border border-border bg-background px-2.5 text-sm sm:h-9"
                >
                  {mountTiers.map((n) => (
                    <option key={n} value={n}>
                      T{n} -- {mount.capacityByTier[n]} kg{mount.kind === "mounted" ? t("mountedOnly") : ""}
                    </option>
                  ))}
                </select>
              </Field>
            )}

            <Field label={t("cape")}>
              <select
                value={capeCategory ?? ""}
                onChange={(e) => {
                  const cat = e.target.value || null;
                  setCapeCategory(cat);
                  setCapeTier(cat ? 4 : null);
                }}
                className="h-11 w-full rounded-md border border-border bg-background px-2.5 text-sm sm:h-9"
              >
                <option value="">{t("none")}</option>
                {CAPE_CATEGORIES.map((key) => (
                  <option key={key} value={key}>
                    {t(`capeCategories.${key}`)}
                  </option>
                ))}
              </select>
            </Field>

            {capeCategory && (
              <Field label={t("capeTier")} hint={t("capeTierHint")}>
                <select
                  value={capeTier ?? 4}
                  onChange={(e) => setCapeTier(Number(e.target.value) as Tier)}
                  className="h-11 w-full rounded-md border border-border bg-background px-2.5 text-sm sm:h-9"
                >
                  {[4, 5, 6, 7, 8].map((n) => (
                    <option key={n} value={n}>
                      T{n}
                    </option>
                  ))}
                </select>
              </Field>
            )}
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="flex items-center justify-between gap-4 rounded-md border border-border px-3 py-2.5">
              <div>
                <span className="block text-sm">{t("food")}</span>
                <span className="block text-xs text-muted-foreground">{t("foodHint")}</span>
              </div>
              <Switch checked={foodActive} onCheckedChange={setFoodActive} />
            </div>
            <div className="flex items-center justify-between gap-4 rounded-md border border-border px-3 py-2.5">
              <div>
                <span className="block text-sm">{t("courier")}</span>
                <span className="block text-xs text-muted-foreground">{t("courierHint")}</span>
              </div>
              <Switch checked={shoesCourierActive} onCheckedChange={setShoesCourierActive} disabled={bagTier === null} />
            </div>
          </div>
        </Panel>

        <Panel title={t("cargoTitle")}>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("searchPlaceholder")}
              className="h-11 w-full rounded-md border border-border bg-background pl-9 pr-3 text-sm outline-none focus-visible:border-money focus-visible:ring-2 focus-visible:ring-money/30 sm:h-9"
            />
            {(craftedHits.length > 0 || rawHits.length > 0) && (
              <ul className="absolute z-20 mt-1 max-h-72 w-full overflow-y-auto rounded-md border border-border bg-popover shadow-none">
                {rawHits.map((r) => (
                  <li key={r.itemId}>
                    <button
                      type="button"
                      onClick={() => addLine(r.itemId, `${itemName(r, locale)} (T${r.tier})`)}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-accent/40"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={itemIconUrl(r.itemId)} alt="" width={28} height={28} className="h-7 w-7 shrink-0" />
                      <span className="min-w-0 flex-1 truncate">{itemName(r, locale)}</span>
                      <span className="shrink-0 text-xs text-muted-foreground">{t("rawTag", { tier: r.tier })}</span>
                    </button>
                  </li>
                ))}
                {craftedHits.map((h) => (
                  <li key={h.itemId}>
                    <button
                      type="button"
                      onClick={() => addLine(h.itemId, `${itemName(h, locale)} (T${h.tier})`)}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-accent/40"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={itemIconUrl(h.itemId)} alt="" width={28} height={28} className="h-7 w-7 shrink-0" />
                      <span className="min-w-0 flex-1 truncate">{itemName(h, locale)}</span>
                      <span className="shrink-0 text-xs text-muted-foreground">T{h.tier}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {lines.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">{t("empty")}</p>
          ) : (
            <ul className="mt-4 divide-y divide-border">
              {lines.map((line) => {
                const unitWeight = itemWeightKg(line.itemId);
                return (
                  <li key={line.itemId} className="grid grid-cols-[auto_minmax(0,1fr)_6rem_auto] items-center gap-3 py-2.5">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={itemIconUrl(line.itemId)} alt="" width={36} height={36} className="h-9 w-9 shrink-0" />
                    <div className="min-w-0">
                      <div className="truncate text-sm">{line.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {unitWeight !== null ? t("weightEach", { kg: unitWeight.toLocaleString(locale === "en" ? "en-US" : "es-AR", { maximumFractionDigits: 2 }) }) : t("weightUnknown")}
                      </div>
                    </div>
                    <SilverInput
                      label={t("qtyOf", { name: line.name })}
                      value={line.qty}
                      onChange={(v) => setLines((prev) => prev.map((l) => (l.itemId === line.itemId ? { ...l, qty: Math.max(1, v) } : l)))}
                    />
                    <button
                      type="button"
                      aria-label={t("remove", { name: line.name })}
                      onClick={() => setLines((prev) => prev.filter((l) => l.itemId !== line.itemId))}
                      className="relative p-1.5 text-muted-foreground transition-colors hover:text-destructive after:absolute after:-inset-1.5 after:content-['']"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>
      </div>

      <div className="lg:sticky lg:top-20">
        <Panel title={t("resultTitle")}>
          <div className="space-y-3">
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-sm text-muted-foreground">{t("cargoWeight")}</span>
              <span className="font-mono text-sm tabular-nums">{formatInt(Math.round(result.cargoWeightKg), locale)} kg</span>
            </div>
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-sm text-muted-foreground">{t("maxLoad")}</span>
              <span className="font-mono text-sm tabular-nums">{formatInt(Math.round(result.maxLoadKg), locale)} kg</span>
            </div>
            <div className={cn("flex items-baseline justify-between gap-3 border-t-2 border-double border-money/30 pt-3", overLimit && "text-destructive")}>
              <span className="font-heading text-base">{t("load")}</span>
              <span className="font-mono text-xl tabular-nums">{Math.round(result.loadPct)}%</span>
            </div>
            <div className="rounded-md border border-border px-3 py-2.5 text-sm">
              <div className="text-muted-foreground">{t(`speedLabels.${result.labelKey}`)}</div>
              <div className="font-mono tabular-nums">{t("speed", { speed: String(result.speedMs) })}</div>
            </div>
            {bagTier === null && mountId === null && (
              <p className="text-xs text-muted-foreground">{t("noBag")}</p>
            )}
          </div>
        </Panel>
      </div>
    </div>
  );
}
