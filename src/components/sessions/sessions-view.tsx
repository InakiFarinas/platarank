"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Pencil, Trash2 } from "lucide-react";
import { itemIconUrl } from "@/lib/item-icons";
import { cn } from "@/lib/utils";
import { Panel } from "@/components/calculator/ui";
import { itemTotals, sessionTotals, useSessions, type CraftingSession, type SessionItem, type SessionsApi } from "@/components/sessions/use-sessions";

const fmt = (n: number) => Math.round(n).toLocaleString("es-AR");
const signed = (n: number) => `${n >= 0 ? "+" : "−"}${fmt(Math.abs(n))}`;

export function SessionsView() {
  const api = useSessions();

  if (api.signedIn === null) return <p className="py-16 text-center text-sm text-muted-foreground">Cargando…</p>;
  if (!api.signedIn) {
    return (
      <div className="mt-4 rounded-md border border-dashed border-border px-4 py-12 text-center">
        <h2 className="font-heading text-xl">Tus sesiones de crafteo</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          Entrá con Discord para agrupar varios crafteos en una sesión y ver cuánta plata sacás en total.
        </p>
      </div>
    );
  }
  if (api.sessions.length === 0) {
    return (
      <div className="mt-4 rounded-md border border-dashed border-border px-4 py-12 text-center">
        <h2 className="font-heading text-xl">Todavía no tenés sesiones</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          Armá un cálculo en la calculadora y usá &quot;Agregar a sesión&quot; en el balance. Podés sumar varios ítems a la misma sesión.
        </p>
        <Link
          href="/es/calculadora"
          className="mt-4 inline-block rounded-sm border border-money bg-money px-4 py-2 text-sm font-medium tracking-wide text-money-foreground transition-opacity duration-150 hover:opacity-90"
        >
          Ir a la calculadora
        </Link>
      </div>
    );
  }

  const grand = api.sessions.reduce((sum, s) => sum + sessionTotals(s).profit, 0);

  return (
    <div className="mt-4 space-y-4">
      <div className="flex items-baseline justify-between gap-3 rounded-md border-2 border-double border-money/30 bg-card/60 px-4 py-3">
        <span className="font-heading text-base">
          Total de {api.sessions.length} {api.sessions.length === 1 ? "sesión" : "sesiones"}
        </span>
        <span className={cn("font-mono text-xl tabular-nums", grand >= 0 ? "text-money" : "text-destructive")}>{signed(grand)}</span>
      </div>
      {api.error && <p className="text-sm text-destructive">{api.error}</p>}
      {api.sessions.map((s) => (
        <SessionCard key={s.id} session={s} api={api} />
      ))}
    </div>
  );
}

