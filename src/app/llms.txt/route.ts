import { DISCORD_URL, SITE_URL } from "@/lib/seo";

// Plain-text site summary for LLM crawlers (llmstxt.org convention).
export const dynamic = "force-static";

const BODY = `# PlataRank

> Ranking de crafteo de Albion Online (servidor Américas) por plata realizable por día: ganancia por unidad × volumen diario de ventas × cuota de mercado, no por margen unitario. Los precios se actualizan cada hora. Herramienta no oficial, sin afiliación con Sandbox Interactive.

## Rankings por estación
- [Alquimia](${SITE_URL}/es/alquimia): pociones
- [Refinado](${SITE_URL}/es/refinado): tablas, lingotes, tela, cuero y piedra
- [Cocina](${SITE_URL}/es/cocina): comidas
- [Equipo](${SITE_URL}/es/equipo): armas, armaduras, bolsas y capas, ponderando las 5 calidades
- [Monturas](${SITE_URL}/es/monturas): animales de montura

## Páginas por receta
- ${SITE_URL}/es/receta/{itemId}: costo, ganancia y plata por día de una receta concreta (por ejemplo T4_2H_BOW), con sus materiales y precios

## Herramientas
- [Calculadora de crafteo](${SITE_URL}/es/calculadora): costo de materiales, retorno de recursos, tarifa de estación, impuestos e ingreso neto de un ítem

## Documentación
- [Metodología](${SITE_URL}/es/metodologia): fuentes de datos, filtrado de precios, retorno, tarifa de estación, impuestos y limitaciones conocidas
- [Acerca de](${SITE_URL}/es/acerca)
- [Privacidad](${SITE_URL}/es/privacidad)
- [Términos](${SITE_URL}/es/terminos)

## Fuentes de datos
- Precios de mercado: Albion Online Data Project (https://www.albion-online-data.com/)
- Recetas: dump oficial del cliente (ao-bin-dumps)

## Comunidad
- [Discord](${DISCORD_URL})
`;

export function GET() {
  return new Response(BODY, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
