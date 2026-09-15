import { db } from "@/lib/db/client";
import { recipes as recipesTable, marketAggregates } from "@/lib/db/schema";
import type { CityPricePoint } from "@/lib/recipe-math";
import { AlchemyExplorer } from "@/components/alchemy/alchemy-explorer";

export const revalidate = 300;

export default async function AlquimiaPage() {
  const [recipeRows, aggregateRows] = await Promise.all([
    db.select().from(recipesTable),
    db.select().from(marketAggregates),
  ]);

  const marketByItem: Record<string, CityPricePoint[]> = {};
  for (const a of aggregateRows) {
    const point: CityPricePoint = {
      city: a.city,
      price: a.price != null ? Number(a.price) : null,
      priceAgeSeconds: a.priceAgeSeconds,
      avgDailyVolume30d: Number(a.avgDailyVolume30d),
      daysWithVolume30d: a.daysWithVolume30d,
      weightedAvgPrice30d: a.weightedAvgPrice30d != null ? Number(a.weightedAvgPrice30d) : null,
    };
    (marketByItem[a.itemId] ??= []).push(point);
  }

  return (
    <main className="mx-auto max-w-5xl px-3 py-4 sm:px-6 sm:py-8">
      <header className="sticky top-0 z-20 -mx-3 mb-4 border-b border-border bg-background/95 px-3 py-3 backdrop-blur sm:-mx-6 sm:mb-6 sm:px-6">
        <h1 className="text-lg font-semibold tracking-tight sm:text-xl">Alquimia -- Americas</h1>
        <p className="text-sm text-muted-foreground">
          Ranking por plata realizable por dia: margen x volumen diario del mercado. Tocá una fila para ver de dónde
          sale cada número.
        </p>
      </header>
      <AlchemyExplorer recipes={recipeRows} marketByItem={marketByItem} />
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
