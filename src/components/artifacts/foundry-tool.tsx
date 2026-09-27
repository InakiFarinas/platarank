"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowDown, ArrowUp } from "lucide-react";
import { formatInt } from "@/lib/format";
import { cn } from "@/lib/utils";
import { formatSilver } from "@/components/recipes/format";
import { Panel, Segmented } from "@/components/calculator/ui";
import { computeRoll, CLASS_LABEL, MIXED_FRAGMENT_COUNT, type ArtifactClass, type FragmentKind, type RollResult } from "@/lib/artifact-roll";
import { netSellMultiplier } from "@/lib/formulas/market-tax";
import type { ArtifactPoolView } from "@/lib/server/artifact-data";

const FRAGMENT_LABEL: Record<FragmentKind, string> = { RUNE: "Runas", SOUL: "Almas", RELIC: "Reliquias", SHARD_AVALONIAN: "Avalon" };
const FRAGMENT_ORDER: FragmentKind[] = ["RUNE", "SOUL", "RELIC", "SHARD_AVALONIAN"];
const TIERS = [4, 5, 6, 7, 8];

type PoolKey = ArtifactClass | "mixed";
const POOL_ORDER: PoolKey[] = ["warrior", "hunter", "mage", "mixed"];
const poolLabel = (k: PoolKey) => (k === "mixed" ? "Mixto" : CLASS_LABEL[k]);

const silver = (n: number | null) => (n === null ? "--" : formatInt(n));
const signed = (n: number) => `${n >= 0 ? "+" : "−"}${formatInt(Math.abs(n))}`;
// 99.6% must not read as 100% (the roll would look risk-free), nor 0.4% as 0%.
const pct = (n: number | null) => (n === null ? "--" : n > 0 && n < 0.01 ? "<1%" : n < 1 && n > 0.99 ? ">99%" : `${Math.round(n * 100)}%`);
const profitTone = (n: number | null) => (n === null ? "text-muted-foreground" : n >= 0 ? "text-money" : "text-destructive");

