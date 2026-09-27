import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

// Fallback for URLs that never reach a locale (bilingual, no i18n context). Locale-prefixed
// unknown paths render app/[locale]/not-found.tsx instead.
export const metadata: Metadata = { title: "404", robots: { index: false } };

export default function NotFound() {
  return (
    <html lang="es" className="dark">
      <body className="antialiased">
        <main className="mx-auto flex min-h-[70vh] max-w-xl flex-col items-center justify-center gap-4 px-6 text-center">
          <h1 className="text-3xl font-semibold">404</h1>
          <p className="text-sm text-muted-foreground">
            <Link href="/es" className="underline">Volver al inicio</Link> · <Link href="/en" className="underline">Back to home</Link>
          </p>
        </main>
      </body>
    </html>
  );
}
