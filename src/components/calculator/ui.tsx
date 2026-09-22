"use client";

import { formatInt } from "@/lib/format";
import { cloneElement, isValidElement, useEffect, useId, useState, type ReactElement, type ReactNode } from "react";
import { ChevronDown, HelpCircle, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

/** The app's one money-colored CTA look, in filled and outline flavors. Size (height, padding,
 * text size) stays per-call since it varies by context -- these constants only own color, weight
 * and the hover/disabled interaction, so a palette or interaction change only needs editing here. */
export const CTA_PRIMARY =
  "rounded-sm border border-money bg-money font-medium tracking-wide text-money-foreground transition-opacity duration-150 hover:opacity-90 disabled:opacity-50";
export const CTA_SECONDARY =
  "rounded-sm border border-money/50 bg-money/10 font-medium tracking-wide text-money transition-colors duration-150 hover:bg-money/20 disabled:opacity-50";

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
      <span className="text-xs text-muted-foreground">{label}</span>
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


/** Integer input that shows thousands separators (es-AR) while typing. */
export function SilverInput({
  value,
  onChange,
  label,
  className,
  invalid,
  edited,
  id,
}: {
  value: number;
  onChange: (v: number) => void;
  label: string;
  className?: string;
  invalid?: boolean;
  edited?: boolean;
  id?: string;
}) {
  const [text, setText] = useState(formatInt(value));
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!focused) setText(formatInt(value));
  }, [value, focused]);

  return (
    <input
      id={id}
      inputMode="numeric"
      aria-label={label}
      value={text}
      onFocus={(e) => {
        setFocused(true);
        e.currentTarget.select();
      }}
      onBlur={() => {
        setFocused(false);
        setText(formatInt(value));
      }}
      onChange={(e) => {
        const digits = e.target.value.replace(/\D/g, "");
        const n = digits === "" ? 0 : Math.min(Number(digits.slice(0, 12)), 999_999_999_999);
        setText(digits === "" ? "" : formatInt(n));
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
  const id = useId();
  return (
    <div className={className}>
      <div className="flex min-h-4 items-baseline justify-between gap-2">
        <label htmlFor={id} className="text-xs text-muted-foreground">{label}</label>
        {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
      </div>
      <div className="mt-1">{isValidElement(children) ? cloneElement(children as ReactElement<{ id?: string }>, { id }) : children}</div>
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
  const tipId = useId();
  return (
    <span className="relative inline-flex items-center gap-1">
      {term}
      <button
        type="button"
        aria-label={`Qué significa: ${typeof term === "string" ? term : "este término"}`}
        aria-expanded={open}
        aria-describedby={open ? tipId : undefined}
        onClick={() => setOpen((o) => !o)}
        onBlur={() => setOpen(false)}
        onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
        className="relative text-muted-foreground transition-colors hover:text-foreground after:absolute after:-inset-2 after:content-['']"
      >
        <HelpCircle className="h-3.5 w-3.5" />
      </button>
      {open && (
        <span role="tooltip" id={tipId} className="absolute right-0 top-full z-30 mt-1.5 w-64 rounded-md border border-border bg-popover p-2.5 text-left text-xs font-normal normal-case leading-snug text-foreground">
          {text}
        </span>
      )}
    </span>
  );
}

/** A toggle button with a chevron that flips 180° when open -- the calculator's own recurring
 * disclosure pattern ("Otras ciudades", "Configuración avanzada", "De dónde sale el precio",
 * "Guardar este cálculo"), each of which used to hand-roll the same button + chevron markup. */
export function DisclosureButton({
  open,
  onToggle,
  children,
  className,
  chevronPosition = "start",
}: {
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
  className?: string;
  chevronPosition?: "start" | "end";
}) {
  const chevron = <ChevronDown className={cn("h-3.5 w-3.5 shrink-0 transition-transform duration-150", open && "rotate-180")} />;
  return (
    <button type="button" aria-expanded={open} onClick={onToggle} className={className}>
      {chevronPosition === "start" && chevron}
      {children}
      {chevronPosition === "end" && chevron}
    </button>
  );
}

/** Trash icon that turns into an inline "Borrar / Cancelar" pair on click, instead of deleting on
 * the first tap -- shared by every list here (planificaciones, sesiones) that lets the player
 * remove a saved row. */
export function ConfirmDelete({
  confirming,
  onRequestConfirm,
  onConfirm,
  onCancel,
  label,
  confirmLabel = "Borrar",
}: {
  confirming: boolean;
  onRequestConfirm: () => void;
  onConfirm: () => void;
  onCancel: () => void;
  /** aria-label for the trash icon button, e.g. `Borrar ${name}`. */
  label: string;
  confirmLabel?: string;
}) {
  if (confirming) {
    return (
      <span className="flex items-center gap-2 text-xs">
        <button type="button" onClick={onConfirm} className="text-destructive underline underline-offset-2">
          {confirmLabel}
        </button>
        <button type="button" onClick={onCancel} className="text-muted-foreground underline underline-offset-2">
          Cancelar
        </button>
      </span>
    );
  }
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onRequestConfirm}
      className="relative p-1.5 text-muted-foreground transition-colors hover:text-destructive after:absolute after:-inset-1.5 after:content-['']"
    >
      <Trash2 className="h-4 w-4" />
    </button>
  );
}
