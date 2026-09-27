import Link from "next/link";
import type { ReactNode } from "react";
import { getLocale, getTranslations } from "next-intl/server";
import { Logo } from "@/components/logo";
import { localePath, type Locale } from "@/i18n/config";

// 24px tall hit area (WCAG 2.2 target size) around 12px text, without changing how the row looks.
const LEGAL_LINK = "inline-flex min-h-6 items-center hover:text-foreground hover:underline";

/** Shared footer lockup (rule-fleur divider + wax-seal wordmark) used by the home page and every
 * ranked-list page; each caller supplies its own attribution/disclaimer copy as children. */
export async function SiteFooter({
  className,
  containerClassName,
  locale: localeProp,
  children,
}: {
  className?: string;
  containerClassName?: string;
  /** Pass when the caller has it; otherwise read from the request. */
  locale?: Locale;
  children: ReactNode;
}) {
  const locale = localeProp ?? ((await getLocale()) as Locale);
  const t = await getTranslations({ locale, namespace: "common.footer" });
  return (
    <footer className={className}>
      <div className={containerClassName}>
        <div className="rule-fleur mb-4" />
        <div className="flex flex-col items-center gap-3 text-center sm:flex-row sm:justify-between sm:text-left">
          <div className="flex items-center gap-2">
            <Logo size="sm" />
            <span className="font-display text-sm uppercase tracking-wide">PlataRank</span>
          </div>
          {children}
        </div>
        <nav aria-label={t("legalNav")} className="mt-4 flex flex-wrap justify-center gap-x-5 text-xs text-muted-foreground sm:justify-start">
          <Link href={localePath(locale, "methodology")} className={LEGAL_LINK}>{t("methodology")}</Link>
          <Link href={localePath(locale, "about")} className={LEGAL_LINK}>{t("about")}</Link>
          <Link href={localePath(locale, "privacy")} className={LEGAL_LINK}>{t("privacy")}</Link>
          <Link href={localePath(locale, "terms")} className={LEGAL_LINK}>{t("terms")}</Link>
          <a href="https://discord.gg/ZZRcGSEXeh" target="_blank" rel="noopener noreferrer" className={`${LEGAL_LINK} text-money`}>
            {t("discord")}
          </a>
          <a href="https://ko-fi.com/lacolo" target="_blank" rel="noopener noreferrer" className={`${LEGAL_LINK} text-money`}>
            {t("kofi")}
          </a>
        </nav>
      </div>
    </footer>
  );
}
