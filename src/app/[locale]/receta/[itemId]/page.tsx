import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { breadcrumbSchema, faqSchema, FaqList, JsonLd, type Faq } from "@/components/json-ld";
import { formatAge, formatSilver } from "@/components/recipes/format";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { CTA_PRIMARY, CTA_SECONDARY } from "@/lib/cta";
import { formatInt } from "@/lib/format";
import { itemIconUrl } from "@/lib/item-icons";
import { absoluteUrl, pageMetadata } from "@/lib/seo";
import { loadItemRow } from "@/lib/server/item-data";
import { STATION_SEO } from "@/lib/station-seo";
import type { StationType } from "@/lib/server/station-data";
import recipesJson from "@/data/generated/recipes.json";

// Rendered on first visit and then refreshed hourly, like the rankings; not pre-built (6k+ items).
export const revalidate = 3600;
export const dynamicParams = true;
export function generateStaticParams() {
  return [];
}

type Params = { locale: string; itemId: string };
type Variant = { itemId: string; tier: number; enchant: number };

const tierless = (id: string) => id.replace(/^T[0-9]+_/, "");

function itemLabel(r: { nameEs: string; tier: number; enchant: number }) {
  return `${r.nameEs} T${r.tier}${r.enchant > 0 ? `.${r.enchant}` : ""}`;
}

function variantsOf(baseItemId: string, itemId: string): Variant[] {
  const suffix = tierless(baseItemId);
  return (recipesJson as (Variant & { baseItemId: string })[])
    .filter((v) => tierless(v.baseItemId) === suffix && v.itemId !== itemId)
    .sort((a, b) => a.tier - b.tier || a.enchant - b.enchant);
}

function pct(v: number | null) {
  return v === null ? "--" : `${Math.round(v * 100)}%`;
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { itemId: raw } = await params;
  const row = await loadItemRow(decodeURIComponent(raw));
  if (!row) return { title: "Receta no encontrada", robots: { index: false } };
  const r = row.recipe;
  const path = `/es/receta/${encodeURIComponent(r.itemId)}`;
  const title = `Cuánto cuesta craftear ${itemLabel(r)} en Albion Online`;
  if (!row.hasData || row.costPerUnit === null || row.profitPerUnit === null || row.sellRefPrice === null) {
    return pageMetadata({ title, path, index: false });
  }
  const description = `${itemLabel(r)} cuesta ${formatInt(row.costPerUnit)} de plata por unidad y se vende a ${formatInt(row.sellRefPrice)}: ganancia de ${formatInt(row.profitPerUnit)} (${pct(row.marginPct)}) y ${formatSilver(row.platinumPerDay)} de plata por día. Servidor Américas.`;
  return pageMetadata({ title, description, path });
}

