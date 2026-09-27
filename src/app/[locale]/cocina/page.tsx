import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { STATION_SEO, stationDescription } from "@/lib/station-seo";
import { RecipePage } from "@/components/recipes/recipe-page";

export const revalidate = 3600;

export const metadata: Metadata = pageMetadata({
  title: STATION_SEO.cooking.title,
  description: stationDescription("cooking"),
  path: "/es/cocina",
});

export default function CocinaPage() {
  return (
    <RecipePage
      stationType="cooking"
      title="Cocina · Américas"
      description="Ranking por plata realizable por día cocinando platos que restauran vida/energia. Tocá una fila para ver de dónde sale cada número."
    />
  );
}
