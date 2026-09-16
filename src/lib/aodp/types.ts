export type AodpPriceRow = {
  item_id: string;
  city: string;
  quality: number;
  sell_price_min: number;
  sell_price_min_date: string;
  sell_price_max: number;
  sell_price_max_date: string;
  buy_price_min: number;
  buy_price_min_date: string;
  buy_price_max: number;
  buy_price_max_date: string;
};

export type AodpHistoryPoint = {
  /** Sell-order fulfillment count, NOT total market activity. Every "volume" figure this app
   * shows or ranks by is sell-side volume -- copy says "volumen de ventas", never "del mercado". */
  item_count: number;
  avg_price: number;
  timestamp: string;
};

export type AodpHistoryRow = {
  location: string;
  item_id: string;
  quality: number;
  data: AodpHistoryPoint[];
};

/**
 * AODP timestamps are UTC but come back without a trailing "Z" (e.g. "2026-09-15T04:00:00").
 * Treating them as local time would silently shift every age/freshness calculation.
 */
export function parseAodpTimestamp(raw: string): Date {
  return new Date(raw.endsWith("Z") ? raw : `${raw}Z`);
}
