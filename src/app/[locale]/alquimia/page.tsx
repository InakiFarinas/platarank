import { RecipePage } from "@/components/recipes/recipe-page";

export const revalidate = 300;

export default function AlquimiaPage() {
  return (
    <RecipePage
      stationType="alchemy"
      title="Alquimia -- Americas"
      description="Ranking por plata realizable por dia: margen x volumen diario del mercado. Tocá una fila para ver de dónde sale cada número."
    />
  );
}
