import type { Metadata } from "next";
import { Calculator } from "@/components/calculator/calculator";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  title: "Calculadora de crafteo",
  description: "Calculadora de crafteo de Albion Online: costo de materiales, retorno, tarifa de estación e ingreso neto por ítem.",
  alternates: { canonical: "/es/calculadora" },
};

export default function CalculadoraPage() {
  return (
    <>
      <SiteHeader title="Calculadora de crafteo" description="Elegí un ítem y ajustá precios, premium, foco y ciudad. Todo el cálculo es visible." />
      <main className="mx-auto max-w-5xl px-3 pb-8 sm:px-6">
        <Calculator />
        <SiteFooter className="mt-8">
          <p className="text-xs text-muted-foreground">Datos de mercado: Albion Online Data Project.</p>
        </SiteFooter>
      </main>
    </>
  );
}
