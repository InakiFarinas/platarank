"use client";

import { useEffect, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Mutually exclusive choice rendered as a joined button group -- clearer than a switch when both
 * sides have a name (Premium / Sin premium, Royal / Black Market). */
export function Segmented<T extends string | number>({
  label,
  value,
  options,
  onChange,
  className,
}: {
  label: string;
  value: T;
  options: { value: T; text: ReactNode; title?: string }[];
  onChange: (v: T) => void;
  className?: string;
}) {
  return (
    <div className={className}>
      <span className="text-[11px] text-muted-foreground">{label}</span>
      <div role="radiogroup" aria-label={label} className="mt-1 flex overflow-hidden rounded-md border border-border">
        {options.map((o) => {
          const active = o.value === value;
          return (
            <button
              key={String(o.value)}
              type="button"
              role="radio"
              aria-checked={active}
              title={o.title}
              onClick={() => onChange(o.value)}
              className={cn(
                "relative h-9 flex-1 px-2.5 text-xs font-medium transition-colors duration-150 not-first:border-l not-first:border-border",
                active ? "bg-money/15 text-money" : "text-muted-foreground hover:bg-accent/40 hover:text-foreground",
              )}
            >
              {o.text}
            </button>
          );
        })}
      </div>
    </div>
  );
}

const fmtInt = (n: number) => Math.round(n).toLocaleString("es-AR");

/** Integer input that shows thousands separators (es-AR) while typing. */
export function SilverInput({
  value,
  onChange,
  label,
  className,
  invalid,
  edited,
}: {
  value: number;
  onChange: (v: number) => void;
  label: string;
  className?: string;
  invalid?: boolean;
  edited?: boolean;
}) {
  const [text, setText] = useState(fmtInt(value));
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!focused) setText(fmtInt(value));
  }, [value, focused]);

  return (
    <input
      inputMode="numeric"
      aria-label={label}
      value={text}
      onFocus={(e) => {
        setFocused(true);
        e.currentTarget.select();
      }}
      onBlur={() => {
        setFocused(false);
        setText(fmtInt(value));
      }}
      onChange={(e) => {
        const digits = e.target.value.replace(/\D/g, "");
        const n = digits === "" ? 0 : Number(digits);
        setText(digits === "" ? "" : fmtInt(n));
        onChange(n);
      }}
      className={cn(
        "h-9 w-full rounded-md border bg-background px-2.5 text-right font-mono text-sm tabular-nums outline-none transition-colors duration-150 focus-visible:border-money focus-visible:ring-2 focus-visible:ring-money/30",
        invalid ? "border-dashed border-destructive/70" : edited ? "border-money/60" : "border-border",
        className,
      )}
    />
  );
}

export function Field({ label, hint, children, className }: { label: string; hint?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <div className={className}>
      <div className="flex min-h-4 items-baseline justify-between gap-2">
        <span className="text-[11px] text-muted-foreground">{label}</span>
        {hint && <span className="text-[11px] text-muted-foreground">{hint}</span>}
      </div>
      <div className="mt-1">{children}</div>
    </div>
  );
}

/** Panel with an IM Fell title -- the same ledger-card vocabulary the ranking pages use. */
export function Panel({ title, aside, children, className }: { title: string; aside?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-md border border-border bg-card/40", className)}>
      <header className="flex items-baseline justify-between gap-3 border-b border-border px-4 py-2.5">
        <h3 className="font-heading text-base">{title}</h3>
        {aside && <div className="text-xs text-muted-foreground">{aside}</div>}
      </header>
      <div className="p-4">{children}</div>
    </section>
  );
}
