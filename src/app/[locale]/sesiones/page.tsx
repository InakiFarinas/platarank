import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { SessionsView } from "@/components/sessions/sessions-view";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = pageMetadata({ title: "Sesiones de crafteo", path: "/es/sesiones", index: false });

export default function SesionesPage() {
  return (
    <>
      <SiteHeader title="Sesiones de crafteo" description="Agrupá varios crafteos y mirá cuánto sacaste en total. Podés reemplazar las estimaciones por tus números reales." />
      <main id="contenido" className="mx-auto max-w-4xl px-3 pb-8 sm:px-6">
        <SessionsView />
        <SiteFooter className="mt-12">
          <p className="text-xs text-muted-foreground">Tus sesiones son privadas: solo vos podés verlas.</p>
        </SiteFooter>
      </main>
    </>
  );
}
