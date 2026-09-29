"use client";

import { useId } from "react";
import { useTranslations } from "next-intl";
import { Segmented } from "@/components/calculator/ui";
import { BIOMES, MAX_POWER_LEVEL, biomeSpecialties, type Biome, type HideoutSite } from "@/lib/formulas/craft-site";

/** The hideout's own settings: black zone quality (or Roads of Avalon), biome and Power Level, which
 * together decide its crafting bonus (src/lib/formulas/craft-site.ts). */
export function HideoutControls({
  site,
  onChange,
  refining,
  specialty,
}: {
  site: HideoutSite;
  onChange: (site: HideoutSite) => void;
  refining: boolean;
  /** Whether the chosen hideout counts this item as a specialty (computed by the caller). */
  specialty: boolean;
}) {
  const t = useTranslations("calculator.site");
  const biomeId = useId();
  const road = site.zone === 0;

  return (
    <div className="grid gap-4">
      <Segmented
        label={t("zone")}
        value={site.zone}
        options={[1, 2, 3, 4, 5, 6].map((q) => ({ value: q, text: `Q${q}`, title: t("zoneQuality", { q }) })).concat({ value: 0, text: t("roadShort"), title: t("road") })}
        onChange={(zone) => onChange({ ...site, zone })}
      />
      {road ? (
        <Segmented
          label={refining ? t("roadResource") : t("roadSpecialty")}
          value={site.roadSpecialty ? "si" : "no"}
          options={[
            { value: "si", text: t("yes") },
            { value: "no", text: t("no") },
          ]}
          onChange={(v) => onChange({ ...site, roadSpecialty: v === "si" })}
        />
      ) : (
        <div>
          <label htmlFor={biomeId} className="text-xs text-muted-foreground">
            {t("biome")}
          </label>
          <select
            id={biomeId}
            value={site.biome}
            onChange={(e) => onChange({ ...site, biome: e.target.value as Biome })}
            className="mt-1 h-11 w-full rounded-md border border-border bg-background px-2.5 text-sm outline-none transition-colors duration-150 focus-visible:border-money focus-visible:ring-2 focus-visible:ring-money/30 sm:h-9"
          >
            {BIOMES.map((b) => (
              <option key={b} value={b}>
                {t(`biomes.${b}`)}
              </option>
            ))}
          </select>
          {!refining && (
            <p className="mt-1 text-xs text-muted-foreground">
              {t("biomeSpecialties", { list: biomeSpecialties(site.biome).map((c) => t(`categories.${c}`)).join(", ") })}
            </p>
          )}
        </div>
      )}
      {!refining && (
        <Segmented
          label={t("power")}
          value={site.power}
          options={Array.from({ length: MAX_POWER_LEVEL }, (_, i) => ({ value: i + 1, text: String(i + 1), title: t("powerLevel", { level: i + 1 }) }))}
          onChange={(power) => onChange({ ...site, power })}
        />
      )}
      <p className="text-xs text-muted-foreground">
        {refining ? t("refiningNote") : specialty ? t("isSpecialty") : t("notSpecialty")}
      </p>
    </div>
  );
}
