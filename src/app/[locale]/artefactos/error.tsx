"use client";

export default function ArtefactosError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main id="contenido" className="mx-auto flex max-w-5xl flex-col items-start gap-3 px-3 py-10 sm:px-6">
      <h1 className="text-lg font-semibold">No pudimos cargar la Fundición</h1>
      <p className="text-sm text-muted-foreground">Hubo un problema leyendo los precios de mercado. Puede ser temporal: probá de nuevo.</p>
      <button type="button" onClick={reset} className="min-h-11 rounded-md border border-border px-4 text-sm hover:bg-accent">
        Reintentar
      </button>
    </main>
  );
}
