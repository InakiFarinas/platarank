import { RecipePage } from "@/components/recipes/recipe-page";

export const revalidate = 300;

export default function CocinaPage() {
  return (
    <RecipePage
      stationType="cooking"
      title="Cocina -- Americas"
      description="Ranking por plata realizable por dia cocinando platos que restauran vida/energia. Tocá una fila para ver de dónde sale cada número."
    />
  );
}
