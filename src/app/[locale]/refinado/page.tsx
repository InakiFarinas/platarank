import { RecipePage } from "@/components/recipes/recipe-page";

export const revalidate = 300;

export default function RefinadoPage() {
  return (
    <RecipePage
      stationType="refining"
      title="Refinado -- Americas"
      description="Ranking por plata realizable por dia refinando madera, fibra, mineral, cuero y piedra. Tocá una fila para ver de dónde sale cada número."
    />
  );
}
