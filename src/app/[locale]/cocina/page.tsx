import type { Metadata } from "next";
import { RecipePage } from "@/components/recipes/recipe-page";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Cocina",
  description: "Ranking de platos de Albion Online por plata realizable por dia. 183 recetas, servidor Americas.",
  alternates: { canonical: "/es/cocina" },
};

export default function CocinaPage() {
  return (
    <RecipePage
      stationType="cooking"
      title="Cocina -- Americas"
      description="Ranking por plata realizable por dia cocinando platos que restauran vida/energia. Tocá una fila para ver de dónde sale cada número."
    />
  );
}
