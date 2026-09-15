import Link from "next/link";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { recipes as recipesTable, marketAggregates } from "@/lib/db/schema";
import type { CityPricePoint } from "@/lib/recipe-math";
import { RecipeExplorer } from "@/components/recipes/recipe-explorer";

const NAV_ITEMS = [
  { href: "/es/alquimia", label: "Alquimia" },
  { href: "/es/refinado", label: "Refinado" },
] as const;

export async function RecipePage({
  stationType,
  title,
  description,
}: {
  stationType: "alchemy" | "refining";
  title: string;
  description: string;
}) {
  const [recipeRows, aggregateRows] = await Promise.all([
    db.select().from(recipesTable).where(eq(recipesTable.stationType, stationType)),
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
        <nav className="mb-2 flex gap-4 text-xs">
          {NAV_ITEMS.map((item) => (
            <Link key={item.href} href={item.href} className="text-muted-foreground hover:text-foreground">
              {item.label}
            </Link>
          ))}
        </nav>
        <h1 className="text-lg font-semibold tracking-tight sm:text-xl">{title}</h1>
        <p className="text-sm text-muted-foreground">{description}</p>
      </header>
      <RecipeExplorer recipes={recipeRows} marketByItem={marketByItem} stationType={stationType} />
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
