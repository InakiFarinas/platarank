# PlataRank

Ranking de crafteo (alquimia, refinado, cocina, armas y armaduras) en [Albion Online](https://albiononline.com/) por **plata realizable por día**, no por margen unitario.

## La tesis

Casi todas las herramientas de mercado de Albion responden "¿cuánta ganancia deja una unidad de este ítem?". Esa es la pregunta equivocada: si crafteás 400 pociones y el mercado absorbe 12 por día, un 200% de ROI vale menos que un 40% sobre algo que mueve 5.000 unidades diarias.

PlataRank mete el volumen diario de ventas (expuesto desde siempre por la API pública, casi nunca usado) dentro de la matemática del crafteo: **ganancia unitaria × volumen diario de ventas × la cuota que asumís llevarte**. El resto del producto se ordena alrededor de tres cosas:

1. **Mostrar el trabajo.** Cada fila se puede abrir para ver la derivación completa: qué precio se usó, de qué ciudad, de cuándo, y qué se descartó como outlier y por qué.
2. **Fee de estación correcto.** Plata por cada 100 de nutrición consumida (no un porcentaje plano), con una fórmula específica por tipo de estación -- alquimia y cocina dependen de los materiales de la receta (granja, carne, pescado), refinado depende solo del tier y el encantamiento, armas/armaduras dependen del tier, el encantamiento y la cantidad total de materiales.
3. **Datos de mercado sucios, tratados como tal.** Recorte de outliers asimétrico, mediana entre ciudades (nunca el máximo), Brecilien marcado explícitamente cuando no cotiza, y en armas/armaduras un gate de liquidez por calidad: una calidad sin trades reales no entra al cálculo aunque tenga un listing publicado.

## Estado (Fase 4 completa)

- Un servidor (Americas), sin cuentas ni pagos.
- Cuatro rubros en producción: **alquimia** (`/alquimia`, 174 recetas), **refinado** (`/refinado`, 115 recetas), **cocina** (`/cocina`, 183 recetas) y **equipo** (`/equipo`, ~5.600 recetas de armas y armaduras, incluyendo líneas de facción/hellgate cuyos artefactos raros van a quedar con "datos insuficientes" cuando no tengan precio confiable de mercado -- mismo comportamiento honesto que el resto, no un caso especial).
- **Especialidad de ciudad unificada**: cada receta trae su propio `craftingCategory` (potion, wood, sword, plate_armor, ...) parseado de `craftingmodifiers.xml`, y un único selector global "ciudad donde craftea" resuelve el bonus correcto (+15% crafteo o +40% refinado) para cualquiera de los cuatro rubros. Reemplaza los toggles sueltos de refinado/cocina de la iteración anterior.
- **Calidad como dimensión real en armas/armaduras**: `market_aggregates` guarda las 5 calidades para ítems de equipo. El precio de venta esperado pondera las 5 por los pesos base del propio juego (68.9/25/5/1/0.1%, fijos, no editables -- ver más abajo por qué), y cada calidad se filtra por su propio volumen real -- una calidad con cero trades no cuenta aunque tenga un listing fantasma publicado (el hallazgo central de la sección 7.4 del brief).
- **El control "Distribución de calidad al craftear" se sacó por completo, a pedido explícito**: dependía muchísimo de la spec/comida de cada jugador y, contrario a lo que decía su propio copy, la estación de crafteo no muestra en ningún lado ese porcentaje real para que el jugador lo cargue con precisión. Ahora `computeGearSellSide` usa siempre los pesos base del juego (`BASE_QUALITY_WEIGHTS`), y `RecipeMathParams` ya no tiene `qualityWeights`.
- Restricciones reales activas en los cuatro rubros: ciudades de compra y de venta por separado (Black Market como opt-in explícito, no una ciudad más), cuota de mercado editable, foco on/off, tarifa de estación editable, filtros de antigüedad y volumen mínimo. Todo es estado de sesión en el navegador (panel "Filtros"), no persiste entre recargas.
- Sin golden cases todavía: las fórmulas de fee/retorno están implementadas contra fuentes públicas pero no verificadas contra capturas del juego. Ver `fixtures/golden-cases.json` y `tests/golden-cases.test.ts`.
- El tier de artefacto (rúnico/alma/reliquia/avaloniano) de la fórmula de fee de crafteo normal queda fijo en 0 para todas las recetas: el equipo estándar no consume artefacto en su craft directo (solo en la mejora opcional por runas, un camino distinto que no modelamos), y las líneas especiales que sí lo consumen no tienen forma de derivar su tier de rareza desde el dump. Documentado, no oculto.
- **Gap conocido de performance en `/equipo`**: calcular las 5.632 filas (cada una ponderando 5 calidades x hasta 8 ciudades) corre client-side en cada visita -- SSG acelera el HTML del servidor, pero no el recálculo en el navegador. Medido en 10-20+ segundos hasta la primera fila visible en esta sesión. Necesita mover el cálculo al servidor o paginar/virtualizar antes de calcular -- marcado, no resuelto en esta ronda.
- **Gap conocido de escala en el ingester**: sigue corriendo todo por hora con una sola prioridad, aunque el brief pide explícitamente una cola priorizada una vez que el catálogo creciera. Con ~7.030 ítems una corrida ya tarda varios minutos.
- **El ingester ahora lee el volumen de 30 días del dump diario de AODP, no de `/stats/history` por REST**: cada corrida busca el último `db_backup_*.tgz` publicado (listado en `albion-online-data.com/database/`), y si es uno nuevo desde la última corrida, lo descarga y procesa en streaming (gunzip + tar-stream + un regex de tuplas sobre la tabla `market_history`, sin nunca cargar el dump completo en memoria ni a disco) para recalcular `avgDailyVolume30d`/`daysWithVolume30d`/`weightedAvgPrice30d` de los ~7.000 ítems. Si el dump no cambió desde la corrida anterior (lo normal en 23 de cada 24 corridas horarias), esa corrida solo refresca precios vía REST y no toca las columnas de volumen -- `ingest_state` guarda la URL del último dump procesado. Esto elimina por completo el tráfico REST de `/stats/history` (miles de llamados throttled por corrida), que era el cuello de botella real de escala. Dos hallazgos no documentados en ningún lado público, verificados contra un dump real y contra `/stats/history` en vivo: (1) `market_history.location` no usa el cluster id "de ciudad abierta" de `world.json` sino el de su edificio de mercado (`"<Ciudad> Market"`), y Black Market usa el id de Caerleon ciudad abierta (3003) -- confirmado cruzando una fila del dump contra `/stats/history` para el mismo ítem/calidad/día; (2) desde 2026-09-09 la tabla tiene DOS series superpuestas para el mismo día (`aggregation=1` horaria y `aggregation=6` de 6 horas cubriendo los mismos timestamps) -- sumar ambas duplica el volumen, así que cada día elige una sola serie (la horaria si existe).
- **SEO (Fase 4)**: página de inicio real en `/es` (antes `/` redirigía directo a `/alquimia`), metadata por ruta (`title`/`description`/canonical) en las cuatro páginas de rubro, `sitemap.xml` y `robots.txt` generados desde `src/app/sitemap.ts`/`robots.ts`, y OpenGraph/Twitter card por defecto en el layout raíz. `NEXT_PUBLIC_SITE_URL` controla el dominio absoluto usado en metadata/sitemap (ver `.env.example`).
- **Correcciones de una revisión de dominio**: `marketShare` por defecto pasó de 1 (100% del mercado) a 0.1; el gate de liquidez de calidad en equipo ahora exige mínimo 3 días con volumen en 30, no solo `volumen > 0`; los materiales de artefacto (rúnico/alma/reliquia/avaloniano) nunca tienen RRR, sin importar foco o especialidad de ciudad (regla dura del motor, no un supuesto); el rate limiter del cliente AODP usaba un gap fijo (150 req/min) que respetaba el límite de 180/min pero no el de 300/5min (60/min sostenido) -- no mordía a la escala de Fase 1-2 pero hubiese devuelto 429 a mitad de una corrida de Fase 3, reemplazado por un limitador de ventana deslizante real; la lista de ciudades reales ahora resuelve su cluster id contra `world.json` en vez de una tabla copiada a mano; el copy dejó de decir "volumen del mercado" (el histórico de AODP es solo volumen de órdenes de venta, no del mercado entero). Quedan abiertos y documentados: la asimetría de calidad del Black Market (acepta calidad >= la pedida, no modelado todavía), la matriz de reroll de calidad (publicada en `gamedata.xml`, no parseada), y el pipeline de dumps diarios de AODP para resolver de raíz la escala del ingester (investigado y verificado -- ver PRODUCT.md -- pero no construido todavía, a pedido explícito para la próxima sesión).
- **La fórmula del fee de crafteo se reemplazó por la real del motor**: `fee = ItemValue x Tax x 0.001125`, redondeado como lo hace el cliente. Reemplaza las tres aproximaciones anteriores (unidades fijas por tipo de material en alquimia/cocina, fórmula exponencial de tier/encantamiento en refinado, conteo de materiales x multiplicador de artefacto en equipo) por una sola fórmula real para los cuatro rubros. `ItemValue` es la suma del `@itemvalue` real de cada material no-artefacto (desde `items.json`), resuelta recursivamente cuando un material no tiene valor propio y solo lleva su propia sub-receta (manteca, alcohol, pan de cocina). Se precalcula una sola vez por receta en `recipe.materialItemValue` (build time, `scripts/fetch-game-data.ts`).
- **Reordenamiento mobile-first**: el header pasó a tabs por rubro + un selector de ciudad global (escudo) que reemplaza el viejo "Ciudad donde craftea" enterrado en el panel de Filtros; el panel de Filtros ahora se abre desde un botón flotante en vez de uno inline; y en mobile cada receta es una card ("Registro de Contratos": ícono real del ítem, plata/día como cifra destacada, indicador de liquidez, gemas de calidad para equipo) con la derivación completa en un Sheet aparte en vez de expandir inline -- desktop no cambió (fila densa + expansión inline). Ver DESIGN.md.
- **El score de calidad de dato (0-100) se eliminó por completo, a pedido explícito**: ni la fila ni el detalle de derivación lo muestran más; `computeQualityScore`, `QualityBadge` y el sello de cera equivalente en mobile se borraron junto con las variables que solo alimentaban ese cálculo (antigüedad más vieja, desviación contra el histórico ponderado). El panel de derivación sigue mostrando esas señales por separado (ciudades cotizando, antigüedad del dato, outliers descartados) sin sintetizarlas en un número compuesto.

## Stack

Next.js 15 (App Router) + TypeScript · Tailwind + shadcn/ui · TanStack Virtual · Supabase (Postgres) + Drizzle ORM · GitHub Actions (cron del ingester) · fast-xml-parser (solo en build time, para craftingmodifiers.xml y gamedata.xml) · tar-stream (para leer el dump diario de AODP en streaming, ver el ingester) · Vitest.

Nota: el brief original pedía TanStack Table para la tabla principal, pero la versión instalable en este proyecto (v9) es una reescritura pre-release con una API completamente distinta e inestable -- se optó por sort manual (unas pocas líneas) + TanStack Virtual, que sí es una versión estable.

## Desarrollo

```bash
pnpm install
pnpm dev
```

Variables de entorno (ver `.env.example`): `DATABASE_URL`, `AODP_SERVER` (`west` | `europe` | `east`), `AODP_CONTACT`.

```bash
pnpm test              # fórmulas (return rate, fee de estación, outliers)
pnpm fetch-game-data    # regenera recipes.json + city-specialties.json + quality-mechanics.json desde ao-bin-dumps
pnpm ingest             # corre el ingester (precios + historial + agregados) una vez
pnpm db:generate        # genera migraciones de Drizzle a partir de src/lib/db/schema.ts
```

El ingester corre por cron cada hora vía `.github/workflows/ingest.yml`.

## Arquitectura de datos

El ingester calcula un agregado por **ítem+ciudad+calidad** (`market_aggregates`: precio, antigüedad, volumen diario, precio histórico ponderado por volumen) directamente a partir de la respuesta de la API, sin persistir las filas crudas de precio/historial -- ver la nota en `src/lib/db/schema.ts` sobre por qué (con la dimensión de calidad de armas/armaduras, guardar el crudo hora a hora hubiese llenado el free tier de Supabase en horas). La reducción cross-city (mediana con recorte asimétrico de outliers) y ahora también cross-calidad vive en `src/lib/recipe-math.ts` y corre en el navegador contra el subconjunto de ciudades/calidades que el usuario elija -- a lo sumo 8 ciudades x 5 calidades por ítem, así que es instantáneo.

## Atribución

Datos de mercado cortesía de **[The Albion Online Data Project](https://www.albion-online-data.com/)**, un proyecto sostenido por la comunidad. Recetas y mecánicas extraídas del dump oficial del cliente ([ao-data/ao-bin-dumps](https://github.com/ao-data/ao-bin-dumps)): `items.json` para recetas, `craftingmodifiers.xml` para especialidades de ciudad, `gamedata.xml` para la distribución de calidad de crafteo.
