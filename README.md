# PlataRank

Ranking de crafteo de alquimia en [Albion Online](https://albiononline.com/) por **plata realizable por día**, no por margen unitario.

## La tesis

Casi todas las herramientas de mercado de Albion responden "¿cuánta ganancia deja una unidad de este ítem?". Esa es la pregunta equivocada: si crafteás 400 pociones y el mercado absorbe 12 por día, un 200% de ROI vale menos que un 40% sobre algo que mueve 5.000 unidades diarias.

PlataRank mete el volumen diario de trades (expuesto desde siempre por la API pública, casi nunca usado) dentro de la matemática del crafteo: **ganancia unitaria × volumen diario del mercado × la cuota que asumís llevarte**. El resto del producto se ordena alrededor de tres cosas:

1. **Mostrar el trabajo.** Cada fila lleva un score de calidad de dato visible y se puede abrir para ver la derivación completa: qué precio se usó, de qué ciudad, de cuándo, y qué se descartó como outlier y por qué.
2. **Fee de estación correcto.** Plata por cada 100 de nutrición consumida (no un porcentaje plano), con la fórmula específica de alquimia.
3. **Datos de mercado sucios, tratados como tal.** Recorte de outliers asimétrico, mediana entre ciudades (nunca el máximo), Brecilien marcado explícitamente cuando no cotiza.

## Estado (Fase 1)

- Un servidor (Americas), un rubro (alquimia, ~220 ítems), sin cuentas ni pagos.
- Cuota de mercado fija en 100% y compra al precio más barato disponible -- las restricciones reales de ciudad llegan en Fase 2.
- Sin golden cases todavía: las fórmulas de fee/retorno están implementadas contra fuentes públicas pero no verificadas contra capturas del juego. Ver `fixtures/golden-cases.json` y `tests/golden-cases.test.ts`.

## Stack

Next.js 15 (App Router) + TypeScript · Tailwind + shadcn/ui · TanStack Virtual · Supabase (Postgres) + Drizzle ORM · GitHub Actions (cron del ingester) · Vitest.

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

El ingester escribe filas crudas (`price_quotes`, `volume_daily`, ventana de 30 días) y precomputa agregados robustos por ítem (`market_aggregates`: mediana entre ciudades con recorte asimétrico de outliers, edad del dato, volumen diario, score de calidad). Toda la matemática de recetas (`src/lib/recipe-math.ts`) lee de los agregados, nunca de las filas crudas.

## Atribución

Datos de mercado cortesía de **[The Albion Online Data Project](https://www.albion-online-data.com/)**, un proyecto sostenido por la comunidad. Recetas extraídas del dump oficial del cliente ([ao-data/ao-bin-dumps](https://github.com/ao-data/ao-bin-dumps)).
