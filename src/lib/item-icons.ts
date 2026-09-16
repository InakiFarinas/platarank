/** Official Albion Online item render CDN -- no auth, widely used by the AODP tool ecosystem. */
export function itemIconUrl(itemId: string, quality = 1, size = 64): string {
  return `https://render.albiononline.com/v1/item/${encodeURIComponent(itemId)}.png?quality=${quality}&size=${size}`;
}
