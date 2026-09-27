"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowDown, ArrowUp } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import type { Locale } from "@/i18n/config";
import { formatInt } from "@/lib/format";
import { itemName } from "@/lib/item-names";
import { cn } from "@/lib/utils";
import { formatSilver } from "@/components/recipes/format";
import { Panel, Segmented } from "@/components/calculator/ui";
import { computeRoll, MIXED_FRAGMENT_COUNT, type ArtifactClass, type FragmentKind, type RollResult } from "@/lib/artifact-roll";
import { netSellMultiplier } from "@/lib/formulas/market-tax";
import type { ArtifactPoolView } from "@/lib/server/artifact-data";

const FRAGMENT_ORDER: FragmentKind[] = ["RUNE", "SOUL", "RELIC", "SHARD_AVALONIAN"];
const TIERS = [4, 5, 6, 7, 8];

type PoolKey = ArtifactClass | "mixed";
const POOL_ORDER: PoolKey[] = ["warrior", "hunter", "mage", "mixed"];
type Tr = ReturnType<typeof useTranslations<"artifacts.foundry">>;
const poolLabel = (t: Tr, k: PoolKey) => (k === "mixed" ? t("mixed") : t(`classes.${k}`));

const silver = (n: number | null, locale: Locale) => (n === null ? "--" : formatInt(n, locale));
const signed = (n: number, locale: Locale) => `${n >= 0 ? "+" : "−"}${formatInt(Math.abs(n), locale)}`;
// 99.6% must not read as 100% (the roll would look risk-free), nor 0.4% as 0%.
const pct = (n: number | null) => (n === null ? "--" : n > 0 && n < 0.01 ? "<1%" : n < 1 && n > 0.99 ? ">99%" : `${Math.round(n * 100)}%`);
const profitTone = (n: number | null) => (n === null ? "text-muted-foreground" : n >= 0 ? "text-money" : "text-destructive");

/** Sign icon next to a gain/loss so the outcome never depends on color alone. */
function Direction({ positive }: { positive: boolean }) {
  const t = useTranslations("artifacts.foundry");
  const Icon = positive ? ArrowUp : ArrowDown;
  return (
    <>
      <Icon className="inline h-3.5 w-3.5 align-[-2px]" aria-hidden="true" />
      <span className="sr-only">{positive ? t("gains") : t("loses")}</span>
    </>
  );
}

function readUrl(): { fragment?: FragmentKind; tier?: number; pool?: PoolKey } {
  const sp = new URLSearchParams(window.location.search);
  const fragment = FRAGMENT_ORDER.find((f) => f === sp.get("f"));
  const tier = TIERS.find((t) => String(t) === sp.get("t"));
  const pool = POOL_ORDER.find((k) => k === sp.get("p"));
  return { fragment, tier, pool };
}

