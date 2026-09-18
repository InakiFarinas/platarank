import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, CheckCircle2, FlaskConical, Hammer, Scroll, Shield, TrendingUp, UtensilsCrossed } from "lucide-react";
import { ShieldBadge } from "@/components/icons/shield-badge";
import { SpriteIcon } from "@/components/icons/sprite-icon";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  title: "Ranking de crafteo por plata realizable por dia",
  description:
    "PlataRank ordena recetas de Albion Online (alquimia, refinado, cocina, armas y armaduras) por margen x volumen diario de ventas, no por margen unitario.",
  alternates: { canonical: "/es" },
};

const STATIONS = [
  { href: "/es/alquimia", label: "Alquimia", count: "174 recetas", Icon: FlaskConical },
  { href: "/es/refinado", label: "Refinado", count: "115 recetas", Icon: Hammer },
  { href: "/es/cocina", label: "Cocina", count: "183 recetas", Icon: UtensilsCrossed },
  { href: "/es/equipo", label: "Equipo", count: "~5.600 recetas", Icon: Shield },
] as const;

const FEATURES = [
  {
    title: "Ranking por plata por dia",
    text: "No solo margen, tambien volumen.",
  },
  {
    title: "Calculo detallado",
    text: "Precio, ciudad, fecha y descartes. Todo visible.",
  },
  {
    title: "Especialidades de ciudades",
    text: "Una sola seleccion, todas las recetas.",
  },
  {
    title: "Datos actualizados",
    text: "Con la API de Albion Online y el cliente de juego.",
  },
] as const;

const MOCK_ROWS = [
  { name: "Pocion de invisibilidad", plataDia: "412.350", margen: "1.240", volumen: "320" },
  { name: "Pocion de resistencia", plataDia: "368.920", margen: "1.105", volumen: "287" },
  { name: "Pocion de curacion", plataDia: "312.450", margen: "915", volumen: "341" },
  { name: "Pocion de energia", plataDia: "260.770", margen: "780", volumen: "276" },
  { name: "Pocion de fuerza", plataDia: "224.180", margen: "650", volumen: "243" },
] as const;

const CHECKLIST = [
  "4 tipos de estaciones: Alquimia, Refinado, Cocina y Equipo",
  "+5.600 recetas de armas y armaduras",
  "Especialidades de ciudades por categoria de receta",
  "Calculo de calidad real en equipo (Q1-Q5)",
] as const;

const STATS = [
  { value: "6.072", label: "Recetas totales" },
  { value: "4", label: "Estaciones de crafteo" },
  { value: "24/7", label: "Datos actualizados" },
] as const;

