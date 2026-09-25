import Link from "next/link";
import type { ReactNode } from "react";
import { Logo } from "@/components/logo";

// 24px tall hit area (WCAG 2.2 target size) around 12px text, without changing how the row looks.
const LEGAL_LINK = "inline-flex min-h-6 items-center hover:text-foreground hover:underline";

/** Shared footer lockup (rule-fleur divider + wax-seal wordmark) used by the home page and every
 * ranked-list page; each caller supplies its own attribution/disclaimer copy as children. */
export function SiteFooter({
  className,
  containerClassName,
  children,
}: {
  className?: string;
  containerClassName?: string;
  children: ReactNode;
}) {
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
        <nav aria-label="Legal" className="mt-4 flex flex-wrap justify-center gap-x-5 text-xs text-muted-foreground sm:justify-start">
          <Link href="/es/metodologia" className={LEGAL_LINK}>Metodología</Link>
          <Link href="/es/privacidad" className={LEGAL_LINK}>Privacidad</Link>
          <Link href="/es/terminos" className={LEGAL_LINK}>Términos</Link>
          <a href="https://discord.gg/ZZRcGSEXeh" target="_blank" rel="noopener noreferrer" className={`${LEGAL_LINK} text-money`}>
            Discord de la comunidad
          </a>
          <a href="https://ko-fi.com/lacolo" target="_blank" rel="noopener noreferrer" className={`${LEGAL_LINK} text-money`}>
            Apoyar en Ko-fi
          </a>
        </nav>
      </div>
    </footer>
  );
}
