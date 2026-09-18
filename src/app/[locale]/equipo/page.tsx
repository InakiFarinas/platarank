import type { Metadata } from "next";
import { RecipePage } from "@/components/recipes/recipe-page";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Armas y armaduras",
  description:
    "Ranking de equipo de Albion Online por plata realizable por dia, ponderando las 5 calidades por liquidez real. ~5.700 recetas, servidor Americas.",
  alternates: { canonical: "/es/equipo" },
};

export default function EquipoPage() {
  return (
    <RecipePage
      stationType="gear"
      title="Armas y armaduras -- Americas"
      description="Ranking por plata realizable por dia crafteando equipo. El precio de venta pondera las 5 calidades por los pesos base del juego, y descarta las que no tienen liquidez real. Tocá una fila para ver de dónde sale cada número."
    />
  );
}
