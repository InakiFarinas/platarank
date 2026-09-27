import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { STATION_SEO, stationDescription } from "@/lib/station-seo";
import { RecipePage } from "@/components/recipes/recipe-page";

export const revalidate = 3600;

export const metadata: Metadata = pageMetadata({
  title: STATION_SEO.mount.title,
  description: stationDescription("mount"),
  path: "/es/monturas",
});

export default function MonturasPage() {
  return (
    <RecipePage
      stationType="mount"
      title="Monturas · Américas"
      description="Ranking por plata realizable por día crafteando monturas (animal adulto + materiales). Ninguna ciudad da bono de crafteo a las monturas. Tocá una fila para ver de dónde sale cada número."
    />
  );
}
