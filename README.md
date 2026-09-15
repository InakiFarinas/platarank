# PlataRank

Ranking de crafteo (alquimia, refinado, cocina, armas y armaduras) en [Albion Online](https://albiononline.com/) por **plata realizable por día**, no por margen unitario.

## La tesis

Casi todas las herramientas de mercado de Albion responden "¿cuánta ganancia deja una unidad de este ítem?". Esa es la pregunta equivocada: si crafteás 400 pociones y el mercado absorbe 12 por día, un 200% de ROI vale menos que un 40% sobre algo que mueve 5.000 unidades diarias.

PlataRank mete el volumen diario de trades (expuesto desde siempre por la API pública, casi nunca usado) dentro de la matemática del crafteo: **ganancia unitaria × volumen diario del mercado × la cuota que asumís llevarte**. El resto del producto se ordena alrededor de tres cosas:

1. **Mostrar el trabajo.** Cada fila lleva un score de calidad de dato visible y se puede abrir para ver la derivación completa: qué precio se usó, de qué ciudad, de cuándo, y qué se descartó como outlier y por qué.
2. **Fee de estación correcto.** Plata por cada 100 de nutrición consumida (no un porcentaje plano), con una fórmula específica por tipo de estación -- alquimia y cocina dependen de los materiales de la receta (granja, carne, pescado), refinado depende solo del tier y el encantamiento, armas/armaduras dependen del tier, el encantamiento y la cantidad total de materiales.
3. **Datos de mercado sucios, tratados como tal.** Recorte de outliers asimétrico, mediana entre ciudades (nunca el máximo), Brecilien marcado explícitamente cuando no cotiza, y en armas/armaduras un gate de liquidez por calidad: una calidad sin trades reales no entra al cálculo aunque tenga un listing publicado.

## Estado (Fase 3 completa)

- Un servidor (Americas), sin cuentas ni pagos.
- Cuatro rubros en producción: **alquimia** (`/alquimia`, 174 recetas), **refinado** (`/refinado`, 115 recetas), **cocina** (`/cocina`, 183 recetas) y **equipo** (`/equipo`, ~5.600 recetas de armas y armaduras, incluyendo líneas de facción/hellgate cuyos artefactos raros van a quedar con "datos insuficientes" cuando no tengan precio confiable de mercado -- mismo comportamiento honesto que el resto, no un caso especial).
- **Especialidad de ciudad unificada**: cada receta trae su propio `craftingCategory` (potion, wood, sword, plate_armor, ...) parseado de `craftingmodifiers.xml`, y un único selector global "ciudad donde craftea" resuelve el bonus correcto (+15% crafteo o +40% refinado) para cualquiera de los cuatro rubros. Reemplaza los toggles sueltos de refinado/cocina de la iteración anterior.
- **Calidad como dimensión real en armas/armaduras**: `market_aggregates` guarda las 5 calidades para ítems de equipo. El precio de venta esperado pondera las 5 por una distribución editable (default: los pesos base del propio juego, 68.9/25/5/1/0.1%, ya que la función real que los mueve con foco/comida/Destiny Board no está publicada en ningún lado legible), y cada calidad se filtra por su propio volumen real -- una calidad con cero trades no cuenta aunque tenga un listing fantasma publicado (el hallazgo central de la sección 7.4 del brief).
- Restricciones reales activas en los cuatro rubros: ciudades de compra y de venta por separado (Black Market como opt-in explícito, no una ciudad más), cuota de mercado editable, foco on/off, tarifa de estación editable, filtros de antigüedad y volumen mínimo. Todo es estado de sesión en el navegador (panel "Filtros"), no persiste entre recargas.
- Sin golden cases todavía: las fórmulas de fee/retorno están implementadas contra fuentes públicas pero no verificadas contra capturas del juego. Ver `fixtures/golden-cases.json` y `tests/golden-cases.test.ts`.
- El tier de artefacto (rúnico/alma/reliquia/avaloniano) de la fórmula de fee de crafteo normal queda fijo en 0 para todas las recetas: el equipo estándar no consume artefacto en su craft directo (solo en la mejora opcional por runas, un camino distinto que no modelamos), y las líneas especiales que sí lo consumen no tienen forma de derivar su tier de rareza desde el dump. Documentado, no oculto.
- **Gap conocido de performance en `/equipo`**: calcular las 5.632 filas (cada una ponderando 5 calidades x hasta 8 ciudades) corre client-side en cada visita -- SSG acelera el HTML del servidor, pero no el recálculo en el navegador. Medido en 10-20+ segundos hasta la primera fila visible en esta sesión. Necesita mover el cálculo al servidor o paginar/virtualizar antes de calcular -- marcado, no resuelto en esta ronda.
- **Gap conocido de escala en el ingester**: sigue corriendo todo por hora con una sola prioridad, aunque el brief pide explícitamente una cola priorizada una vez que el catálogo creciera. Con ~7.030 ítems una corrida ya tarda varios minutos.

## Stack

Next.js 15 (App Router) + TypeScript · Tailwind + shadcn/ui · TanStack Virtual · Supabase (Postgres) + Drizzle ORM · GitHub Actions (cron del ingester) · fast-xml-parser (solo en build time, para craftingmodifiers.xml y gamedata.xml) · Vitest.

Nota: el brief original pedía TanStack Table para la tabla principal, pero la versión instalable en este proyecto (v9) es una reescritura pre-release con una API completamente distinta e inestable -- se optó por sort manual (unas pocas líneas) + TanStack Virtual, que sí es una versión estable.

## Desarrollo

```bash
pnpm install
pnpm dev
```

Variables de entorno (ver `.env.example`): `DATABASE_URL`, `AODP_SERVER` (`west` | `europe` | `east`), `AODP_CONTACT`.

```bash
pnpm test              # fórmulas (return rate, fee de estación, outliers, quality score)
pnpm fetch-game-data    # regenera recipes.json + city-specialties.json + quality-mechanics.json desde ao-bin-dumps
pnpm ingest             # corre el ingester (precios + historial + agregados) una vez
pnpm db:generate        # genera migraciones de Drizzle a partir de src/lib/db/schema.ts
```

El ingester corre por cron cada hora vía `.github/workflows/ingest.yml`.

## Arquitectura de datos

El ingester calcula un agregado por **ítem+ciudad+calidad** (`market_aggregates`: precio, antigüedad, volumen diario, precio histórico ponderado por volumen) directamente a partir de la respuesta de la API, sin persistir las filas crudas de precio/historial -- ver la nota en `src/lib/db/schema.ts` sobre por qué (con la dimensión de calidad de armas/armaduras, guardar el crudo hora a hora hubiese llenado el free tier de Supabase en horas). La reducción cross-city (mediana con recorte asimétrico de outliers, score de calidad) y ahora también cross-calidad vive en `src/lib/recipe-math.ts` y corre en el navegador contra el subconjunto de ciudades/calidades que el usuario elija -- a lo sumo 8 ciudades x 5 calidades por ítem, así que es instantáneo.

## Atribución

Datos de mercado cortesía de **[The Albion Online Data Project](https://www.albion-online-data.com/)**, un proyecto sostenido por la comunidad. Recetas y mecánicas extraídas del dump oficial del cliente ([ao-data/ao-bin-dumps](https://github.com/ao-data/ao-bin-dumps)): `items.json` para recetas, `craftingmodifiers.xml` para especialidades de ciudad, `gamedata.xml` para la distribución de calidad de crafteo.