export default function HomePage() {
  return (
    <>
      <SiteHeader />
      <main>
        {/* Hero: guild banner + charter headline, over the keep-at-dusk key art */}
        <section className="relative overflow-hidden border-b border-money/20">
          <Image
            src="/hero.png"
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover object-[75%_center]"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-background/10 sm:via-background/70 sm:to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/40" />

          <div className="relative mx-auto max-w-6xl px-3 py-20 sm:px-6 sm:py-28 lg:px-8">
            <div className="max-w-lg">
              <div className="rule-fleur">
                <span className="shrink-0 text-[11px] font-medium uppercase tracking-[0.2em] text-money">
                  El ledger del gremio
                </span>
              </div>
              <h1 className="mt-5 font-display text-4xl uppercase leading-[1.05] tracking-tight sm:text-6xl">
                Maximiza tu <span className="text-money">plata</span> en Albion Online
              </h1>
              <p className="mt-5 max-w-md text-sm text-muted-foreground sm:text-base">
                Descubri que recetas de crafteo te dan mas plata por dia, con datos reales de volumen de ventas,
                precios y todas las formulas de calculo.
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
              </div>

              <dl className="mt-10 grid max-w-md grid-cols-3 divide-x divide-money/20 border-y border-money/20 py-4">
                {STATS.map((s) => (
                  <div key={s.label} className="px-3 text-center first:pl-0">
                    <dt className="font-display text-lg text-money sm:text-xl">{s.value}</dt>
                    <dd className="mt-1 text-[11px] uppercase tracking-wide text-muted-foreground">{s.label}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </section>

        {/* Guild charter: feature articles */}
        <section className="border-b border-border px-3 py-14 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <div className="text-center">
              <span className="text-[11px] font-medium uppercase tracking-[0.2em] text-money">El codigo del gremio</span>
              <h2 className="mt-2 font-display text-2xl uppercase tracking-tight sm:text-3xl">Como funciona PlataRank</h2>
            </div>
            <div className="mt-10 grid gap-px overflow-hidden rounded-sm border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
              {FEATURES.map(({ title, text }, i) => (
                <div key={title} className="relative bg-card px-5 py-6">
                  <span className="absolute right-3 top-3 font-display text-3xl text-money/10">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <SpriteIcon src="/icons.png" index={i} count={FEATURES.length} className="h-16 w-12" />
                  <div className="mt-4 font-heading text-base">{title}</div>
                  <div className="mt-1 text-xs text-muted-foreground">{text}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Ledger scroll: sample ranking */}
        <section className="border-b border-border px-3 py-14 sm:px-6 sm:py-20 lg:px-8">
          <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-2">
            <div className="order-2 lg:order-1">
              <span className="text-[11px] font-medium uppercase tracking-[0.2em] text-money">El decreto real</span>
              <h2 className="mt-2 font-display text-2xl uppercase tracking-tight sm:text-3xl">
                Informacion clara para tomar mejores decisiones
              </h2>
              <p className="mt-3 text-sm text-muted-foreground sm:text-base">
                Revisa el ranking completo de recetas, con el desglose detallado de cada calculo y los datos que lo
                respaldan. Sin suposiciones, sin vueltas.
              </p>
              <ul className="mt-5 space-y-2.5">
                {CHECKLIST.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-money" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="order-1 overflow-hidden rounded-sm border-2 border-double border-money/30 bg-card lg:order-2">
              <div className="flex items-center gap-2 border-b-2 border-double border-money/30 bg-money/5 px-4 py-3">
                <Scroll className="h-4 w-4 text-money" />
                <span className="font-heading text-sm">Pergamino de Alquimia</span>
              </div>
              <div className="hidden grid-cols-[1.5fr_repeat(3,1fr)] gap-2 border-b border-border px-4 py-2 text-[11px] text-muted-foreground sm:grid">
                <span>Receta</span>
                <span className="text-right">Plata/dia</span>
                <span className="text-right">Margen</span>
                <span className="text-right">Volumen</span>
              </div>
              {MOCK_ROWS.map((r, i) => (
                <div key={r.name} className={`px-4 py-2.5 text-xs ${i % 2 === 1 ? "bg-money/[0.03]" : ""}`}>
                  {/* Mobile: labeled key-value layout so figures never lose their meaning */}
                  <div className="flex items-start justify-between gap-3 sm:hidden">
                    <span className="min-w-0 flex-1 leading-snug">{r.name}</span>
                    <span className="shrink-0 text-right font-mono text-money tabular-nums">{r.plataDia}</span>
                  </div>
                  <div className="mt-1 flex gap-4 text-[11px] text-muted-foreground sm:hidden">
                    <span>
                      Margen <span className="font-mono tabular-nums">{r.margen}</span>
                    </span>
                    <span>
                      Volumen <span className="font-mono tabular-nums">{r.volumen}</span>
                    </span>
                  </div>

                  {/* Desktop: aligned columns */}
                  <div className="hidden grid-cols-[1.5fr_repeat(3,1fr)] items-center gap-2 sm:grid">
                    <span className="min-w-0 leading-snug">{r.name}</span>
                    <span className="text-right font-mono text-money tabular-nums">{r.plataDia}</span>
                    <span className="text-right font-mono text-muted-foreground tabular-nums">{r.margen}</span>
                    <span className="text-right font-mono text-muted-foreground tabular-nums">{r.volumen}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* The four guild halls */}
        <section className="border-b border-money/20 bg-money/[0.03] px-3 py-14 sm:px-6 sm:py-20 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <div className="text-center">
              <span className="text-[11px] font-medium uppercase tracking-[0.2em] text-money">Explora las 4 estaciones</span>
              <h2 className="mt-2 font-display text-2xl uppercase tracking-tight sm:text-3xl">
                Los cuatro gremios de crafteo
              </h2>
              <p className="mx-auto mt-3 max-w-lg text-sm text-muted-foreground sm:text-base">
                Desde pociones hasta armaduras, encontra las recetas mas rentables de cada estacion y hace que tu
                tiempo en Albion rinda al maximo.
              </p>
            </div>
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {STATIONS.map(({ href, label, count, Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className="group rounded-sm border border-border bg-card p-5 transition-colors hover:border-money/50"
                >
                  <ShieldBadge>
                    <Icon className="h-5 w-5" />
                  </ShieldBadge>
                  <div className="mt-4 font-display text-lg uppercase tracking-tight">{label}</div>
                  <div className="mt-0.5 text-xs text-muted-foreground">{count}</div>
                  <div className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-money">
                    Ver recetas
                    <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                  </div>
                </Link>
              ))}
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
          <p className="text-xs text-muted-foreground">Esta herramienta no esta afiliada a Sandbox Interactive. Uso no oficial.</p>
        </SiteFooter>
      </main>
    </>
  );
}