/** Sign icon next to a gain/loss so the outcome never depends on color alone. */
function Direction({ positive }: { positive: boolean }) {
  const Icon = positive ? ArrowUp : ArrowDown;
  return (
    <>
      <Icon className="inline h-3.5 w-3.5 align-[-2px]" aria-hidden="true" />
      <span className="sr-only">{positive ? "gana" : "pierde"}</span>
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
  const fragmentName = `${FRAGMENT_LABEL[fragment]} T${tier}`;

  return (
    <div className="mt-4 space-y-4">
      <h2 className="sr-only">Calculadora de la Fundición</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <Segmented
          label="Fragmento"
          value={fragment}
          options={FRAGMENT_ORDER.map((f) => ({ value: f, text: FRAGMENT_LABEL[f] }))}
          onChange={setFragment}
        />
        <Segmented label="Tier" value={tier} options={TIERS.map((t) => ({ value: t, text: `T${t}` }))} onChange={setTier} />
      </div>

      {detail && <Verdict pool={pool} detail={detail} fragmentName={fragmentName} />}

      <Panel
        title="Pozos de la Fundición"
        aside={pool?.fragmentPrice != null ? `${fragmentName}: ${formatInt(pool.fragmentPrice)} c/u${pool.fragmentCity ? ` en ${pool.fragmentCity}` : ""}` : `Sin precio de ${fragmentName}`}
      >
        <div aria-hidden="true" className="hidden grid-cols-[minmax(0,1.4fr)_repeat(5,minmax(0,1fr))] gap-x-3 px-2 pb-2 text-right text-xs text-muted-foreground sm:grid">
          <span className="text-left">Pozo</span>
          <span>Costo</span>
          <span>Valor esperado</span>
          <span>Ganancia</span>
          <span>Peor / mejor</span>
          <span>Pierde</span>
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
                    {poolLabel(key)}
                    <span className="block text-xs font-normal text-muted-foreground">
                      {count} fragmentos · {result.pricedCount}/{result.poolSize} con precio
                    </span>
                  </span>
                  <span className={cn("text-right font-mono text-lg font-semibold tabular-nums sm:order-4 sm:text-sm", profitTone(result.profit))}>
                    <span className="sr-only sm:hidden">Ganancia: </span>
                    {result.profit === null ? "--" : <><Direction positive={result.profit >= 0} /> {signed(result.profit)}</>}
                  </span>
                  <Stat label="Costo" className="sm:order-2">{silver(result.cost)}</Stat>
                  <Stat label="Valor esperado" className="sm:order-3">{silver(result.expectedNet)}</Stat>
                  <Stat label="Peor / mejor" className="sm:order-5 sm:text-muted-foreground">
                    {silver(result.worstNet)} / {silver(result.bestNet)}
                  </Stat>
                  <Stat label="Pierde" className="sm:order-6">{pct(result.lossShare)}</Stat>
                </button>
              </li>
            );
          })}
        </ul>
        <div className="mt-3 space-y-1.5 text-xs text-muted-foreground">
          <p>
            Valor esperado: promedio de lo que rinde cada artefacto del pozo, neto de impuestos ({Math.round(netSellMultiplier() * 1000) / 10}% del precio). Los que no tienen
            precio o no se vendieron en 30 días quedan fuera del promedio. Pierde: qué parte de los artefactos con precio se vende por menos de lo que costó la tirada.
          </p>
          <p>
            Supuestos: todos los artefactos del pozo con la misma probabilidad, y 36 fragmentos por tirada en el pozo Mixto. Ninguno sale del volcado del juego; los pozos sí
            (son los artefactos cuya receta usa ese fragmento). El costo usa el fragmento más barato de las ciudades.
          </p>
        </div>
      </Panel>

      <Panel title="Comparar tiers" aside="mejor ganancia esperada entre los cuatro pozos">
        <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="Comparación de fragmentos y tiers">
          <table className="w-full min-w-[20rem] text-sm">
            <caption className="sr-only">Mejor ganancia esperada por tirada según fragmento y tier. Elegí una celda para ver su detalle.</caption>
            <thead>
              <tr className="text-xs text-muted-foreground">
                <td />
                {TIERS.map((t) => (
                  <th key={t} scope="col" className="pb-1.5 font-normal">T{t}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {FRAGMENT_ORDER.map((f) => (
                <tr key={f}>
                  <th scope="row" className="py-0.5 pr-2 text-left text-xs font-normal text-muted-foreground">{FRAGMENT_LABEL[f]}</th>
                  {TIERS.map((t) => {
                    const cell = landscape.get(`${f}-${t}`) ?? null;
                    const isCurrent = f === fragment && t === tier;
                    return (
                      <td key={t} className="p-0.5 text-center">
                        <button
                          type="button"
                          aria-pressed={isCurrent}
                          aria-label={`${FRAGMENT_LABEL[f]} T${t}: ${cell ? `${cell.profit >= 0 ? "gana" : "pierde"} ${formatInt(Math.abs(cell.profit))} en el pozo ${poolLabel(cell.pool)}` : "sin datos"}`}
                          onClick={() => {
                            setFragment(f);
                            setTier(t);
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
        <Panel title={`Pozo ${poolLabel(detail.key)}: qué puede salir`} aside={`${detail.result.pricedCount}/${detail.artifacts.length} con precio`}>
          <ul className="divide-y divide-border text-sm">
            {detailArtifacts.map((a) => {
              const net = a.gross !== null ? a.gross * netSellMultiplier() : null;
              const cost = detail.result.cost;
              const wins = net !== null && cost !== null ? net >= cost : null;
              return (
                <li key={a.itemId} className="flex items-baseline justify-between gap-3 py-2">
                  <span className="min-w-0 truncate">
                    {a.nameEs}
                    {detail.key === "mixed" && <span className="ml-2 text-xs text-muted-foreground">{CLASS_LABEL[a.class]}</span>}
                  </span>
                  <span className="shrink-0 text-right">
                    <span className={cn("font-mono tabular-nums", wins === null ? "" : wins ? "text-money" : "text-destructive")}>
                      {wins !== null && <Direction positive={wins} />} {silver(net)}
                    </span>
                    <span className="ml-3 font-mono text-xs tabular-nums text-muted-foreground">{a.dailyVolume > 0 ? `${formatInt(a.dailyVolume)}/día` : "sin ventas"}</span>
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
  const { result } = detail;
  const name = poolLabel(detail.key);

  let body: React.ReactNode;
  if (!pool || pool.fragmentPrice === null) {
    body = (
      <p className="text-sm">
        No hay precio de {fragmentName} en ninguna ciudad, así que no podemos calcular costo ni ganancia. Abajo ves cuánto rinde cada artefacto del pozo.
      </p>
    );
  } else if (result.profit === null) {
    body = <p className="text-sm">Ningún artefacto del pozo {name} se vendió en los últimos 30 días, así que no hay un valor esperado para comparar con el costo.</p>;
  } else {
    body = (
      <>
        <p className={cn("font-mono text-4xl font-semibold tabular-nums", profitTone(result.profit))}>
          <Direction positive={result.profit >= 0} /> {signed(result.profit)}
        </p>
        <p className="mt-1.5 font-mono text-xs tabular-nums text-muted-foreground">
          valor esperado {silver(result.expectedNet)} − costo {silver(result.cost)} · pierde {pct(result.lossShare)} de las veces · peor {silver(result.worstNet)}, mejor {silver(result.bestNet)}
        </p>
      </>
    );
  }

  return (
    <section aria-live="polite" className="rounded-md border-2 border-double border-money/30 bg-card px-4 py-4">
      <h3 className="font-heading text-sm text-muted-foreground">
        Ganancia esperada por tirada · {fragmentName} · pozo {name}
      </h3>
      <div className="mt-2">{body}</div>
    </section>
  );
}
