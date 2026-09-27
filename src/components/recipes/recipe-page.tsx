import { computeRecipeRow, DEFAULT_PARAMS } from "@/lib/recipe-math";
import { RecipeExplorer } from "@/components/recipes/recipe-explorer";
import { SiteFooter } from "@/components/site-footer";
import { loadRankSnapshot, loadStationData, rankStation, ROW_LIMIT, type StationType } from "@/lib/server/station-data";
import recipesJson from "@/data/generated/recipes.json";
import { DEFAULT_FILTERS } from "@/lib/recipe-filters";
import { breadcrumbSchema, faqSchema, FaqList, JsonLd } from "@/components/json-ld";
import { getTranslations } from "next-intl/server";
import { localePath, stationRoute, type Locale } from "@/i18n/config";
import { absoluteUrl } from "@/lib/seo";
import { getStationSeo, stationFaqs } from "@/lib/station-seo";

/** Stations too big to ship whole to the browser (gear: ~5,700 recipes made a ~50MB page). They
 * send only the top rows and recompute server-side via /api/rank when the player changes something. */
const REMOTE_STATIONS: StationType[] = ["gear"];

export async function RecipePage({
  stationType,
  locale,
  title,
  description,
}: {
  stationType: StationType;
  locale: Locale;
  title: string;
  description: string;
}) {
  // Categories only feed the city-bonus badges, and recipes.json already has them -- no DB read.
  const categories = [
    ...new Set((recipesJson as { stationType: string; craftingCategory: string | null }[]).filter((r) => r.stationType === stationType).map((r) => r.craftingCategory).filter((c): c is string => c !== null)),
  ];

  // Reduced with DEFAULT_PARAMS once here (server, at the ISR revalidation cadence) instead of in
  // every visitor's browser on hydration. The client only recomputes once the player changes a
  // control away from the defaults.
  const remote = REMOTE_STATIONS.includes(stationType);

  let content;
  if (remote) {
    // Precomputed by the ingester; the fallback (first deploy, before its first run) loads everything.
    const { rows, total } = (await loadRankSnapshot(stationType)) ?? rankStation(await loadStationData(stationType), DEFAULT_PARAMS, DEFAULT_FILTERS, ROW_LIMIT);
    content = (
      <RecipeExplorer
        recipes={[]}
        marketByItem={{}}
        initialRows={rows}
        totalCount={total}
        categories={categories}
        stationType={stationType}
        remoteStation="gear"
        title={title}
        description={description}
      />
    );
  } else {
    const data = await loadStationData(stationType);
    const market = new Map(Object.entries(data.marketByItem));
    const initialRows = data.recipes.map((r) => computeRecipeRow(r, market, DEFAULT_PARAMS));
    content = (
      <RecipeExplorer
        recipes={data.recipes}
        marketByItem={data.marketByItem}
        initialRows={initialRows}
        totalCount={initialRows.length}
        categories={categories}
        stationType={stationType}
        title={title}
        description={description}
      />
    );
  }

  return (
    <main id="contenido" className="mx-auto max-w-[1600px] px-3 pb-4 sm:px-6 sm:pb-8 lg:px-8">
      {content}
      <StationInfo stationType={stationType} locale={locale} />
      <Footer locale={locale} />
    </main>
  );
}

async function Footer({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: "stations" });
  return (
    <SiteFooter className="mt-8">
      <p className="text-xs text-muted-foreground">
        {t("footer.marketData")}{" "}
        <a
          href="https://www.albion-online-data.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-2 hover:text-foreground"
        >
          The Albion Online Data Project
        </a>
        {t("footer.recipes")}
      </p>
    </SiteFooter>
  );
}

async function StationInfo({ stationType, locale }: { stationType: StationType; locale: Locale }) {
  const t = await getTranslations({ locale, namespace: "stations" });
  const seo = await getStationSeo(stationType, locale);
  const faqs = await stationFaqs(stationType, locale);
  return (
    <>
      <JsonLd data={faqSchema(faqs)} />
      <JsonLd
        data={breadcrumbSchema([
          { name: "PlataRank", url: absoluteUrl(localePath(locale)) },
          { name: seo.name, url: absoluteUrl(localePath(locale, stationRoute(stationType))) },
        ])}
      />
      <section className="mt-12 max-w-3xl">
        <h2 className="font-display text-2xl uppercase tracking-tight sm:text-3xl">{t("info.heading", { name: seo.name.toLocaleLowerCase(locale) })}</h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{seo.intro}</p>
        <FaqList faqs={faqs} className="mt-10" />
      </section>
    </>
  );
}
