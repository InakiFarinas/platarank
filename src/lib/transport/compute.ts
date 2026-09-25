import itemWeights from "@/data/generated/item-weights.json";
import gatheringCapes from "@/data/generated/gathering-capes.json";
import {
  BAG_CAPACITY_KG,
  BASE_MAX_LOAD_KG,
  FOOD_MAXLOAD_BONUS_PCT,
  MOUNTS,
  SHOES_COURIER_RATIO,
  speedAt,
  type MountId,
  type Tier,
} from "./capacity";

const WEIGHTS = itemWeights as Record<string, number>;
type GatheringCapes = Record<string, Record<string, { reductionPct: number; itemIds: string[] }>>;
const CAPES = gatheringCapes as GatheringCapes;

export function itemWeightKg(itemId: string): number | null {
  return WEIGHTS[itemId] ?? null;
}

export type CargoLine = { itemId: string; nameEs: string; qty: number };

export type TransportSetup = {
  bagTier: Tier | null;
  mountId: MountId | null;
  mountTier: Tier | null;
  foodActive: boolean;
  shoesCourierActive: boolean;
  /** Gathering cape equipped, if any -- reduces the weight of its own raw resource, up to its tier. */
  capeCategory: keyof GatheringCapes | null;
  capeTier: Tier | null;
};

export function computeMaxLoadKg(setup: TransportSetup): number {
  let total = BASE_MAX_LOAD_KG;
  if (setup.bagTier !== null) total += BAG_CAPACITY_KG[setup.bagTier] ?? 0;
  if (setup.mountId !== null && setup.mountTier !== null) {
    const mount = MOUNTS.find((m) => m.id === setup.mountId);
    total += mount?.capacityByTier[setup.mountTier] ?? 0;
  }
  if (setup.shoesCourierActive && setup.bagTier !== null) total += (BAG_CAPACITY_KG[setup.bagTier] ?? 0) * SHOES_COURIER_RATIO;
  if (setup.foodActive) total *= 1 + FOOD_MAXLOAD_BONUS_PCT / 100;
  return total;
}

/** The weight-reduction fraction a line's item gets from the equipped gathering cape, 0 when none
 * applies (wrong resource category, or the item's tier is above what this cape tier covers). */
function capeReductionFor(itemId: string, setup: TransportSetup): number {
  if (setup.capeCategory === null || setup.capeTier === null) return 0;
  const entry = CAPES[setup.capeCategory]?.[String(setup.capeTier)];
  if (!entry || !entry.itemIds.includes(itemId)) return 0;
  return entry.reductionPct;
}

export function computeCargoWeightKg(lines: CargoLine[], setup: TransportSetup): number {
  return lines.reduce((sum, line) => {
    const unitWeight = itemWeightKg(line.itemId) ?? 0;
    const reduction = capeReductionFor(line.itemId, setup);
    return sum + unitWeight * (1 - reduction) * line.qty;
  }, 0);
}

export function computeTransportResult(lines: CargoLine[], setup: TransportSetup) {
  const maxLoadKg = computeMaxLoadKg(setup);
  const cargoWeightKg = computeCargoWeightKg(lines, setup);
  const loadPct = maxLoadKg > 0 ? (cargoWeightKg / maxLoadKg) * 100 : Infinity;
  return { maxLoadKg, cargoWeightKg, loadPct, ...speedAt(loadPct) };
}
