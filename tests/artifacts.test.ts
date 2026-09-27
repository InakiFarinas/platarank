import { describe, expect, it } from "vitest";
import { computeRoll } from "@/lib/artifacts";
import { netSellMultiplier } from "@/lib/formulas/market-tax";

describe("computeRoll", () => {
  it("averages net prices uniformly and ignores unpriced artifacts", () => {
    const r = computeRoll(1000, 36, [100_000, 20_000, null]);
    const k = netSellMultiplier();
    expect(r.cost).toBe(36_000);
    expect(r.pricedCount).toBe(2);
    expect(r.poolSize).toBe(3);
    expect(r.expectedNet).toBeCloseTo(60_000 * k);
    expect(r.profit).toBeCloseTo(60_000 * k - 36_000);
    expect(r.worstNet).toBeCloseTo(20_000 * k);
    expect(r.bestNet).toBeCloseTo(100_000 * k);
    expect(r.lossShare).toBe(0.5);
  });

  it("has no verdict without a fragment price or any artifact price", () => {
    expect(computeRoll(null, 50, [1000]).profit).toBeNull();
    expect(computeRoll(10, 50, [null]).expectedNet).toBeNull();
  });
});
