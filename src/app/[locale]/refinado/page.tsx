import type { Metadata } from "next";
import { RecipePage } from "@/components/recipes/recipe-page";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Refinado",
  description: "Ranking de materiales refinados de Albion Online por plata realizable por dia. 115 recetas, servidor Americas.",
  alternates: { canonical: "/es/refinado" },
};

export default function RefinadoPage() {
  return (
    <RecipePage
      stationType="refining"
      title="Refinado -- Americas"
      description="Ranking por plata realizable por dia refinando madera, fibra, mineral, cuero y piedra. Tocá una fila para ver de dónde sale cada número."
    />
  );
}
