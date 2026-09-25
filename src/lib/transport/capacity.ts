// Carry-capacity numbers for the transport calculator. NOT derivable from ao-bin-dumps: bag/mount/
// shoe max-load bonuses are all one shared "Courier" passive (spells.json's PASSIVE_MAXLOAD family)
// whose kg value scales off the item's item power through a curve the dumps never expose -- only
// the gathering-cape weight REDUCTION (src/data/generated/gathering-capes.json) is parseable, see
// docs/transport-data.md. These are the finished numbers from the community-maintained wiki
// (wiki.albiononline.com/wiki/Mounts, /wiki/Max_Load, /wiki/Weight_and_Burden, checked 2026-09-23),
// which change only when Sandbox rebalances the mechanic, not on every patch.

/** Every player starts here, mounted or not, before any bag/mount/shoe bonus. */
export const BASE_MAX_LOAD_KG = 50;

export type Tier = 2 | 3 | 4 | 5 | 6 | 7 | 8;

/** Normal-quality bag, no enchantment -- quality/enchantment only push this higher, never lower. */
export const BAG_CAPACITY_KG: Partial<Record<Tier, number>> = {
  2: 40,
  3: 85,
  4: 151,
  5: 195,
  6: 249,
  7: 300,
  8: 361,
};

/** Shoes carry the exact same "Courier" passive as bags (spells.json: PASSIVE_MAXLOAD_SHOES,
 * buff value 0.3, vs a bag's own PASSIVE_MAXLOAD at buff value 1.0) -- so this is that ratio applied
 * to BAG_CAPACITY_KG, not an independently confirmed number. Flagged as an estimate in the UI. It is
 * a player-chosen passive on the boot, not automatic -- see the "Courier equipado" toggle. */
export const SHOES_COURIER_RATIO = 0.3;

export type MountId = "horse" | "ox" | "mule" | "direboar" | "giant_stag" | "swamp_dragon";

export type MountOption = {
  id: MountId;
  label: string;
  /** Tiers this specific mount line exists at, each with its own carry bonus in kg. */
  capacityByTier: Partial<Record<Tier, number>>;
  /** "courier": bonus applies even dismounted, just by owning/equipping the mount (like a bag).
   * "mounted": bonus only while actively riding it -- dismount and it's gone. */
  kind: "courier" | "mounted";
  /** True when this mount also grants a real move-speed bonus worth factoring into a route -- the
   * ones that don't (oxen, mules) trade all their speed for capacity. */
  hasSpeedBonus: boolean;
};

export const MOUNTS: MountOption[] = [
  {
    id: "horse",
    label: "Caballo de monta",
    kind: "courier",
    hasSpeedBonus: true,
    capacityByTier: { 3: 72, 4: 94, 5: 122, 6: 156, 7: 197, 8: 247 },
  },
  {
    id: "ox",
    label: "Buey de transporte",
    kind: "mounted",
    hasSpeedBonus: false,
    capacityByTier: { 3: 1503, 4: 1655, 5: 1901, 6: 2237, 7: 2667, 8: 3200 },
  },
  {
    id: "mule",
    label: "Mula novata",
    kind: "courier",
    hasSpeedBonus: true,
    capacityByTier: { 2: 53 },
  },
  {
    id: "direboar",
    label: "Jabalí feroz",
    kind: "mounted",
    hasSpeedBonus: true,
    capacityByTier: { 7: 1261 },
  },
  {
    id: "giant_stag",
    label: "Ciervo gigante",
    kind: "mounted",
    hasSpeedBonus: true,
    capacityByTier: { 4: 227 },
  },
  {
    id: "swamp_dragon",
    label: "Dragón de pantano",
    kind: "mounted",
    hasSpeedBonus: true,
    capacityByTier: { 7: 630 },
  },
];

/** Chicken Pie's bonus (the cheapest common one) -- a real number, but time-limited (30 min), so it
 * is an opt-in toggle, not a silent default. Higher-tier pies give more; this is a floor. */
export const FOOD_MAXLOAD_BONUS_PCT = 10;

/** Movement speed at increasing encumbrance -- wiki.albiononline.com/wiki/Weight_and_Burden. */
export const OVERWEIGHT_TIERS: { maxPct: number; speedMs: number; label: string }[] = [
  { maxPct: 100, speedMs: 5.5, label: "Velocidad normal" },
  { maxPct: 130, speedMs: 4.4, label: "Reducida" },
  { maxPct: 160, speedMs: 2.75, label: "Reducida (sin galope)" },
  { maxPct: 180, speedMs: 1.65, label: "Muy reducida" },
  { maxPct: 200, speedMs: 0.83, label: "Casi inmóvil" },
  { maxPct: 800, speedMs: 0.44, label: "Casi inmóvil" },
  { maxPct: Infinity, speedMs: 0, label: "No podés moverte" },
];

export function speedAt(loadPct: number): { speedMs: number; label: string } {
  const tier = OVERWEIGHT_TIERS.find((t) => loadPct <= t.maxPct) ?? OVERWEIGHT_TIERS[OVERWEIGHT_TIERS.length - 1];
  return { speedMs: tier.speedMs, label: tier.label };
}
