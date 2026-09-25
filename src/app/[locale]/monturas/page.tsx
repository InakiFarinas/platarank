import type { Metadata } from "next";
import { RecipePage } from "@/components/recipes/recipe-page";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Monturas",
  description: "Ranking de monturas de Albion Online por plata realizable por dia. 29 recetas, servidor Americas.",
  alternates: { canonical: "/es/monturas" },
};

export default function MonturasPage() {
  return (
    <RecipePage
      stationType="mount"
      title="Monturas -- Americas"
      description="Ranking por plata realizable por dia crafteando monturas (animal adulto + materiales). Ninguna ciudad da bono de crafteo a las monturas. Tocá una fila para ver de dónde sale cada número."
    />
  );
}