function SessionCard({ session, api }: { session: CraftingSession; api: SessionsApi }) {
  const totals = sessionTotals(session);
  const [confirming, setConfirming] = useState(false);
  return (
    <Panel
      title={<SessionName session={session} api={api} />}
      aside={
        <span className="flex items-center gap-3">
          <span>{new Date(session.created_at).toLocaleDateString("es-AR")}</span>
          {confirming ? (
            <span className="flex items-center gap-2">
              <button type="button" onClick={() => api.deleteSession(session.id)} className="text-destructive underline underline-offset-2">
                Borrar sesión
              </button>
              <button type="button" onClick={() => setConfirming(false)} className="underline underline-offset-2">
                Cancelar
              </button>
            </span>
          ) : (
            <button
              type="button"
              aria-label={`Borrar la sesión ${session.name}`}
              onClick={() => setConfirming(true)}
              className="relative text-muted-foreground transition-colors hover:text-destructive after:absolute after:-inset-2 after:content-['']"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </span>
      }
    >
      {session.session_items.length === 0 ? (
        <p className="text-sm text-muted-foreground">Sin ítems todavía. Agregalos desde la calculadora.</p>
      ) : (
        <ul className="-my-1 divide-y divide-border">
          {session.session_items.map((item) => (
            <ItemRow key={item.id} item={item} api={api} />
          ))}
        </ul>
      )}
      <div className="mt-3 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-t-2 border-double border-money/30 pt-3">
        <span className="font-heading text-base">Ganancia de la sesión</span>
        <span className="flex items-baseline gap-4">
          <span className="text-xs text-muted-foreground">
            invertido <span className="font-mono">{fmt(totals.cost)}</span> · ingreso <span className="font-mono">{fmt(totals.revenue)}</span>
          </span>
          <span className={cn("font-mono text-xl tabular-nums", totals.profit >= 0 ? "text-money" : "text-destructive")}>
            {signed(totals.profit)}
          </span>
        </span>
      </div>
    </Panel>
  );
}

/** Session title with inline rename: pencil -> input, Enter or blur saves, Escape cancels. */
function SessionName({ session, api }: { session: CraftingSession; api: SessionsApi }) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(session.name);

  if (!editing) {
    return (
      <span className="flex items-center gap-2">
        {session.name}
        <button
          type="button"
          aria-label={`Renombrar la sesión ${session.name}`}
          onClick={() => {
            setText(session.name);
            setEditing(true);
          }}
          className="relative text-muted-foreground transition-colors hover:text-foreground after:absolute after:-inset-2 after:content-['']"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
      </span>
    );
  }

  const commit = () => {
    setEditing(false);
    if (text.trim() !== "" && text.trim() !== session.name) void api.renameSession(session.id, text);
  };

  return (
    <input
      autoFocus
      onFocus={(e) => e.currentTarget.select()}
      value={text}
      maxLength={80}
      aria-label="Nombre de la sesión"
      onChange={(e) => setText(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") commit();
        if (e.key === "Escape") setEditing(false);
      }}
      className="h-8 w-full min-w-0 rounded-md border border-money bg-background px-2 font-heading text-base outline-none ring-2 ring-money/30"
    />
  );
}

function ItemRow({ item, api }: { item: SessionItem; api: SessionsApi }) {
  const t = itemTotals(item);
  return (
    <li className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2 py-3 sm:grid-cols-[auto_minmax(0,1fr)_8rem_8rem_6.5rem_auto]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={itemIconUrl(item.item_id, item.params.quality, 64)} alt="" className="h-10 w-10" />
      <div className="min-w-0">
        <Link href={`/es/calculadora?item=${encodeURIComponent(item.item_id)}`} className="block truncate text-sm hover:text-money">
          {item.item_name}
        </Link>
        <div className="text-[11px] text-muted-foreground">
          ×{item.params.qty} · {item.params.craftCity} · {t.isReal ? "con datos reales" : "estimado"}
        </div>
      </div>
      <div className="col-start-3 row-start-1 text-right sm:col-start-5">
        <div className={cn("font-mono text-sm tabular-nums", t.profit >= 0 ? "text-money" : "text-destructive")}>{signed(t.profit)}</div>
      </div>
      <ActualField
        label="Gasto real"
        estimate={item.snapshot.cost}
        actual={item.actual_cost}
        onCommit={(v) => api.setActuals(item.id, v, item.actual_revenue)}
        className="col-span-2 col-start-2 row-start-2 sm:col-span-1 sm:col-start-3 sm:row-start-1"
      />
      <ActualField
        label="Venta real"
        estimate={item.snapshot.revenue}
        actual={item.actual_revenue}
        onCommit={(v) => api.setActuals(item.id, item.actual_cost, v)}
        className="col-start-3 row-start-2 sm:col-start-4 sm:row-start-1"
      />
      <button
        type="button"
        aria-label={`Quitar ${item.item_name}`}
        onClick={() => api.removeItem(item.id)}
        className="relative col-start-1 row-start-2 justify-self-center p-1.5 text-muted-foreground transition-colors hover:text-destructive after:absolute after:-inset-1.5 after:content-[''] sm:col-start-6 sm:row-start-1"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </li>
  );
}

/** Optional real figure for an item: empty means "use the calculator's estimate" (shown as the
 * placeholder). Saves shortly after the player stops typing. */
function ActualField({
  label,
  estimate,
  actual,
  onCommit,
  className,
}: {
  label: string;
  estimate: number;
  actual: number | null;
  onCommit: (v: number | null) => void;
  className?: string;
}) {
  const [text, setText] = useState(actual === null ? "" : fmt(actual));
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setText(actual === null ? "" : fmt(actual));
  }, [actual]);
  useEffect(() => () => void (timer.current && clearTimeout(timer.current)), []);

  return (
    <label className={className}>
      <span className="block text-[11px] text-muted-foreground">{label}</span>
      <input
        inputMode="numeric"
        value={text}
        placeholder={fmt(estimate)}
        aria-label={label}
        onChange={(e) => {
          const digits = e.target.value.replace(/\D/g, "");
          setText(digits === "" ? "" : fmt(Number(digits)));
          if (timer.current) clearTimeout(timer.current);
          timer.current = setTimeout(() => onCommit(digits === "" ? null : Number(digits)), 700);
        }}
        className={cn(
          "mt-0.5 h-9 w-full rounded-md border bg-background px-2 text-right font-mono text-sm tabular-nums outline-none transition-colors duration-150 placeholder:text-muted-foreground/70 focus-visible:border-money focus-visible:ring-2 focus-visible:ring-money/30",
          actual === null ? "border-border" : "border-money/60",
        )}
      />
    </label>
  );
}
