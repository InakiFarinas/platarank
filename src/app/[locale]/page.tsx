import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Ranking de crafteo por plata realizable por dia",
  description:
    "PlataRank ordena recetas de Albion Online (alquimia, refinado, cocina, armas y armaduras) por margen x volumen diario del mercado, no por margen unitario.",
  alternates: { canonical: "/es" },
};

const RUBROS = [
  { href: "/es/alquimia", label: "Alquimia", detail: "Pociones -- 174 recetas" },
  { href: "/es/refinado", label: "Refinado", detail: "Madera, fibra, mineral, cuero, piedra -- 115 recetas" },
  { href: "/es/cocina", label: "Cocina", detail: "Platos que restauran vida/energia -- 183 recetas" },
  { href: "/es/equipo", label: "Armas y armaduras", detail: "Equipo estandar y de faccion -- ~5.600 recetas" },
] as const;

export default function HomePage() {
  return (
    <main className="mx-auto max-w-3xl px-3 py-8 sm:px-6 sm:py-12">
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">PlataRank</h1>
      <p className="mt-3 text-sm text-muted-foreground sm:text-base">
        Ranking de crafteo de Albion Online por <strong className="text-foreground">plata realizable por dia</strong> --
        ganancia unitaria x volumen diario del mercado x la cuota que asumis llevarte -- en vez de margen unitario solo.
        Cada fila muestra su score de calidad de dato y se puede abrir para ver de donde sale cada numero.
      </p>
      <ul className="mt-6 grid gap-3 sm:grid-cols-2">
        {RUBROS.map((r) => (
          <li key={r.href}>
            <Link
              href={r.href}
              className="block rounded-md border border-border p-4 transition-colors hover:border-foreground/30 hover:bg-muted/50"
            >
              <div className="font-medium">{r.label}</div>
              <div className="mt-1 text-xs text-muted-foreground">{r.detail}</div>
            </Link>
          </li>
        ))}
      </ul>
      <p className="mt-8 text-xs text-muted-foreground">
        Datos de mercado cortesia de{" "}
        <a
          href="https://www.albion-online-data.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-2 hover:text-foreground"
        >
          The Albion Online Data Project
        </a>
        . Recetas extraidas del dump oficial del cliente (ao-bin-dumps). Servidor Americas.
      </p>
    </main>
  );
}
