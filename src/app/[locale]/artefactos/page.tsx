import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { FoundryTool } from "@/components/artifacts/foundry-tool";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { loadArtifactPools } from "@/lib/server/artifact-data";

export const revalidate = 3600;

export const metadata: Metadata = pageMetadata({
  title: "Fundición de artefactos de Albion Online: valor esperado por tirada",
  description:
    "Valor esperado de tirar Runas, Almas, Reliquias o fragmentos de Avalon en la Fundición de artefactos de Albion Online: costo, ganancia, peor y mejor caso y probabilidad de perder, por tier.",
  path: "/es/artefactos",
});

export default async function ArtefactosPage() {
  const pools = await loadArtifactPools();
  return (
    <>
      <SiteHeader
        title="Fundición de artefactos"
        description="Cada tirada da un artefacto al azar del pozo elegido, todos con la misma probabilidad. Acá ves si conviene y cuánto arriesgás."
      />
      <main id="contenido" className="mx-auto max-w-5xl px-3 pb-8 sm:px-6">
        <FoundryTool pools={pools} />
        <SiteFooter className="mt-8">
          <p className="text-xs text-muted-foreground">Datos de mercado: Albion Online Data Project.</p>
        </SiteFooter>
      </main>
    </>
  );
}
