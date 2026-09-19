import { Skeleton } from "@/components/ui/skeleton";

export default function PageLoading() {
  return (
    <main id="contenido" className="mx-auto max-w-5xl px-3 py-4 sm:px-6 sm:py-8" aria-busy="true">
      <span className="sr-only" role="status">Cargando…</span>
      <Skeleton className="h-6 w-48" />
      <Skeleton className="mt-2 h-4 w-80 max-w-full" />
      <Skeleton className="mt-6 h-72 w-full" />
    </main>
  );
}
