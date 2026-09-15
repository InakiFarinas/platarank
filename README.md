# PlataRank

Ranking de crafteo (alquimia, refinado, cocina) en [Albion Online](https://albiononline.com/) por **plata realizable por día**, no por margen unitario.

## La tesis

Casi todas las herramientas de mercado de Albion responden "¿cuánta ganancia deja una unidad de este ítem?". Esa es la pregunta equivocada: si crafteás 400 pociones y el mercado absorbe 12 por día, un 200% de ROI vale menos que un 40% sobre algo que mueve 5.000 unidades diarias.

PlataRank mete el volumen diario de trades (expuesto desde siempre por la API pública, casi nunca usado) dentro de la matemática del crafteo: **ganancia unitaria × volumen diario del mercado × la cuota que asumís llevarte**. El resto del producto se ordena alrededor de tres cosas:

1. **Mostrar el trabajo.** Cada fila lleva un score de calidad de dato visible y se puede abrir para ver la derivación completa: qué precio se usó, de qué ciudad, de cuándo, y qué se descartó como outlier y por qué.
2. **Fee de estación correcto.** Plata por cada 100 de nutrición consumida (no un porcentaje plano), con una fórmula específica por tipo de estación -- alquimia y cocina dependen de los materiales de la receta (granja, carne, pescado), refinado depende solo del tier y el encantamiento.
3. **Datos de mercado sucios, tratados como tal.** Recorte de outliers asimétrico, mediana entre ciudades (nunca el máximo), Brecilien marcado explícitamente cuando no cotiza.

## Estado (Fase 3, parcial)

- Un servidor (Americas), sin cuentas ni pagos.
- Tres rubros ya en producción: **alquimia** (`/alquimia`, 174 recetas), **refinado** (`/refinado`, 115 recetas: madera/fibra/mineral/cuero/piedra -> tablas/tela/lingotes/cuero curtido/bloques, tiers 2-8, encantamiento 0-4) y **cocina** (`/cocina`, 183 recetas: platos con pescado y carne). 678 ítems con precio en total. Armas, armaduras y herramientas quedan para una próxima iteración -- necesitan sumar la dimensión de calidad (5 niveles) que ninguno de los tres rubros actuales tiene, y ciudades de especialidad de crafteo por tipo de arma/armadura que no verifiqué.
- Restricciones reales activas en los tres rubros: ciudades de compra y de venta por separado (Black Market como opt-in explícito, no una ciudad más), cuota de mercado editable, foco on/off, tarifa de estación editable, filtros de antigüedad y volumen mínimo. Refinado y cocina además tienen su propio toggle de "especialidad" (ya que, a diferencia de alquimia -- una sola ciudad posible, Brecilien, ya verificada -- no tengo confirmada la ciudad de especialidad real de cada recurso de refinado ni de cocina). Todo es estado de sesión en el navegador (panel "Filtros"), no persiste entre recargas.
- Sin golden cases todavía: las fórmulas de fee/retorno están implementadas contra fuentes públicas pero no verificadas contra capturas del juego. Ver `fixtures/golden-cases.json` y `tests/golden-cases.test.ts`.

## Stack

Next.js 15 (App Router) + TypeScript · Tailwind + shadcn/ui · TanStack Virtual · Supabase (Postgres) + Drizzle ORM · GitHub Actions (cron del ingester) · Vitest.

Nota: el brief original pedía TanStack Table para la tabla principal, pero la versión instalable en este proyecto (v9) es una reescritura pre-release con una API completamente distinta e inestable -- se optó por sort manual (unas pocas líneas) + TanStack Virtual, que sí es una versión estable.

## Desarrollo

```bash
pnpm install
pnpm dev
```

Variables de entorno (ver `.env.example`): `DATABASE_URL`, `AODP_SERVER` (`west` | `europe` | `east`), `AODP_CONTACT`.

```bash
pnpm test              # fórmulas (return rate, fee de estación, outliers, quality score)
pnpm fetch-game-data    # regenera src/data/generated/recipes.json desde ao-bin-dumps
pnpm ingest             # corre el ingester (precios + historial + agregados) una vez
pnpm db:generate        # genera migraciones de Drizzle a partir de src/lib/db/schema.ts
```

El ingester corre por cron cada hora vía `.github/workflows/ingest.yml`.

## Arquitectura de datos

El ingester escribe filas crudas (`price_quotes`, `volume_daily`, ventana de 30 días) y precomputa un agregado por **ítem+ciudad** (`market_aggregates`: precio, antigüedad, volumen diario, precio histórico ponderado por volumen). La reducción cross-city (mediana con recorte asimétrico de outliers, score de calidad) pasó a `src/lib/recipe-math.ts` y corre en el navegador contra el subconjunto de ciudades que el usuario elija comprar/vender -- son a lo sumo 8 filas por ítem, así que es instantáneo, y permite que Fase 2 filtre por ciudad sin recalcular nada en el servidor.

## Atribución

Datos de mercado cortesía de **[The Albion Online Data Project](https://www.albion-online-data.com/)**, un proyecto sostenido por la comunidad. Recetas extraídas del dump oficial del cliente ([ao-data/ao-bin-dumps](https://github.com/ao-data/ao-bin-dumps)).
