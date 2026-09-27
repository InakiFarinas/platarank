"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { locales, switchLocalePath, type Locale } from "@/i18n/config";
import { cn } from "@/lib/utils";

/** ES | EN toggle: links to the same page in the other locale (query string preserved). */
export function LanguageSwitch({ className }: { className?: string }) {
  const locale = useLocale() as Locale;
  const pathname = usePathname() ?? "";
  const t = useTranslations("common.language");
  const [search, setSearch] = useState("");
  useEffect(() => setSearch(window.location.search), [pathname]);

  return (
    <div className={cn("flex items-center gap-0.5 text-xs", className)} role="group" aria-label={t("label")}>
      {locales.map((l) => (
        <Link
          key={l}
          href={`${switchLocalePath(pathname, l)}${search}`}
          hrefLang={l}
          lang={l}
          aria-current={l === locale ? "true" : undefined}
          aria-label={t(l)}
          className={cn(
            "rounded px-1.5 py-1 font-mono uppercase transition-colors",
            l === locale ? "bg-money/15 text-money" : "text-muted-foreground hover:text-foreground",
          )}
        >
          {l}
        </Link>
      ))}
    </div>
  );
}
