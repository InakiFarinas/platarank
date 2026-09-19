# Base de datos con mínimo privilegio

Antes, la web, la ingesta y el aviso diario usaban el rol `postgres`. Ahora hay dos roles con lo justo:

| Rol | Lo usa | Puede |
|---|---|---|
| `platarank_web` | Vercel (`DATABASE_URL`) y el aviso diario (`DATABASE_URL_READONLY`) | Solo leer `recipes` y `market_aggregates` |
| `platarank_ingest` | Ingesta + alertas (`DATABASE_URL` en GitHub) | Escribir `recipes`, `market_aggregates`, `ingest_state`; leer `plans`, `user_settings`; leer y actualizar `alerts` |

Si alguien lograra ejecutar SQL con la credencial de la web, solo podría leer datos públicos de mercado:
no ve planificaciones, sesiones, webhooks ni puede modificar nada.

## Cambio de credenciales (una vez)

Los roles ya existen pero **sin contraseña**, así que no pueden iniciar sesión hasta este paso.

```bash
pnpm tsx scripts/rotate-db-credentials.ts           # simulacro, no cambia nada
pnpm tsx scripts/rotate-db-credentials.ts --apply   # ejecuta
```

`--apply` genera contraseñas aleatorias, comprueba que cada rol puede hacer exactamente lo que debe (y
nada más) **antes** de tocar ningún secreto, y recién entonces actualiza Vercel y GitHub. Las
contraseñas no se imprimen ni se guardan en disco.

Después:
1. Redesplegá (`git push` o `vercel deploy --prod`) para que la web use el rol nuevo.
2. Lanzá la ingesta a mano (`gh workflow run ingest.yml`) y confirmá que termina bien.
3. En Supabase (Settings → Database) rotá la contraseña de `postgres` y actualizá tu `.env` local.

## Volver atrás

La credencial `postgres` sigue funcionando hasta que rotes su contraseña. Para revertir un secreto,
volvé a cargar la URL con `postgres.<ref>` en Vercel (`DATABASE_URL`) o en GitHub (`DATABASE_URL`).

## Regla para tablas nuevas

Cada tabla nueva debe otorgar permisos explícitos a los roles que la necesiten (ver
`supabase/least-privilege.sql`). Por defecto `anon` ya no recibe acceso a tablas nuevas.
