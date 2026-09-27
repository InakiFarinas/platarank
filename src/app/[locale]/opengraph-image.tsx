import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";
import { isLocale } from "@/i18n/config";

const COPY = {
  es: {
    alt: "PlataRank: maximizá tu plata en Albion Online",
    before: "Descubrí qué crafteos te dan más ",
    accent: "plata por día ",
    after: "en Albion Online",
    sub: "Ranking, calculadora y alertas por Discord",
  },
  en: {
    alt: "PlataRank: maximize your silver in Albion Online",
    before: "Find out which crafts earn you the most ",
    accent: "silver per day ",
    after: "in Albion Online",
    sub: "Ranking, calculator and Discord alerts",
  },
} as const;

export const alt = COPY.es.alt;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Cinzel Bold for the wordmark, fetched as TTF (Satori can't read woff2). Falls back to the
 * default font if Google Fonts is unreachable, so the image never fails to render. */
async function loadCinzel(): Promise<ArrayBuffer | null> {
  try {
    const css = await (await fetch("https://fonts.googleapis.com/css2?family=Cinzel:wght@700")).text();
    const url = css.match(/src: url\((.+?)\) format\('(?:opentype|truetype)'\)/)?.[1];
    if (!url) return null;
    return await (await fetch(url)).arrayBuffer();
  } catch {
    return null;
  }
}

export async function generateImageMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return [{ id: "og", alt: COPY[isLocale(locale) ? locale : "es"].alt, size, contentType }];
}

export default async function OpengraphImage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const c = COPY[isLocale(locale) ? locale : "es"];
  const [logo, cinzel] = await Promise.all([readFile(path.join(process.cwd(), "public", "logo-og.png")), loadCinzel()]);
  const logoSrc = `data:image/png;base64,${logo.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          gap: 56,
          padding: "0 80px",
          background: "#17110d",
          border: "4px solid rgba(235,162,58,0.45)",
          color: "#ece3d3",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logoSrc} width={300} height={300} alt="" />
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontFamily: cinzel ? "Cinzel" : "serif", fontSize: 96, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", lineHeight: 1 }}>
            PlataRank
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", marginTop: 28, fontSize: 40, lineHeight: 1.25, color: "#c9b99f", maxWidth: 640 }}>
            <span>{c.before}</span>
            <span style={{ color: "#eba23a" }}>{c.accent}</span>
            <span>{c.after}</span>
          </div>
          <div style={{ marginTop: 32, fontSize: 28, color: "#9c8b72" }}>{c.sub}</div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: cinzel ? [{ name: "Cinzel", data: cinzel, weight: 700, style: "normal" }] : undefined,
    },
  );
}
