"use client";

import { useMemo, useState } from "react";
import { formatInt } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Panel, Segmented } from "@/components/calculator/ui";
import { computeRoll, CLASS_LABEL, MIXED_FRAGMENT_COUNT, type ArtifactClass, type FragmentKind } from "@/lib/artifacts";
import { netSellMultiplier } from "@/lib/formulas/market-tax";
import type { ArtifactPoolView } from "@/lib/server/artifact-data";

const FRAGMENT_LABEL: Record<FragmentKind, string> = { RUNE: "Runas", SOUL: "Almas", RELIC: "Reliquias", SHARD_AVALONIAN: "Avalon" };
const FRAGMENT_ORDER: FragmentKind[] = ["RUNE", "SOUL", "RELIC", "SHARD_AVALONIAN"];
const TIERS = [4, 5, 6, 7, 8];

type PoolKey = ArtifactClass | "mixed";
const POOL_ORDER: PoolKey[] = ["warrior", "hunter", "mage", "mixed"];
const poolLabel = (k: PoolKey) => (k === "mixed" ? "Mixto" : CLASS_LABEL[k]);

const silver = (n: number | null) => (n === null ? "--" : formatInt(n));
const pct = (n: number | null) => (n === null ? "--" : `${Math.round(n * 100)}%`);

export function FoundryTool({ pools }: { pools: ArtifactPoolView[] }) {
  const [fragment, setFragment] = useState<FragmentKind>("RUNE");
  const [tier, setTier] = useState(6);
  const [selected, setSelected] = useState<PoolKey>("mixed");

  const pool = pools.find((p) => p.fragment === fragment && p.tier === tier);

  const rows = useMemo(() => {
    if (!pool) return [];
    return POOL_ORDER.map((key) => {
      const artifacts = key === "mixed" ? pool.artifacts : pool.artifacts.filter((a) => a.class === key);
      const count = key === "mixed" ? MIXED_FRAGMENT_COUNT : pool.fragmentCount;
      return { key, count, artifacts, result: computeRoll(pool.fragmentPrice, count, artifacts.map((a) => a.gross)) };
    });
  }, [pool]);

  const detail = rows.find((r) => r.key === selected);
  const detailArtifacts = useMemo(
    () => [...(detail?.artifacts ?? [])].sort((a, b) => (b.gross ?? -1) - (a.gross ?? -1)),
    [detail],
  );

  return (
    <div className="mt-4 space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Segmented
          label="Fragmento"
          value={fragment}
          options={FRAGMENT_ORDER.map((f) => ({ value: f, text: FRAGMENT_LABEL[f] }))}
          onChange={setFragment}
        />
        <Segmented label="Tier" value={tier} options={TIERS.map((t) => ({ value: t, text: `T${t}` }))} onChange={setTier} />
      </div>

      <Panel
        title="Pozos de la Fundición"
        aside={pool?.fragmentPrice != null ? `${FRAGMENT_LABEL[fragment]} T${tier}: ${formatInt(pool.fragmentPrice)} c/u` : "Sin precio de fragmento"}
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[34rem] text-sm">
            <thead>
              <tr className="text-left text-xs text-muted-foreground">
                <th className="pb-2 font-normal">Pozo</th>
                <th className="pb-2 text-right font-normal">Costo</th>
                <th className="pb-2 text-right font-normal">Valor esperado</th>
                <th className="pb-2 text-right font-normal">Ganancia</th>
                <th className="pb-2 text-right font-normal">Peor / mejor</th>
                <th className="pb-2 text-right font-normal">Pierde</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ key, count, result }) => (
                <tr
                  key={key}
                  onClick={() => setSelected(key)}
                  className={cn("cursor-pointer border-t border-border tabular-nums hover:bg-accent/30", selected === key && "bg-money/10")}
                >
                  <td className="py-2.5">
                    <button type="button" onClick={() => setSelected(key)} className="text-left font-medium">
                      {poolLabel(key)}
                      <span className="block text-xs font-normal text-muted-foreground">
                        {count} fragmentos · {result.pricedCount}/{result.poolSize} con precio
                      </span>
                    </button>
                  </td>
                  <td className="py-2.5 text-right">{silver(result.cost)}</td>
                  <td className="py-2.5 text-right">{silver(result.expectedNet)}</td>
                  <td className={cn("py-2.5 text-right font-medium", result.profit !== null && (result.profit >= 0 ? "text-money" : "text-destructive"))}>
                    {silver(result.profit)}
                  </td>
                  <td className="py-2.5 text-right text-muted-foreground">
                    {silver(result.worstNet)} / {silver(result.bestNet)}
                  </td>
                  <td className="py-2.5 text-right">{pct(result.lossShare)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Cada artefacto del pozo tiene la misma probabilidad, así que el valor esperado es el promedio de sus precios netos de venta (después de impuestos, {Math.round(netSellMultiplier() * 1000) / 10}% del precio). Los que no tienen precio o no se vendieron en los últimos 30 días quedan fuera del promedio. Costo con el fragmento más barato de las ciudades.
        </p>
      </Panel>

      {detail && (
        <Panel title={`Pozo ${poolLabel(detail.key)}: qué puede salir`} aside={`${detail.artifacts.length} artefactos`}>
          <ul className="divide-y divide-border text-sm">
            {detailArtifacts.map((a) => {
              const net = a.gross !== null ? a.gross * netSellMultiplier() : null;
              const cost = detail.result.cost;
              return (
                <li key={a.itemId} className="flex items-baseline justify-between gap-3 py-2 tabular-nums">
                  <span className="min-w-0 truncate">
                    {a.nameEs}
                    {detail.key === "mixed" && <span className="ml-2 text-xs text-muted-foreground">{CLASS_LABEL[a.class]}</span>}
                  </span>
                  <span className="shrink-0 text-right">
                    <span className={cn(net !== null && cost !== null && (net >= cost ? "text-money" : "text-destructive"))}>{silver(net)}</span>
                    <span className="ml-3 text-xs text-muted-foreground">{a.dailyVolume > 0 ? `${formatInt(a.dailyVolume)}/día` : "sin ventas"}</span>
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
