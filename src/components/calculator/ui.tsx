"use client";

import { useEffect, useState, type ReactNode } from "react";
import { HelpCircle } from "lucide-react";
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
      <div
        role="radiogroup"
        aria-label={label}
        onKeyDown={(e) => {
          const keys = ["ArrowLeft", "ArrowUp", "ArrowRight", "ArrowDown"];
          if (!keys.includes(e.key)) return;
          e.preventDefault();
          const i = Math.max(0, options.findIndex((o) => o.value === value));
          const next = (i + (e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 1) + options.length) % options.length;
          onChange(options[next].value);
          (e.currentTarget.querySelectorAll("[role=radio]")[next] as HTMLElement | undefined)?.focus();
        }}
        className="mt-1 flex overflow-hidden rounded-md border border-border"
      >
        {options.map((o, idx) => {
          const active = o.value === value;
          const focusable = active || (idx === 0 && !options.some((x) => x.value === value));
          return (
            <button
              key={String(o.value)}
              type="button"
              role="radio"
              aria-checked={active}
              tabIndex={focusable ? 0 : -1}
              title={o.title}
              onClick={() => onChange(o.value)}
              className={cn(
                "relative h-11 flex-1 px-2.5 sm:h-9 text-xs font-medium transition-colors duration-150 not-first:border-l not-first:border-border",
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
        "h-11 w-full rounded-md border bg-background px-2.5 text-right font-mono sm:h-9 text-sm tabular-nums outline-none transition-colors duration-150 focus-visible:border-money focus-visible:ring-2 focus-visible:ring-money/30",
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
export function Panel({ title, aside, children, className }: { title: ReactNode; aside?: ReactNode; children: ReactNode; className?: string }) {
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

/** A term followed by a "?" that opens a short explanation on tap, click or Enter -- unlike a
 * title attribute, it works on a phone and with the keyboard. Closes on blur or Escape. */
export function InfoTip({ term, text }: { term: ReactNode; text: string }) {
  const [open, setOpen] = useState(false);
  return (
    <span className="relative inline-flex items-center gap-1">
      {term}
      <button
        type="button"
        aria-label={`Qué significa: ${typeof term === "string" ? term : "este término"}`}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        onBlur={() => setOpen(false)}
        onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
        className="relative text-muted-foreground transition-colors hover:text-foreground after:absolute after:-inset-2 after:content-['']"
      >
        <HelpCircle className="h-3.5 w-3.5" />
      </button>
      {open && (
        <span role="tooltip" className="absolute right-0 top-full z-30 mt-1.5 w-64 rounded-md border border-border bg-popover p-2.5 text-left text-xs font-normal normal-case leading-snug text-foreground">
          {text}
        </span>
      )}
    </span>
  );
}
