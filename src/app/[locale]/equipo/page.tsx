import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { STATION_SEO, stationDescription } from "@/lib/station-seo";
import { RecipePage } from "@/components/recipes/recipe-page";

export const revalidate = 3600;

export const metadata: Metadata = pageMetadata({
  title: STATION_SEO.gear.title,
  description: stationDescription("gear"),
  path: "/es/equipo",
});

export default function EquipoPage() {
  return (
    <RecipePage
      stationType="gear"
      title="Armas y armaduras · Américas"
      description="Ranking por plata realizable por día crafteando equipo. El precio de venta pondera las 5 calidades por los pesos base del juego, y descarta las que no tienen liquidez real. Tocá una fila para ver de dónde sale cada número."
    />
  );
}
