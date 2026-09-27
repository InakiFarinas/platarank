import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { breadcrumbSchema, JsonLd } from "@/components/json-ld";
import { absoluteUrl } from "@/lib/seo";
import { Calculator } from "@/components/calculator/calculator";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = pageMetadata({
  title: "Calculadora de crafteo de Albion Online",
  description:
    "Calculadora de crafteo de Albion Online: costo de materiales, retorno de recursos, foco, tarifa de estación, impuestos e ingreso neto por ítem, con enlaces para compartir.",
  path: "/es/calculadora",
});

export default function CalculadoraPage() {
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebApplication",
          name: "Calculadora de crafteo de PlataRank",
          url: absoluteUrl("/es/calculadora"),
          applicationCategory: "GameApplication",
          operatingSystem: "Web",
          inLanguage: "es",
          description: "Calcula costo de materiales, retorno de recursos, tarifa de estación, impuestos e ingreso neto de un ítem de Albion Online.",
          offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
        }}
      />
      <JsonLd data={breadcrumbSchema([{ name: "PlataRank", url: absoluteUrl("/es") }, { name: "Calculadora", url: absoluteUrl("/es/calculadora") }])} />
      <SiteHeader title="Calculadora de crafteo" description="Elegí un ítem y ajustá precios, premium, foco y ciudad. Todo el cálculo es visible." />
      <main id="contenido" className="mx-auto max-w-5xl px-3 pb-8 sm:px-6">
        <Calculator />
        <SiteFooter className="mt-8">
          <p className="text-xs text-muted-foreground">Datos de mercado: Albion Online Data Project.</p>
        </SiteFooter>
      </main>
    </>
  );
}
