import { eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { recipes as recipesTable, marketAggregates } from "@/lib/db/schema";
import { computeRecipeRow, DEFAULT_PARAMS, type CityPricePoint } from "@/lib/recipe-math";
import { RecipeExplorer } from "@/components/recipes/recipe-explorer";
import { SiteFooter } from "@/components/site-footer";

export async function RecipePage({
  stationType,
  title,
  description,
}: {
  stationType: "alchemy" | "refining" | "cooking" | "gear" | "mount";
  title: string;
  description: string;
}) {
  const recipeRows = await db.select().from(recipesTable).where(eq(recipesTable.stationType, stationType));

  const relevantItemIds = new Set<string>();
  for (const r of recipeRows) {
    relevantItemIds.add(r.itemId);
    for (const m of r.materials) relevantItemIds.add(m.itemId);
  }

  // Fetch only the aggregates this page's recipes actually reference -- with thousands of gear
  // items across the whole game, pulling the entire table for every rubro would balloon payload
  // and query time for no reason.
  const aggregateRows =
    relevantItemIds.size > 0
      ? await db
          .select()
          .from(marketAggregates)
          .where(inArray(marketAggregates.itemId, [...relevantItemIds]))
      : [];

  const marketByItem: Record<string, CityPricePoint[]> = {};
  for (const a of aggregateRows) {
    const point: CityPricePoint = {
      city: a.city,
      quality: a.quality,
      price: a.price != null ? Number(a.price) : null,
      priceAgeSeconds: a.priceAgeSeconds,
      avgDailyVolume30d: Number(a.avgDailyVolume30d),
      daysWithVolume30d: a.daysWithVolume30d,
      weightedAvgPrice30d: a.weightedAvgPrice30d != null ? Number(a.weightedAvgPrice30d) : null,
    };
    (marketByItem[a.itemId] ??= []).push(point);
  }

  // Reduced with DEFAULT_PARAMS once here (server, at the ISR revalidation cadence) instead of in
  // every visitor's browser on hydration -- for /equipo's ~5,632 rows x 5 qualities that recompute
  // was measured at 10-20+ seconds on first paint. The client only re-runs computeRecipeRow itself
  // once the player actually changes a control away from the defaults.
  const market = new Map(Object.entries(marketByItem));
  const initialRows = recipeRows.map((r) => computeRecipeRow(r, market, DEFAULT_PARAMS));

  return (
    <main className="mx-auto max-w-[1600px] px-3 pb-4 sm:px-0 sm:pb-8">
      <RecipeExplorer
        recipes={recipeRows}
        marketByItem={marketByItem}
        initialRows={initialRows}
        title={title}
        description={description}
      />
      <Footer />
    </main>
  );
}

function Footer() {
  return (
    <SiteFooter className="mt-8">
      <p className="text-xs text-muted-foreground">
        Datos de mercado cortesía de{" "}
        <a
          href="https://www.albion-online-data.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-2 hover:text-foreground"
        >
          The Albion Online Data Project
        </a>
        . Recetas extraídas del dump oficial del cliente (ao-bin-dumps).
      </p>
    </SiteFooter>
  );
}
