import { describe, expect, test } from "vitest";

// The module reaches the DB client through the shared cache; these tests never query it, but the
// client refuses to load without a URL.
process.env.DATABASE_URL ??= "postgres://test@127.0.0.1:1/test";
const { sitemapFile, sitemapIndex, SITEMAP_FILES } = await import("@/lib/server/sitemap");

describe("sitemap", () => {
  test("el índice apunta a un archivo por rubro más las páginas fijas", () => {
    const xml = sitemapIndex();
    for (const f of SITEMAP_FILES) expect(xml).toContain(`/sitemaps/${f}.xml</loc>`);
  });

  test("las páginas fijas salen en los 3 idiomas, con alternates y fechas reales", async () => {
    const xml = (await sitemapFile("pages"))!;
    expect(xml.match(/<loc>/g)).toHaveLength(13 * 3);
    expect(xml).toContain("/pt/metodologia</loc>");
    expect(xml).toContain('hreflang="x-default"');
    expect(xml).toContain("<lastmod>2026-09-19</lastmod>");
  });

  test("un archivo desconocido no existe", async () => {
    expect(await sitemapFile("nope")).toBeNull();
  });
});
