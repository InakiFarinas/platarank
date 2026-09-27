import Link from "next/link";
import type { Metadata } from "next";
import { CTA_PRIMARY } from "@/lib/cta";

export const metadata: Metadata = { title: "Página no encontrada", robots: { index: false } };

export default function NotFound() {
  return (
    <main id="contenido" className="mx-auto flex min-h-[70vh] max-w-xl flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="font-display text-4xl uppercase tracking-tight">No encontramos esa página</h1>
      <p className="text-sm text-muted-foreground">El enlace puede estar mal escrito o la página ya no existe.</p>
      <Link href="/es" className={`${CTA_PRIMARY} inline-flex items-center px-5 py-2.5 text-sm`}>
        Volver al inicio
      </Link>
    </main>
  );
}
