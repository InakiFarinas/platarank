import { RecipePage } from "@/components/recipes/recipe-page";

export const revalidate = 300;

export default function EquipoPage() {
  return (
    <RecipePage
      stationType="gear"
      title="Armas y armaduras -- Americas"
      description="Ranking por plata realizable por dia crafteando equipo. El precio de venta pondera las 5 calidades por tu distribucion asumida, y descarta las que no tienen liquidez real. Tocá una fila para ver de dónde sale cada número."
    />
  );
}