export function FoundryTool({ pools }: { pools: ArtifactPoolView[] }) {
  const t = useTranslations("artifacts.foundry");
  const locale = useLocale() as Locale;
  const fragLabel = (f: FragmentKind) => t(`fragments.${f}`);
  const [fragment, setFragment] = useState<FragmentKind>("RUNE");
  const [tier, setTier] = useState(6);
  const [selected, setSelected] = useState<PoolKey>("mixed");
  const [ready, setReady] = useState(false);

  // The choice lives in the URL so a link to a specific pool can be shared; read once after mount
  // (the server render can't see the query without giving up the hourly static cache).
  useEffect(() => {
    const url = readUrl();
    if (url.fragment) setFragment(url.fragment);
    if (url.tier) setTier(url.tier);
    if (url.pool) setSelected(url.pool);
    setReady(true);
  }, []);
  useEffect(() => {
    if (!ready) return;
    const sp = new URLSearchParams();
    if (fragment !== "RUNE") sp.set("f", fragment);
    if (tier !== 6) sp.set("t", String(tier));
    if (selected !== "mixed") sp.set("p", selected);
    const qs = sp.toString();
    window.history.replaceState(null, "", `${window.location.pathname}${qs ? `?${qs}` : ""}`);
  }, [ready, fragment, tier, selected]);

  const pool = pools.find((p) => p.fragment === fragment && p.tier === tier);

  const rows = useMemo(() => {
    if (!pool) return [];
    return POOL_ORDER.map((key) => {
      const artifacts = key === "mixed" ? pool.artifacts : pool.artifacts.filter((a) => a.class === key);
      const count = key === "mixed" ? MIXED_FRAGMENT_COUNT : pool.fragmentCount;
      return { key, count, artifacts, result: computeRoll(pool.fragmentPrice, count, artifacts.map((a) => a.gross)) };
    });
  }, [pool]);

  // Best expected profit per fragment x tier (over the four pools), to compare the whole landscape at a glance.
  const landscape = useMemo(() => {
    const cells = new Map<string, { profit: number; pool: PoolKey } | null>();
    for (const p of pools) {
      let best: { profit: number; pool: PoolKey } | null = null;
      for (const key of POOL_ORDER) {
        const artifacts = key === "mixed" ? p.artifacts : p.artifacts.filter((a) => a.class === key);
        const r = computeRoll(p.fragmentPrice, key === "mixed" ? MIXED_FRAGMENT_COUNT : p.fragmentCount, artifacts.map((a) => a.gross));
        if (r.profit !== null && (best === null || r.profit > best.profit)) best = { profit: r.profit, pool: key };
      }
      cells.set(`${p.fragment}-${p.tier}`, best);
    }
    return cells;
  }, [pools]);

  const detail = rows.find((r) => r.key === selected);
  const detailArtifacts = useMemo(
    () => [...(detail?.artifacts ?? [])].sort((a, b) => (b.gross ?? -1) - (a.gross ?? -1)),
    [detail],
  );
  const fragmentName = `${fragLabel(fragment)} T${tier}`;

  return (
    <div className="mt-4 space-y-4">
      <h2 className="sr-only">{t("heading")}</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <Segmented
          label={t("fragment")}
          value={fragment}
          options={FRAGMENT_ORDER.map((f) => ({ value: f, text: fragLabel(f) }))}
          onChange={setFragment}
        />
        <Segmented label={t("tier")} value={tier} options={TIERS.map((n) => ({ value: n, text: `T${n}` }))} onChange={setTier} />
      </div>

      {detail && <Verdict pool={pool} detail={detail} fragmentName={fragmentName} />}

      <Panel
        title={t("poolsTitle")}
        aside={
          pool?.fragmentPrice != null
            ? pool.fragmentCity
              ? t("asideCity", { fragment: fragmentName, price: formatInt(pool.fragmentPrice, locale), city: pool.fragmentCity })
              : t("asidePrice", { fragment: fragmentName, price: formatInt(pool.fragmentPrice, locale) })
            : t("asideNone", { fragment: fragmentName })
        }
      >
        <div aria-hidden="true" className="hidden grid-cols-[minmax(0,1.4fr)_repeat(5,minmax(0,1fr))] gap-x-3 px-2 pb-2 text-right text-xs text-muted-foreground sm:grid">
          <span className="text-left">{t("col.pool")}</span>
          <span>{t("col.cost")}</span>
          <span>{t("col.expected")}</span>
          <span>{t("col.profit")}</span>
          <span>{t("col.worstBest")}</span>
          <span>{t("col.loses")}</span>
        </div>
        <ul className="divide-y divide-border border-t border-border">
          {rows.map(({ key, count, result }) => {
            const active = selected === key;
            return (
              <li key={key}>
                <button
                  type="button"
                  aria-pressed={active}
                  onClick={() => setSelected(key)}
                  className={cn(
                    "grid w-full grid-cols-2 items-baseline gap-x-3 gap-y-1 px-2 py-3 text-left transition-colors hover:bg-accent/30 sm:grid-cols-[minmax(0,1.4fr)_repeat(5,minmax(0,1fr))] sm:text-right",
                    active && "bg-money/10",
                  )}
                >
                  <span className="text-sm font-medium sm:text-left">
                    {poolLabel(t, key)}
                    <span className="block text-xs font-normal text-muted-foreground">
                      {t("poolMeta", { count, priced: result.pricedCount, size: result.poolSize })}
                    </span>
                  </span>
                  <span className={cn("text-right font-mono text-lg font-semibold tabular-nums sm:order-4 sm:text-sm", profitTone(result.profit))}>
                    <span className="sr-only sm:hidden">{t("profitLabel")}</span>
                    {result.profit === null ? "--" : <><Direction positive={result.profit >= 0} /> {signed(result.profit, locale)}</>}
                  </span>
                  <Stat label={t("col.cost")} className="sm:order-2">{silver(result.cost, locale)}</Stat>
                  <Stat label={t("col.expected")} className="sm:order-3">{silver(result.expectedNet, locale)}</Stat>
                  <Stat label={t("col.worstBest")} className="sm:order-5 sm:text-muted-foreground">
                    {silver(result.worstNet, locale)} / {silver(result.bestNet, locale)}
                  </Stat>
                  <Stat label={t("col.loses")} className="sm:order-6">{pct(result.lossShare)}</Stat>
                </button>
              </li>
            );
          })}
        </ul>
        <div className="mt-3 space-y-1.5 text-xs text-muted-foreground">
          <p>{t("note1", { net: Math.round(netSellMultiplier() * 1000) / 10 })}</p>
          <p>{t("note2", { mixed: MIXED_FRAGMENT_COUNT })}</p>
        </div>
      </Panel>

      <Panel title={t("compareTitle")} aside={t("compareAside")}>
        <div className="overflow-x-auto" tabIndex={0} role="region" aria-label={t("compareRegion")}>
          <table className="w-full min-w-[20rem] text-sm">
            <caption className="sr-only">{t("compareCaption")}</caption>
            <thead>
              <tr className="text-xs text-muted-foreground">
                <td />
                {TIERS.map((n) => (
                  <th key={n} scope="col" className="pb-1.5 font-normal">T{n}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {FRAGMENT_ORDER.map((f) => (
                <tr key={f}>
                  <th scope="row" className="py-0.5 pr-2 text-left text-xs font-normal text-muted-foreground">{fragLabel(f)}</th>
                  {TIERS.map((n) => {
                    const cell = landscape.get(`${f}-${n}`) ?? null;
                    const isCurrent = f === fragment && n === tier;
                    return (
                      <td key={n} className="p-0.5 text-center">
                        <button
                          type="button"
                          aria-pressed={isCurrent}
                          aria-label={cell ? t("cellAria", { fragment: fragLabel(f), tier: n, sign: cell.profit >= 0 ? "gain" : "loss", amount: formatInt(Math.abs(cell.profit), locale), pool: poolLabel(t, cell.pool) }) : t("cellNone", { fragment: fragLabel(f), tier: n })}
                          onClick={() => {
                            setFragment(f);
                            setTier(n);
                            if (cell) setSelected(cell.pool);
                          }}
                          className={cn(
                            "h-11 w-full rounded-sm border px-1 font-mono text-xs tabular-nums transition-colors sm:h-9",
                            isCurrent ? "border-money bg-money/10" : "border-border hover:bg-accent/40",
                            profitTone(cell?.profit ?? null),
                          )}
                        >
                          {cell ? <><Direction positive={cell.profit >= 0} /> {formatSilver(Math.abs(cell.profit))}</> : "--"}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      {detail && (
        <Panel title={t("detailTitle", { pool: poolLabel(t, detail.key) })} aside={t("detailAside", { priced: detail.result.pricedCount, size: detail.artifacts.length })}>
          <ul className="divide-y divide-border text-sm">
            {detailArtifacts.map((a) => {
              const net = a.gross !== null ? a.gross * netSellMultiplier() : null;
              const cost = detail.result.cost;
              const wins = net !== null && cost !== null ? net >= cost : null;
              return (
                <li key={a.itemId} className="flex items-baseline justify-between gap-3 py-2">
                  <span className="min-w-0 truncate">
                    {itemName(a, locale)}
                    {detail.key === "mixed" && <span className="ml-2 text-xs text-muted-foreground">{t(`classes.${a.class}`)}</span>}
                  </span>
                  <span className="shrink-0 text-right">
                    <span className={cn("font-mono tabular-nums", wins === null ? "" : wins ? "text-money" : "text-destructive")}>
                      {wins !== null && <Direction positive={wins} />} {silver(net, locale)}
                    </span>
                    <span className="ml-3 font-mono text-xs tabular-nums text-muted-foreground">{a.dailyVolume > 0 ? t("perDay", { n: formatInt(a.dailyVolume, locale) }) : t("noSales")}</span>
                  </span>
                </li>
              );
            })}
          </ul>
        </Panel>
      )}
    </div>
  );
}

function Stat({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <span className={cn("flex items-baseline justify-between gap-2 text-sm sm:block", className)}>
      <span className="text-xs text-muted-foreground sm:sr-only">{label}</span>
      <span className="font-mono tabular-nums">{children}</span>
    </span>
  );
}

/** The answer to "¿conviene?": the selected pool's expected profit as the page's one big figure, or
 * the reason there is no answer. */
function Verdict({ pool, detail, fragmentName }: { pool: ArtifactPoolView | undefined; detail: { key: PoolKey; count: number; result: RollResult }; fragmentName: string }) {
  const t = useTranslations("artifacts.foundry");
  const locale = useLocale() as Locale;
  const { result } = detail;
  const name = poolLabel(t, detail.key);

  let body: React.ReactNode;
  if (!pool || pool.fragmentPrice === null) {
    body = (
      <p className="text-sm">{t("verdictNoPrice", { fragment: fragmentName })}</p>
    );
  } else if (result.profit === null) {
    body = <p className="text-sm">{t("verdictNoSales", { pool: name })}</p>;
  } else {
    body = (
      <>
        <p className={cn("font-mono text-4xl font-semibold tabular-nums", profitTone(result.profit))}>
          <Direction positive={result.profit >= 0} /> {signed(result.profit, locale)}
        </p>
        <p className="mt-1.5 font-mono text-xs tabular-nums text-muted-foreground">
          {t("verdictDetail", { expected: silver(result.expectedNet, locale), cost: silver(result.cost, locale), loss: pct(result.lossShare), worst: silver(result.worstNet, locale), best: silver(result.bestNet, locale) })}
        </p>
      </>
    );
  }

  return (
    <section aria-live="polite" className="rounded-md border-2 border-double border-money/30 bg-card px-4 py-4">
      <h3 className="font-heading text-sm text-muted-foreground">
        {t("verdictTitle", { fragment: fragmentName, pool: name })}
      </h3>
      <div className="mt-2">{body}</div>
    </section>
  );
}
