"use client";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="mx-auto flex max-w-5xl flex-col items-start gap-3 px-3 py-10 sm:px-6">
      <h1 className="text-lg font-semibold">No pudimos cargar el ranking</h1>
      <p className="text-sm text-muted-foreground">
        Hubo un problema leyendo los datos de mercado. Puede ser temporal -- probá de nuevo.
      </p>
      <button
        type="button"
        onClick={reset}
        className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-accent"
      >
        Reintentar
      </button>
    </main>
  );
}