export default async function RecipeItemPage({ params }: { params: Promise<Params> }) {
  const { itemId: raw } = await params;
  const row = await loadItemRow(decodeURIComponent(raw));
  if (!row) notFound();

  const r = row.recipe;
  const label = itemLabel(r);
  const station = STATION_SEO[r.stationType as StationType];
  const variants = variantsOf(r.baseItemId, r.itemId);
  const path = `/es/receta/${encodeURIComponent(r.itemId)}`;
  const calcHref = `/es/calculadora?item=${encodeURIComponent(r.itemId)}`;
  const stationHref = `/es/${station.path}`;

  const cost = row.costPerUnit;
  const sell = row.sellRefPrice;
  const profit = row.profitPerUnit;
  const priced = row.hasData && cost !== null && sell !== null && profit !== null;

  const faqs: Faq[] = priced
    ? [
        {
          q: `¿Cuánto cuesta craftear ${label}?`,
          a: `Con los precios actuales del servidor Américas, ${formatInt(cost)} de plata por unidad: materiales comprados en la ciudad más barata${row.returnRatePct > 0 ? ` (con ${row.returnRatePct.toFixed(1)}% de retorno de recursos)` : ""} más la tarifa de estación.`,
        },
        {
          q: `¿Es rentable craftear ${label}?`,
          a: `${profit > 0 ? "Sí" : "No"} con estos supuestos: ganancia de ${formatInt(profit)} por unidad (${pct(row.marginPct)} de margen) y ${formatSilver(row.platinumPerDay)} de plata por día, con un volumen de ${formatSilver(row.avgDailyVolume30d)} ventas diarias y ${Math.round(row.marketSharePct * 100)}% de cuota de mercado.`,
        },
        {
          q: "¿Con qué supuestos se calcula?",
          a: "Se craftea en Brecilien sin foco, se compra en la ciudad más barata y se vende a la mediana de ciudades, descontando impuestos. En la calculadora podés cambiar ciudad, foco y precios.",
        },
      ]
    : [];

  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: "PlataRank", url: absoluteUrl("/es") },
          { name: station.name, url: absoluteUrl(stationHref) },
          { name: label, url: absoluteUrl(path) },
        ])}
      />
      {faqs.length > 0 && <JsonLd data={faqSchema(faqs)} />}
      <SiteHeader title={label} description={`Costo de crafteo, ganancia y plata por día · ${station.name} · Américas`} />
      <main id="contenido" className="mx-auto max-w-4xl px-3 pb-8 sm:px-6">
        <div className="flex items-start gap-4">
          <Image src={itemIconUrl(r.itemId, 1, 128)} alt={label} width={96} height={96} unoptimized className="h-24 w-24 shrink-0" />
          <div className="min-w-0 text-sm leading-relaxed sm:text-base">
            {priced ? (
              <p>
                Craftear <strong>{label}</strong> en Albion Online cuesta <strong>{formatInt(cost)}</strong> de plata por unidad y se vende a{" "}
                <strong>{formatInt(sell)}</strong>. La ganancia es de <strong>{formatInt(profit)}</strong> por unidad ({pct(row.marginPct)} de margen) y deja{" "}
                <strong>{formatSilver(row.platinumPerDay)}</strong> de plata por día. Precio más viejo usado: {formatAge(row.sellRefAgeSeconds)}.
              </p>
            ) : (
              <p>
                Todavía no hay precios suficientes en el servidor Américas para calcular el costo y la ganancia de <strong>{label}</strong>. Podés cargar tus
                propios precios en la calculadora.
              </p>
            )}
            <div className="mt-4 flex flex-wrap gap-3">
              <Link href={calcHref} className={`${CTA_PRIMARY} inline-flex items-center px-4 py-2 text-sm`}>
                Abrir en la calculadora
              </Link>
              <Link href={stationHref} className={`${CTA_SECONDARY} inline-flex items-center px-4 py-2 text-sm`}>
                Ranking de {station.name.toLowerCase()}
              </Link>
            </div>
          </div>
        </div>

        {priced && (
          <section className="mt-10">
            <h2 className="font-display text-2xl uppercase tracking-tight">Cómo sale el número</h2>
            <dl className="mt-4 max-w-md space-y-1.5 text-sm">
              {[
                ["Costo por unidad (materiales y tarifa)", formatInt(cost)],
                ["Precio de venta (mediana de ciudades)", formatInt(sell)],
                ["Ingreso neto tras impuestos", formatInt(row.revenuePerUnitNet ?? 0)],
                ["Ganancia por unidad", formatInt(profit)],
                ["Volumen diario de ventas", formatInt(row.avgDailyVolume30d)],
                ["Plata por día", formatInt(row.platinumPerDay ?? 0)],
              ].map(([k, v]) => (
                <div key={k} className="flex items-baseline justify-between gap-3">
                  <dt className="text-muted-foreground">{k}</dt>
                  <dd className="font-mono tabular-nums">{v}</dd>
                </div>
              ))}
            </dl>
          </section>
        )}

        <section className="mt-10">
          <h2 className="font-display text-2xl uppercase tracking-tight">Materiales</h2>
          <div className="mt-4 overflow-x-auto rounded-sm border border-border bg-card">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground">
                  <th scope="col" className="px-3 py-2 font-normal">Material</th>
                  <th scope="col" className="px-3 py-2 text-right font-normal">Cantidad</th>
                  <th scope="col" className="px-3 py-2 text-right font-normal">Precio</th>
                  <th scope="col" className="px-3 py-2 font-normal">Ciudad más barata</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {row.materials.map((m) => (
                  <tr key={m.itemId}>
                    <th scope="row" className="px-3 py-2 text-left font-normal">{m.nameEs}</th>
                    <td className="px-3 py-2 text-right font-mono tabular-nums">{m.count}</td>
                    <td className="px-3 py-2 text-right font-mono tabular-nums">{m.buyRefPrice === null ? "--" : formatInt(m.buyRefPrice)}</td>
                    <td className="px-3 py-2 text-muted-foreground">{m.cheapestCity ?? (m.bred ? "Criado" : "--")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {variants.length > 0 && (
          <section className="mt-10">
            <h2 className="font-display text-2xl uppercase tracking-tight">Otros tiers y encantamientos</h2>
            <ul className="mt-4 flex flex-wrap gap-2">
              {variants.map((v) => (
                <li key={v.itemId}>
                  <Link
                    href={`/es/receta/${encodeURIComponent(v.itemId)}`}
                    className="inline-flex min-h-6 items-center rounded-sm border border-border px-2.5 py-1 font-mono text-xs text-muted-foreground transition-colors hover:text-foreground"
                  >
                    T{v.tier}
                    {v.enchant > 0 ? `.${v.enchant}` : ""}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {faqs.length > 0 && <FaqList faqs={faqs} className="mt-12" />}

        <SiteFooter className="mt-12">
          <p className="text-xs text-muted-foreground">
            Datos de mercado: Albion Online Data Project. Supuestos por defecto; los detalles están en la{" "}
            <Link href="/es/metodologia" className="underline underline-offset-2 hover:text-foreground">
              metodología
            </Link>
            .
          </p>
        </SiteFooter>
      </main>
    </>
  );
}
