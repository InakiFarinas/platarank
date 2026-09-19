import type { Metadata } from "next";
import { SessionsView } from "@/components/sessions/sessions-view";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  title: "Sesiones de crafteo",
  robots: { index: false },
  alternates: { canonical: "/es/sesiones" },
};

export default function SesionesPage() {
  return (
    <>
      <SiteHeader title="Sesiones de crafteo" description="Agrupá varios crafteos y mirá cuánto sacaste en total. Podés reemplazar las estimaciones por tus números reales." />
      <main className="mx-auto max-w-4xl px-3 pb-8 sm:px-6">
        <SessionsView />
        <SiteFooter className="mt-12">
          <p className="text-xs text-muted-foreground">Tus sesiones son privadas: solo vos podés verlas.</p>
        </SiteFooter>
      </main>
    </>
  );
}
