import { computeRecipeRow, DEFAULT_PARAMS } from "@/lib/recipe-math";
import { RecipeExplorer } from "@/components/recipes/recipe-explorer";
import { SiteFooter } from "@/components/site-footer";
import { loadStationData, rankStation, ROW_LIMIT, type StationType } from "@/lib/server/station-data";
import { DEFAULT_FILTERS } from "@/lib/recipe-filters";

/** Stations too big to ship whole to the browser (gear: ~5,700 recipes made a ~50MB page). They
 * send only the top rows and recompute server-side via /api/rank when the player changes something. */
const REMOTE_STATIONS: StationType[] = ["gear"];

export async function RecipePage({
  stationType,
  title,
  description,
}: {
  stationType: StationType;
  title: string;
  description: string;
}) {
  const data = await loadStationData(stationType);
  const categories = [...new Set(data.recipes.map((r) => r.craftingCategory).filter((c): c is string => c !== null))];

  // Reduced with DEFAULT_PARAMS once here (server, at the ISR revalidation cadence) instead of in
  // every visitor's browser on hydration. The client only recomputes once the player changes a
  // control away from the defaults.
  const remote = REMOTE_STATIONS.includes(stationType);

  let content;
  if (remote) {
    const { rows, total } = rankStation(data, DEFAULT_PARAMS, DEFAULT_FILTERS, ROW_LIMIT);
    content = (
      <RecipeExplorer
        recipes={[]}
        marketByItem={{}}
        initialRows={rows}
        totalCount={total}
        categories={categories}
        remoteStation="gear"
        title={title}
        description={description}
      />
    );
  } else {
    const market = new Map(Object.entries(data.marketByItem));
    const initialRows = data.recipes.map((r) => computeRecipeRow(r, market, DEFAULT_PARAMS));
    content = (
      <RecipeExplorer
        recipes={data.recipes}
        marketByItem={data.marketByItem}
        initialRows={initialRows}
        totalCount={initialRows.length}
        categories={categories}
        title={title}
        description={description}
      />
    );
  }

  return (
    <main className="mx-auto max-w-[1600px] px-3 pb-4 sm:px-0 sm:pb-8">
      {content}
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
