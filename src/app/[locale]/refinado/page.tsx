import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { STATION_SEO, stationDescription } from "@/lib/station-seo";
import { RecipePage } from "@/components/recipes/recipe-page";

export const revalidate = 3600;

export const metadata: Metadata = pageMetadata({
  title: STATION_SEO.refining.title,
  description: stationDescription("refining"),
  path: "/es/refinado",
});

export default function RefinadoPage() {
  return (
    <RecipePage
      stationType="refining"
      title="Refinado · Américas"
      description="Ranking por plata realizable por día refinando madera, fibra, mineral, cuero y piedra. Tocá una fila para ver de dónde sale cada número."
    />
  );
}
