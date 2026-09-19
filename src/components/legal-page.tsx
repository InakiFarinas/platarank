import type { ReactNode } from "react";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export function LegalPage({ title, updated, children }: { title: string; updated: string; children: ReactNode }) {
  return (
    <>
      <SiteHeader title={title} description={`Última actualización: ${updated}`} />
      <main className="mx-auto max-w-3xl px-3 pb-8 sm:px-6">
        <div className="space-y-4 text-sm leading-relaxed text-muted-foreground [&_a]:text-money [&_a]:underline [&_a]:underline-offset-2 [&_h2]:mt-8 [&_h2]:font-heading [&_h2]:text-base [&_h2]:text-foreground [&_li]:ml-5 [&_li]:list-disc [&_strong]:text-foreground">
          {children}
        </div>
        <SiteFooter className="mt-12">
          <p className="text-xs text-muted-foreground">Esta herramienta no está afiliada a Sandbox Interactive. Uso no oficial.</p>
        </SiteFooter>
      </main>
    </>
  );
}
