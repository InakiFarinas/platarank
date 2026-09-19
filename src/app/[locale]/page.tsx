import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, CheckCircle2, TrendingUp } from "lucide-react";
import { formatSilver } from "@/components/recipes/format";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { itemIconUrl } from "@/lib/item-icons";
import { getRecipeCounts, getTopRecipes, type TopRecipe } from "@/lib/server/top-recipes";

// The ranking preview is live data: refresh it on the same cadence as the ranking pages.
export const revalidate = 300;

export const metadata: Metadata = {
  title: "Ranking de crafteo por plata realizable por día",
  description:
    "PlataRank ordena las recetas de Albion Online (alquimia, refinado, cocina, equipo y monturas) por ganancia × volumen diario de ventas, no por margen unitario. Con calculadora, sesiones y alertas por Discord.",
  alternates: { canonical: "/es" },
};

const STATIONS = [
  { type: "alchemy", href: "/es/alquimia", label: "Alquimia", note: "Pociones" },
  { type: "refining", href: "/es/refinado", label: "Refinado", note: "Tablas, lingotes, tela y cuero" },
  { type: "cooking", href: "/es/cocina", label: "Cocina", note: "Comidas" },
  { type: "gear", href: "/es/equipo", label: "Equipo", note: "Armas, armaduras, bolsas y capas" },
  { type: "mount", href: "/es/monturas", label: "Monturas", note: "Animales de montura" },
] as const;

const CAPABILITIES = [
  "Ranking por plata por día: el margen se multiplica por el volumen real de ventas.",
  "Calculadora con retorno, foco, tarifa de estación e impuestos, y enlaces para compartir tu cálculo.",
  "Sesiones de crafteo para sumar varios ítems y cargar tus números reales.",
  "Alertas por Discord cuando una receta guardada supera la ganancia que definas.",
] as const;

const DISCORD_URL = "https://discord.gg/ZZRcGSEXeh";

async function loadLive(): Promise<{ top: TopRecipe[]; counts: Record<string, number> }> {
  try {
    const [top, counts] = await Promise.all([getTopRecipes(5), getRecipeCounts()]);
    return { top, counts };
  } catch {
    // The page must still render if the database is unreachable; it just loses the live block.
    return { top: [], counts: {} };
  }
}

