"use client";

import { useTranslations } from "next-intl";

export default function RankingError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useTranslations("stations.error");
  return (
    <main id="contenido" className="mx-auto flex max-w-5xl flex-col items-start gap-3 px-3 py-10 sm:px-6">
      <h1 className="text-lg font-semibold">{t("title")}</h1>
      <p className="text-sm text-muted-foreground">{t("body")}</p>
      <button
        type="button"
        onClick={reset}
        className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-accent"
      >
        {t("retry")}
      </button>
    </main>
  );
}
