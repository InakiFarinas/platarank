"use client";

import { formatInt } from "@/lib/format";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { Pencil, Trash2 } from "lucide-react";
import { localePath, type Locale } from "@/i18n/config";
import { enchantLabel } from "@/components/recipes/format";
import { itemIconUrl } from "@/lib/item-icons";
import { cn } from "@/lib/utils";
import { CTA_PRIMARY, ConfirmDelete, Panel } from "@/components/calculator/ui";
import { itemTotals, sessionTotals, useSessions, type CraftingSession, type SessionItem, type SessionsApi } from "@/components/sessions/use-sessions";

type SavedNames = Record<string, { nameEs: string; nameEn: string; tier: number; enchant: number }>;
const nameCache = new Map<string, Promise<SavedNames>>();

/** Session items store their display name in the locale they were saved in; re-resolve it from the
 * item id so English users see English names (and vice versa). Falls back to the stored name. */
function useDisplayName(item: SessionItem, locale: Locale): string {
  const [resolved, setResolved] = useState<string | null>(null);
  useEffect(() => {
    let live = true;
    let req = nameCache.get(item.item_id);
    if (!req) {
      req = fetch(`/api/item-names?ids=${encodeURIComponent(item.item_id)}`).then((r) => (r.ok ? r.json() : {}), () => ({}));
      nameCache.set(item.item_id, req);
    }
    req.then((names) => {
      const n = names[item.item_id];
      if (live && n) setResolved(`${locale === "en" ? n.nameEn : n.nameEs} T${n.tier}${enchantLabel(n.enchant)}`);
    });
    return () => {
      live = false;
    };
  }, [item.item_id, locale]);
  return resolved ?? item.item_name;
}

const signed = (n: number) => `${n >= 0 ? "+" : "−"}${formatInt(Math.abs(n))}`;

export function SessionsView() {
  const api = useSessions();
  const t = useTranslations("sessions");
  const locale = useLocale() as Locale;

  if (api.signedIn === null) return <p className="py-16 text-center text-sm text-muted-foreground">{t("loading")}</p>;
  if (!api.signedIn) {
    return (
      <div className="mt-4 rounded-md border border-dashed border-border px-4 py-12 text-center">
        <h2 className="font-heading text-xl">{t("view.signedOutTitle")}</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          {t("view.signedOutBody")}
        </p>
      </div>
    );
  }
  if (api.sessions.length === 0) {
    return (
      <div className="mt-4 rounded-md border border-dashed border-border px-4 py-12 text-center">
        <h2 className="font-heading text-xl">{t("view.emptyTitle")}</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          {t("view.emptyBody")}
        </p>
        <Link
          href={localePath(locale, "calculator")}
          className={cn(CTA_PRIMARY, "mt-4 inline-block px-4 py-2 text-sm")}
        >
          {t("view.goCalculator")}
        </Link>
      </div>
    );
  }

  const grand = api.sessions.reduce((sum, s) => sum + sessionTotals(s).profit, 0);

  return (
    <div className="mt-4 space-y-4">
      <div className="flex items-baseline justify-between gap-3 rounded-md border-2 border-double border-money/30 bg-card/60 px-4 py-3">
        <span className="font-heading text-base">
          {t("view.total", { count: api.sessions.length })}
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
  const t = useTranslations("sessions.view");
  const locale = useLocale() as Locale;
  const totals = sessionTotals(session);
  const [confirming, setConfirming] = useState(false);
  return (
    <Panel
      title={<SessionName session={session} api={api} />}
      aside={
        <span className="flex items-center gap-3">
          <span>{new Date(session.created_at).toLocaleDateString(locale === "en" ? "en-US" : "es-AR")}</span>
          <ConfirmDelete
            confirming={confirming}
            onRequestConfirm={() => setConfirming(true)}
            onConfirm={() => api.deleteSession(session.id)}
            onCancel={() => setConfirming(false)}
            label={t("deleteLabel", { name: session.name })}
            confirmLabel={t("deleteConfirm")}
          />
        </span>
      }
    >
      {session.session_items.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("noItems")}</p>
      ) : (
        <ul className="-my-1 divide-y divide-border">
          {session.session_items.map((item) => (
            <ItemRow key={item.id} item={item} api={api} />
          ))}
        </ul>
      )}
      <div className="mt-3 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-t-2 border-double border-money/30 pt-3">
        <span className="font-heading text-base">{t("sessionProfit")}</span>
        <span className="flex items-baseline gap-4">
          <span className="text-xs text-muted-foreground">
            {t("invested")} <span className="font-mono">{formatInt(totals.cost)}</span> · {t("income")} <span className="font-mono">{formatInt(totals.revenue)}</span>
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
  const t = useTranslations("sessions.view");
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(session.name);

  if (!editing) {
    return (
      <span className="flex items-center gap-2">
        {session.name}
        <button
          type="button"
          aria-label={t("renameLabel", { name: session.name })}
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
      aria-label={t("nameLabel")}
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
  const tr = useTranslations("sessions.view");
  const locale = useLocale() as Locale;
  const t = itemTotals(item);
  const displayName = useDisplayName(item, locale);
  return (
    <li className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2 py-3 sm:grid-cols-[auto_minmax(0,1fr)_8rem_8rem_6.5rem_auto]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={itemIconUrl(item.item_id, item.params.quality, 64)} alt="" width={40} height={40} className="h-10 w-10" />
      <div className="min-w-0">
        <Link href={localePath(locale, "calculator", `?item=${encodeURIComponent(item.item_id)}`)} className="block truncate text-sm hover:text-money">
          {displayName}
        </Link>
        <div className="text-xs text-muted-foreground">
          ×{item.params.qty} · {item.params.craftCity} · {t.isReal ? tr("withRealData") : tr("estimated")}
        </div>
      </div>
      <div className="col-start-3 row-start-1 text-right sm:col-start-5">
        <div className={cn("font-mono text-sm tabular-nums", t.profit >= 0 ? "text-money" : "text-destructive")}>{signed(t.profit)}</div>
      </div>
      <ActualField
        label={tr("actualCost")}
        estimate={item.snapshot.cost}
        actual={item.actual_cost}
        onCommit={(v) => api.setActuals(item.id, v, item.actual_revenue)}
        className="col-span-2 col-start-2 row-start-2 sm:col-span-1 sm:col-start-3 sm:row-start-1"
      />
      <ActualField
        label={tr("actualRevenue")}
        estimate={item.snapshot.revenue}
        actual={item.actual_revenue}
        onCommit={(v) => api.setActuals(item.id, item.actual_cost, v)}
        className="col-start-3 row-start-2 sm:col-start-4 sm:row-start-1"
      />
      <button
        type="button"
        aria-label={tr("removeItem", { name: displayName })}
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
  const [text, setText] = useState(actual === null ? "" : formatInt(actual));
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setText(actual === null ? "" : formatInt(actual));
  }, [actual]);
  useEffect(() => () => void (timer.current && clearTimeout(timer.current)), []);

  return (
    <label className={className}>
      <span className="block text-xs text-muted-foreground">{label}</span>
      <input
        inputMode="numeric"
        value={text}
        placeholder={formatInt(estimate)}
        aria-label={label}
        onChange={(e) => {
          const digits = e.target.value.replace(/\D/g, "");
          setText(digits === "" ? "" : formatInt(Number(digits)));
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
