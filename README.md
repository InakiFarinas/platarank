# PlataRank

Ranking de crafteo en [Albion Online](https://albiononline.com/) por **plata realizable por día**, no por margen unitario. Cubre alquimia, refinado, cocina, armas y armaduras, y monturas, y suma una calculadora con planificaciones guardadas y avisos por Discord.

## La tesis

Casi todas las herramientas de mercado de Albion responden "¿cuánta ganancia deja una unidad de este ítem?". Esa es la pregunta equivocada: si crafteás 400 pociones y el mercado absorbe 12 por día, un 200% de ROI vale menos que un 40% sobre algo que mueve 5.000 unidades diarias.

PlataRank mete el volumen diario de ventas (expuesto desde siempre por la API pública, casi nunca usado) dentro de la matemática del crafteo: **ganancia unitaria × volumen diario de ventas × la cuota que asumís llevarte**. El resto del producto se ordena alrededor de tres cosas:

1. **Mostrar el trabajo.** Cada fila se puede abrir para ver la derivación completa: qué precio se usó, de qué ciudad, de cuándo, la ciudad más barata para comprar cada material y qué se descartó como outlier y por qué.
2. **Fee de estación correcto.** La fórmula real del motor: `fee = valor de ítem × tarifa × 0,001125` (plata por cada 100 de nutrición consumida, no un porcentaje plano), con el valor de ítem sacado de los datos del juego.
3. **Datos de mercado sucios, tratados como tal.** Recorte de outliers, mediana entre ciudades (nunca el máximo), un precio muy por encima de su propio promedio de 30 días se descarta y se nombra, y en armas/armaduras un gate de liquidez por calidad: una calidad sin trades reales no entra al cálculo aunque tenga un listing publicado.

## Qué hay

| Ruta | Qué es |
|---|---|
| `/es` | Inicio: las mejores recetas del momento y la frescura del dato |
| `/es/alquimia` · `/refinado` · `/cocina` | Rankings de 174 / 115 / 183 recetas |
| `/es/equipo` | Armas y armaduras (5.711 recetas, calidades Q1-Q5) |
| `/es/monturas` | Monturas (29 recetas), con opción de criar el animal base en vez de comprarlo |
| `/es/calculadora` | Calculadora de un ítem, planificaciones guardadas, avisos por Discord y la pestaña Transporte (peso a cargar contra bolsa, montura y capa de recolección) |
| `/es/receta/[itemId]` | Página indexable de una receta concreta: costo, ganancia y plata por día |
| `/es/metodologia` | Cómo se calcula cada número |
| `/es/acerca` | Qué es PlataRank y de dónde salen los datos |

Entrar con Discord es opcional: solo hace falta para guardar planificaciones y avisos. Los rankings y la calculadora funcionan sin cuenta.

## Cómo calcula

- **Un servidor** (Américas). Precios cada hora; volumen de los últimos 30 días del volcado diario de AODP.
- **Retorno de recursos**: 18% base, +15% si la ciudad tiene la especialidad de esa categoría (+40% en refinado), +59% con foco; `retorno = 1 − 1/(1 + bono)`. Los artefactos nunca reciben retorno.
- **Especialidad de ciudad unificada**: cada receta trae su `craftingCategory` (parseado de `craftingmodifiers.xml`) y un único selector "ciudad donde craftea" resuelve el bono correcto en todos los rubros.
- **Impuestos de mercado**: 4% de venta con premium (8% sin premium) más 2,5% de tarifa de publicación, en `src/lib/formulas/market-tax.ts`.
- **Calidad en equipo**: el precio esperado pondera las cinco calidades con los pesos base del juego (68,9 / 25 / 5 / 1 / 0,1 %, fijos) y cada calidad se filtra por su propio volumen (más de 0 y al menos 3 días con ventas en 30). No se modela el efecto del foco, la comida ni el tablero del destino porque esa fórmula no es pública.
- **Black Market** solo para armas y armaduras, como opción explícita al vender. Es un mercado de órdenes de compra, no una ciudad más.
- **Monturas criadas**: caballo y buey (T3-T8) parten de una cría a precio fijo del Mercader de granja (25.000 en T3, ×3 por tier); ciervo gigante, alce, huargo, jabalí, oso, dragón de pantano y mamut usan la cría del mercado. El alimento es el cultivo o carne más barato del día. Datos de `items.json`, sin estimar. Quedan afuera el dragón (Draco Ala de Fuego) y el conejo de Pascua, que no tienen un costo honesto para calcular (`src/lib/formulas/breeding.ts`).
- **Plata por día** = ganancia por unidad × volumen diario × cuota de mercado (10% por defecto). Es una estimación, no una garantía.

Todo supuesto es un control visible: ciudades de compra y de venta por separado, cuota, foco, tarifa de estación (500 por defecto), antigüedad máxima y volumen mínimo. El estado del ranking vive en la URL y se puede compartir; la calculadora comparte sus supuestos con un enlace.

## Límites conocidos

- Sin golden cases del juego todavía: las fórmulas de fee y retorno están verificadas con tests y con una comprobación del usuario contra el juego, no con capturas registradas (`fixtures/golden-cases.json`, `tests/golden-cases.test.ts`).
- La matriz de reroll de calidad (`gamedata.xml`) no se parsea; "craftear Q3 y rerollear" no se calcula.
- La asimetría de calidad del Black Market (acepta calidad mayor o igual a la pedida) no está modelada.
- El ingester refresca todo cada hora con una sola prioridad; los ítems de poco volumen podrían refrescarse menos.
- La calculadora no modela diarios ni maestrías.
- Solo hay datos de Américas.

## Stack

Next.js 15 (App Router) + TypeScript · Tailwind + shadcn/ui · TanStack Virtual · Supabase (Postgres y Auth con Discord) + Drizzle ORM · GitHub Actions (cron del ingester y del aviso diario) · fast-xml-parser (solo en build time) · tar-stream (lee el volcado diario de AODP en streaming) · Vitest.

El brief original pedía TanStack Table, pero su versión instalable (v9) es una reescritura pre-release con una API inestable: se optó por un sort manual más TanStack Virtual, que sí es estable.

## Idiomas

El sitio está en español (`/es`), inglés (`/en`) y portugués de Brasil (`/pt`) con next-intl, sin middleware. Los textos viven en `src/messages/{es,en,pt}/<namespace>.json` (los tres idiomas con las mismas claves; `legal` es solo servidor) y las páginas largas (metodología, acerca, privacidad, términos) en `content/{es,en,pt}.tsx`. Las carpetas de `src/app/[locale]/` conservan los nombres en español; los slugs traducidos (`/en/artifacts`, `/pt/artefatos`, `/pt/receita/...`) son rewrites definidos en `next.config.ts` a partir de la tabla `ROUTES` de `src/i18n/config.ts`. Los enlaces se arman siempre con `localePath`, y `/` elige idioma según `Accept-Language` (`src/app/route.ts`). Para elegir un valor por idioma usá `byLocale`/`intlLocale` en vez de `locale === "en" ? … : …` (que le daba el español al portugués). Los nombres de ítems salen del volcado del juego (`nameEs`/`nameEn`/`namePt`; `itemName` cae al inglés si falta el portugués). Para agregar una página: carpeta en `[locale]`, entrada en `ROUTES`, textos en los tres JSON y `pageMetadata({ locale, route, ... })`.

## Desarrollo

```bash
pnpm install
pnpm dev
```

Variables de entorno (ver `.env.example`):

| Variable | Para qué |
|---|---|
| `DATABASE_URL` | Conexión a Postgres (web e ingester) |
| `DATABASE_URL_READONLY` | Rol de solo lectura para el aviso diario (opcional, cae a `DATABASE_URL`) |
| `AODP_SERVER` | `west` (Américas), `europe` o `east` |
| `AODP_CONTACT` | Contacto que se envía a AODP en el User-Agent |
| `NEXT_PUBLIC_SITE_URL` | Dominio absoluto para metadata, sitemap y enlaces de avisos |
| `NEXT_PUBLIC_SUPABASE_URL` · `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Auth y datos de usuario desde el navegador |
| `DISCORD_DAILY_WEBHOOK` | Webhook del canal del aviso diario (solo en GitHub) |
| `REVALIDATE_SECRET` | Mismo valor en Vercel y en los secrets de GitHub: el ingest llama a `POST /api/revalidate` al terminar para tirar la caché de mercado y que los precios nuevos salgan enseguida (opcional; sin él la caché vence sola en una hora) |

```bash
pnpm test               # fórmulas, matemática de recetas, agregados y outliers
pnpm lint
pnpm fetch-game-data    # regenera recipes.json + city-specialties.json + quality-mechanics.json desde ao-bin-dumps
pnpm tsx scripts/fetch-transport-data.ts   # pesos de ítems y capas de recolección para Transporte
pnpm ingest             # corre el ingester (precios + volumen + agregados + avisos) una vez
pnpm db:generate        # genera migraciones de Drizzle a partir de src/lib/db/schema.ts
```

## Arquitectura de datos

- **Ingester** (`scripts/ingest.ts`, cron cada hora en `.github/workflows/ingest.yml`): trae los precios de todos los ítems de las recetas más el forraje y las crías del toggle de crianza, y calcula un agregado por **ítem + ciudad + calidad** en `market_aggregates` (precio, antigüedad, volumen diario, precio histórico ponderado). Las filas sin precio ni volumen no se guardan: eran el 70% de la tabla y viajaban en cada carga de ranking. No se persisten filas crudas de precio ni de historial (con la calidad de equipo llenarían el free tier de Supabase en horas).
- **Volumen**: el ingester busca el último `db_backup_*.tgz` de AODP y, si es nuevo, lo procesa en streaming para recalcular el volumen de 30 días. En las demás corridas solo refresca precios. `ingest_state` guarda la URL del último volcado procesado.
- **Snapshots**: el ranking por defecto de equipo y la lista del inicio se precalculan en el ingester (`rank_snapshots`, `src/lib/server/top-recipes.ts`) para no leer decenas de miles de filas en cada visita. Supabase free tiene 5 GB de egress por mes, así que cualquier cambio que amplíe lo que una página lee de la base tiene que contarlo.
- **Caché compartida** (`src/lib/server/shared-cache.ts`): la web lee el mercado a través de la caché de datos de Next (`unstable_cache`, una hora), compartida entre instancias, idiomas y deploys; el de equipo va en 8 pedazos para no pasar los 2 MB por entrada de Vercel. Las recetas salen de `recipes.json` (`src/lib/recipes-data.ts`), no de la tabla. El ingester no puede usar esa caché (corre fuera de Next) y llama a `station-data` directo; al terminar, la invalida con `POST /api/revalidate` (tag `market`), así los precios nuevos aparecen apenas termina en vez de hasta una hora después.
- **Cálculo**: la reducción entre ciudades y calidades (mediana con recorte de outliers) está en `src/lib/recipe-math.ts` y corre en el navegador para rubros chicos; equipo se rankea en el servidor (`rankStation`) para el orden y los filtros elegidos.
- **Avisos**: tras cada ingesta se recalculan los planes con alerta (`src/lib/ingest/alerts.ts`) y se avisa al webhook de Discord del usuario solo cuando la ganancia cruza el umbral desde abajo.
- **Base de datos**: las tablas de mercado se acceden con Drizzle; planificaciones, ajustes y alertas están protegidas con RLS y se usan desde el navegador con la sesión del usuario. Acceso con mínimo privilegio en [docs/db-least-privilege.md](docs/db-least-privilege.md); SQL de referencia en `supabase/`.

## Documentación

- [PRODUCT.md](PRODUCT.md): contexto de producto, decisiones y huecos abiertos.
- [DESIGN.md](DESIGN.md): sistema de diseño visual.
- [docs/db-least-privilege.md](docs/db-least-privilege.md): roles de base de datos.
- `/es/metodologia`: la explicación de cara al usuario.

## Atribución

Datos de mercado cortesía de **[The Albion Online Data Project](https://www.albion-online-data.com/)**, un proyecto sostenido por la comunidad. Recetas y mecánicas extraídas del dump oficial del cliente ([ao-data/ao-bin-dumps](https://github.com/ao-data/ao-bin-dumps)): `items.json` para recetas, valores y pesos, `craftingmodifiers.xml` para especialidades de ciudad, `gamedata.xml` para la distribución de calidad de crafteo.
