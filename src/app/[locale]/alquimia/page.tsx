import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { STATION_SEO, stationDescription } from "@/lib/station-seo";
import { RecipePage } from "@/components/recipes/recipe-page";

export const revalidate = 3600;

export const metadata: Metadata = pageMetadata({
  title: STATION_SEO.alchemy.title,
  description: stationDescription("alchemy"),
  path: "/es/alquimia",
});

export default function AlquimiaPage() {
  return (
    <RecipePage
      stationType="alchemy"
      title="Alquimia · Américas"
      description="Ranking por plata realizable por día: margen x volumen diario de ventas. Tocá una fila para ver de dónde sale cada número."
    />
  );
}
