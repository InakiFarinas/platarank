"use client";

import { useCallback, useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import type { Locale } from "@/i18n/config";
import { formatInt } from "@/lib/format";
import type { DestinyLevels, RelevantNode } from "@/lib/destiny-focus";
import { DisclosureButton, Panel } from "@/components/calculator/ui";
import { cn } from "@/lib/utils";

const LEVELS_KEY = "platarank:destiny-levels";

/** The player's Destiny Board levels, remembered in this browser only (a per-viewer convenience:
 * the page works the same with nothing stored). One map for every item, keyed by node id, so a
 * mastery typed once applies to every recipe it covers. */
export function useDestinyLevels() {
  const [levels, setLevels] = useState<DestinyLevels>({});
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LEVELS_KEY);
      if (raw) setLevels(JSON.parse(raw) as DestinyLevels);
    } catch {
      // Private window or blocked storage: start from zero, nothing breaks.
    }
  }, []);
  const setLevel = useCallback((id: string, level: number) => {
    setLevels((prev) => {
      const next = { ...prev };
      if (level > 0) next[id] = level;
      else delete next[id];
      try {
        localStorage.setItem(LEVELS_KEY, JSON.stringify(next));
      } catch {
        // Same as above: the value still applies for this visit.
      }
      return next;
    });
  }, []);
  return { levels, setLevel };
}

// A node giving at least this per level is the item's own specialization (250 own + the category
// share); everything below is a sibling's category share (30/22.5/15/11.25) or a crystal spec's tree
// bonus (~2), grouped and collapsed the way the game's own "for Potions & Alcohol" panel sums them.
const OWN_SPEC_FCE_PER_LEVEL = 100;

/** Destiny Board levels that lower this recipe's focus cost, and the resulting cost per craft. */
export function FocusSpecPanel({
  nodes,
  levels,
  setLevel,
  fce,
  baseFocus,
  perCraft,
}: {
  nodes: RelevantNode[];
  levels: DestinyLevels;
  setLevel: (id: string, level: number) => void;
  fce: number;
  baseFocus: number;
  perCraft: number;
}) {
  const t = useTranslations("calculator.focusSpec");
  const locale = useLocale() as Locale;
  const [minorOpen, setMinorOpen] = useState(false);
  const main = nodes.filter((n) => n.kind === "mastery" || n.fcePerLevel >= OWN_SPEC_FCE_PER_LEVEL);
  const minor = nodes.filter((n) => !main.includes(n));
  const minorFce = minor.reduce((sum, n) => sum + (levels[n.id] ?? 0) * n.fcePerLevel, 0);
  const dec1 = (n: number) => n.toLocaleString(locale === "en" ? "en-US" : "es-AR", { maximumFractionDigits: 1 });
  const pct = baseFocus > 0 ? (perCraft / baseFocus) * 100 : 100;

  return (
    <Panel title={t("title")} aside={<span className="font-mono tabular-nums">{t("fce", { fce: formatInt(fce, locale) })}</span>}>
      <p className="text-xs text-muted-foreground">{t("intro")}</p>
      <ul className="mt-3 divide-y divide-border">
        {main.map((n) => (
          <NodeRow key={n.id} node={n} level={levels[n.id] ?? 0} setLevel={setLevel} />
        ))}
      </ul>
      {minor.length > 0 && (
        <>
          <DisclosureButton
            open={minorOpen}
            onToggle={() => setMinorOpen((o) => !o)}
            className="mt-2 flex w-full items-center gap-1.5 py-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            {t("minor", { count: minor.length })}
            <span className="ml-auto font-mono tabular-nums text-foreground">+{formatInt(minorFce, locale)}</span>
          </DisclosureButton>
          {minorOpen && (
            <ul className="divide-y divide-border">
              {minor.map((n) => (
                <NodeRow key={n.id} node={n} level={levels[n.id] ?? 0} setLevel={setLevel} />
              ))}
            </ul>
          )}
        </>
      )}
      <div className="mt-3 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-t border-border pt-3 text-sm">
        <span>{t("perCraft")}</span>
        <span className="font-mono tabular-nums">
          <span className="text-money">{dec1(perCraft)}</span>
          <span className="ml-2 text-xs text-muted-foreground">{t("vsBase", { base: formatInt(baseFocus, locale), pct: dec1(pct) })}</span>
        </span>
      </div>
    </Panel>
  );
}

function NodeRow({ node, level, setLevel }: { node: RelevantNode; level: number; setLevel: (id: string, level: number) => void }) {
  const t = useTranslations("calculator.focusSpec");
  const locale = useLocale() as Locale;
  const perLevel = Number.isInteger(node.fcePerLevel) ? String(node.fcePerLevel) : node.fcePerLevel.toFixed(2).replace(/0+$/, "").replace(".", locale === "en" ? "." : ",");
  return (
    <li className="flex items-center gap-3 py-2">
      <div className="min-w-0 flex-1">
        <div className={cn("truncate text-sm", node.kind === "mastery" && "font-medium")}>{node.name}</div>
        <div className="text-xs text-muted-foreground">
          {node.kind === "mastery" ? t("mastery") : t("spec")} · {t("perLevel", { fce: perLevel })}
        </div>
      </div>
      <input
        type="number"
        inputMode="numeric"
        min={0}
        max={node.maxLevel}
        value={level === 0 ? "" : level}
        placeholder="0"
        aria-label={t("levelLabel", { name: node.name })}
        onChange={(e) => {
          const v = Math.round(Number(e.target.value));
          setLevel(node.id, Number.isFinite(v) ? Math.min(node.maxLevel, Math.max(0, v)) : 0);
        }}
        className="h-11 w-20 shrink-0 rounded-md border border-border bg-background px-2 text-right font-mono text-sm tabular-nums outline-none transition-colors duration-150 focus-visible:border-money focus-visible:ring-2 focus-visible:ring-money/30 sm:h-9"
      />
    </li>
  );
}
