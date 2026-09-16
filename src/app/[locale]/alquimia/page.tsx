import type { Metadata } from "next";
import { RecipePage } from "@/components/recipes/recipe-page";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Alquimia",
  description: "Ranking de pociones de Albion Online por plata realizable por dia. 174 recetas, servidor Americas.",
  alternates: { canonical: "/es/alquimia" },
};

export default function AlquimiaPage() {
  return (
    <RecipePage
      stationType="alchemy"
      title="Alquimia -- Americas"
      description="Ranking por plata realizable por dia: margen x volumen diario de ventas. Tocá una fila para ver de dónde sale cada número."
    />
  );
}
