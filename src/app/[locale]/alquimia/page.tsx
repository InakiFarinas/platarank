import { db } from "@/lib/db/client";
import { recipes as recipesTable, marketAggregates } from "@/lib/db/schema";
import { computeRecipeRow, type AggregateLookup } from "@/lib/recipe-math";
import { AlchemyTable } from "@/components/alchemy/alchemy-table";

export const revalidate = 300;

export default async function AlquimiaPage() {
  const [recipeRows, aggregateRows] = await Promise.all([
    db.select().from(recipesTable),
    db.select().from(marketAggregates),
  ]);

  const lookup: AggregateLookup = new Map(
    aggregateRows.map((a) => [
      a.itemId,
      {
        sellRefPrice: a.sellRefPrice != null ? Number(a.sellRefPrice) : null,
        sellRefAgeSeconds: a.sellRefAgeSeconds,
        sellRefCitiesCount: a.sellRefCitiesCount,
        buyRefPrice: a.buyRefPrice != null ? Number(a.buyRefPrice) : null,
        avgDailyVolume30d: Number(a.avgDailyVolume30d),
        qualityScore: a.qualityScore,
        brecilienCovered: a.brecilienCovered,
        discarded: a.discarded,
      },
    ]),
  );

  const rows = recipeRows
    .map((recipe) => computeRecipeRow(recipe, lookup))
    .sort((a, b) => (b.platinumPerDay ?? -Infinity) - (a.platinumPerDay ?? -Infinity));

  return (
    <main className="mx-auto max-w-5xl px-3 py-4 sm:px-6 sm:py-8">
      <header className="mb-4 sm:mb-6">
        <h1 className="text-lg font-semibold tracking-tight sm:text-xl">Alquimia -- Americas</h1>
        <p className="text-sm text-muted-foreground">
          Ranking por plata realizable por dia: margen x volumen diario del mercado. Tocá una fila para ver de dónde
          sale cada número.
        </p>
      </header>
      <AlchemyTable rows={rows} />
      <Footer />
    </main>
  );
}

function Footer() {
  return (
    <footer className="mt-8 border-t border-border pt-4 text-xs text-muted-foreground">
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
    </footer>
  );
}
