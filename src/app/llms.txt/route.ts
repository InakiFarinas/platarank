import { DISCORD_URL, SITE_URL } from "@/lib/seo";

// Plain-text site summary for LLM crawlers (llmstxt.org convention).
export const dynamic = "force-static";

const BODY_ES = `# PlataRank

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

const BODY_EN = `# PlataRank

> Albion Online crafting ranking (Americas server) by realizable silver per day: profit per unit × daily sales volume × market share, not per-unit margin. Prices refresh hourly. Unofficial tool, not affiliated with Sandbox Interactive.

## Rankings by station
- [Alchemy](${SITE_URL}/en/alchemy): potions
- [Refining](${SITE_URL}/en/refining): planks, bars, cloth, leather and stone
- [Cooking](${SITE_URL}/en/cooking): meals
- [Gear](${SITE_URL}/en/gear): weapons, armor, bags and capes, weighting all 5 qualities
- [Mounts](${SITE_URL}/en/mounts): mount animals

## Per-recipe pages
- ${SITE_URL}/en/recipe/{itemId}: cost, profit and silver per day of a specific recipe (for example T4_2H_BOW), with its materials and prices

## Tools
- [Crafting calculator](${SITE_URL}/en/calculator): material cost, resource return, station fee, taxes and net income of an item

## Documentation
- [Methodology](${SITE_URL}/en/methodology): data sources, price filtering, return, station fee, taxes and known limitations
- [About](${SITE_URL}/en/about)
- [Privacy](${SITE_URL}/en/privacy)
- [Terms](${SITE_URL}/en/terms)

## Data sources
- Market prices: Albion Online Data Project (https://www.albion-online-data.com/)
- Recipes: official client dump (ao-bin-dumps)

## Community
- [Discord](${DISCORD_URL})
`;

const BODY_PT = `# PlataRank

> Ranking de criação de Albion Online (servidor Américas) por prata realizável por dia: lucro por unidade × volume diário de vendas × fatia de mercado, não por margem unitária. Os preços são atualizados a cada hora. Ferramenta não oficial, sem afiliação com a Sandbox Interactive.

## Rankings por estação
- [Alquimia](${SITE_URL}/pt/alquimia): poções
- [Refino](${SITE_URL}/pt/refino): tábuas, barras, tecido, couro e pedra
- [Culinária](${SITE_URL}/pt/culinaria): comidas
- [Equipamento](${SITE_URL}/pt/equipamento): armas, armaduras, bolsas e capas, ponderando as 5 qualidades
- [Montarias](${SITE_URL}/pt/montarias): animais de montaria

## Páginas por receita
- ${SITE_URL}/pt/receita/{itemId}: custo, lucro e prata por dia de uma receita específica (por exemplo T4_2H_BOW), com seus materiais e preços

## Ferramentas
- [Calculadora de criação](${SITE_URL}/pt/calculadora): custo de materiais, retorno de recursos, taxa de estação, impostos e receita líquida de um item

## Documentação
- [Metodologia](${SITE_URL}/pt/metodologia): fontes de dados, filtragem de preços, retorno, taxa de estação, impostos e limitações conhecidas
- [Sobre](${SITE_URL}/pt/sobre)
- [Privacidade](${SITE_URL}/pt/privacidade)
- [Termos](${SITE_URL}/pt/termos)

## Fontes de dados
- Preços de mercado: Albion Online Data Project (https://www.albion-online-data.com/)
- Receitas: dump oficial do cliente (ao-bin-dumps)

## Comunidade
- [Discord](${DISCORD_URL})
`;

export function GET() {
  const BODY = `${BODY_ES}
---

${BODY_EN}
---

${BODY_PT}`;
  return new Response(BODY, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