export default async function HomePage() {
  const { top, counts } = await loadLive();
  const totalRecipes = Object.values(counts).reduce((a, b) => a + b, 0);

  return (
    <>
      <SiteHeader />
      <main id="contenido">
        <section className="relative overflow-hidden border-b border-money/20">
          <Image src="/hero.png" alt="" fill priority sizes="100vw" className="object-cover object-[75%_center]" />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-background/10 sm:via-background/70 sm:to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/40" />

          <div className="relative mx-auto max-w-6xl px-3 py-20 sm:px-6 sm:py-28 lg:px-8">
            <div className="max-w-lg">
              <h1 className="font-display text-4xl uppercase leading-[1.05] tracking-tight sm:text-6xl">
                Maximizá tu <span className="text-money">plata</span> en Albion Online
              </h1>
              <p className="mt-5 max-w-md text-sm text-muted-foreground sm:text-base">
                Descubrí qué recetas de crafteo te dan más plata por día, con datos reales de volumen de ventas, precios y todas las fórmulas de
                cálculo a la vista.
              </p>
              <div className="mt-7 flex flex-wrap items-center gap-4">
                <Link
                  href="/es/alquimia"
                  className="inline-flex items-center gap-2 rounded-sm border border-money bg-money px-5 py-2.5 text-sm font-medium tracking-wide text-money-foreground shadow-[0_0_0_3px_var(--background),0_0_0_4px_color-mix(in_oklch,var(--money)_40%,transparent)] transition-opacity hover:opacity-90"
                >
                  <TrendingUp className="h-4 w-4" />
                  Ver recetas rentables
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/es/calculadora"
                  className="inline-flex items-center gap-2 rounded-sm border border-money/50 bg-money/10 px-5 py-2.5 text-sm font-medium tracking-wide text-money transition-colors hover:bg-money/20"
                >
                  Abrir calculadora
                </Link>
              </div>
              <p className="mt-8 border-t border-money/20 pt-4 text-xs text-muted-foreground">
                {totalRecipes > 0 ? `${totalRecipes.toLocaleString("es-AR")} recetas · ` : ""}5 estaciones · servidor Américas · precios actualizados cada hora
              </p>
            </div>
          </div>
        </section>

        <section className="border-b border-border px-3 py-14 sm:px-6 sm:py-20 lg:px-8">
          <div className="mx-auto grid max-w-6xl items-start gap-10 lg:grid-cols-2">
            <div>
              <h2 className="font-display text-2xl uppercase tracking-tight sm:text-3xl">Lo que más rinde hoy</h2>
              <p className="mt-3 text-sm text-muted-foreground sm:text-base">
                Ordenamos por plata realizable por día: ganancia por unidad × volumen de ventas × cuota de mercado. Una receta con margen alto que casi
                no se vende rinde menos que una de margen chico que se vende todo el día.
              </p>
              <ul className="mt-5 space-y-2.5">
                {CAPABILITIES.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-money" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {top.length > 0 && (
              <div className="overflow-hidden rounded-sm border-2 border-double border-money/30 bg-card">
                <div className="flex items-baseline justify-between gap-3 border-b-2 border-double border-money/30 bg-money/5 px-4 py-3">
                  <h3 className="font-heading text-sm">Las mejores recetas ahora</h3>
                  <span className="text-xs text-muted-foreground">plata por día · Brecilien, sin foco</span>
                </div>
                <ul className="divide-y divide-border">
                  {top.map(({ label, row }) => {
                    const r = row.recipe;
                    return (
                      <li key={r.itemId}>
                        <Link
                          href={`/es/calculadora?item=${encodeURIComponent(r.itemId)}`}
                          className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-money/5"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={itemIconUrl(r.itemId, 1, 64)} alt="" width={40} height={40} className="h-10 w-10 shrink-0" />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm">
                              {r.nameEs} T{r.tier}
                              {r.enchant > 0 ? `.${r.enchant}` : ""}
                            </span>
                            <span className="block text-xs text-muted-foreground">
                              {label} · margen {row.marginPct === null ? "--" : `${Math.round(row.marginPct * 100)}%`} · volumen {formatSilver(row.avgDailyVolume30d)}
                            </span>
                          </span>
                          <span className="shrink-0 text-right font-mono text-sm tabular-nums text-money">{formatSilver(row.platinumPerDay)}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
                <p className="border-t border-border px-4 py-2 text-xs text-muted-foreground">
                  Tocá una receta para abrirla en la calculadora. Los rankings completos están más abajo.
                </p>
              </div>
            )}
          </div>
        </section>

        <section className="border-b border-money/20 bg-money/[0.03] px-3 py-14 sm:px-6 sm:py-20 lg:px-8">
          <div className="mx-auto max-w-3xl">
            <h2 className="font-display text-2xl uppercase tracking-tight sm:text-3xl">Elegí tu estación</h2>
            <ul className="mt-6 divide-y divide-border rounded-sm border border-border bg-card">
              {STATIONS.map(({ type, href, label, note }) => (
                <li key={href}>
                  <Link href={href} className="group flex items-center gap-4 px-4 py-3.5 transition-colors hover:bg-money/5">
                    <span className="min-w-0 flex-1">
                      <span className="block font-display text-base uppercase tracking-tight">{label}</span>
                      <span className="block text-xs text-muted-foreground">{note}</span>
                    </span>
                    {counts[type] !== undefined && (
                      <span className="shrink-0 font-mono text-xs tabular-nums text-muted-foreground">
                        {counts[type].toLocaleString("es-AR")} recetas
                      </span>
                    )}
                    <ArrowRight className="h-4 w-4 shrink-0 text-money transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="border-b border-border px-3 py-14 sm:px-6 sm:py-20 lg:px-8">
          <div className="mx-auto max-w-3xl">
            <h2 className="font-display text-2xl uppercase tracking-tight sm:text-3xl">Avisos y alertas en Discord</h2>
            <p className="mt-3 text-sm text-muted-foreground sm:text-base">
              Todos los días publicamos en el Discord las mejores recetas. Y con tu cuenta podés guardar cálculos y recibir un aviso cuando una receta
              supera la ganancia que definas. Es gratis.
            </p>
            <div className="mt-6 flex flex-wrap gap-4">
              <a
                href={DISCORD_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-sm border border-money bg-money px-5 py-2.5 text-sm font-medium tracking-wide text-money-foreground transition-opacity hover:opacity-90"
              >
                Unirme al Discord
                <ArrowRight className="h-4 w-4" />
              </a>
              <Link
                href="/es/metodologia"
                className="inline-flex items-center rounded-sm border border-border px-5 py-2.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                Cómo calculamos todo
              </Link>
            </div>
          </div>
        </section>

        <SiteFooter className="px-3 py-8 sm:px-6 lg:px-8" containerClassName="mx-auto max-w-6xl">
          <p className="text-xs text-muted-foreground">
            Datos de{" "}
            <a
              href="https://www.albion-online-data.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 hover:text-foreground"
            >
              Albion Online Data Project
            </a>{" "}
            &middot; Cliente del juego &middot; Actualizado cada hora
          </p>
          <p className="text-xs text-muted-foreground">Esta herramienta no está afiliada a Sandbox Interactive. Uso no oficial.</p>
        </SiteFooter>
      </main>
    </>
  );
}
