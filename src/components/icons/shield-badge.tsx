import type { ReactNode } from "react";

const SHIELD_CLIP = "polygon(50% 0%, 100% 15%, 100% 55%, 50% 100%, 0% 55%, 0% 15%)";

export function ShieldBadge({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={`relative flex h-12 w-11 shrink-0 items-center justify-center border border-money/50 bg-gradient-to-b from-money/20 to-money/5 text-money ${className ?? ""}`}
      style={{ clipPath: SHIELD_CLIP }}
    >
      {children}
    </span>
  );
}
