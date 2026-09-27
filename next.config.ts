import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import { ROUTES } from "./src/i18n/config";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

// Enforced CSP is deliberately limited to the directives that cannot break the app (framing,
// <base>, plugins, form targets). A full script-src needs nonces for Next's inline scripts, so that
// part ships Report-Only first: it only logs violations in supporting browsers' devtools, it never
// blocks anything, so it's safe to add without a rollout. Promote it to enforced (drop
// "-Report-Only") once it's been observed clean for a while.
const supabaseOrigin = (() => {
  try {
    return process.env.NEXT_PUBLIC_SUPABASE_URL ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).origin : "";
  } catch {
    return "";
  }
})();

const reportOnlyCsp = [
  "default-src 'self'",
  "script-src 'self'",
  // style-src-attr needs 'unsafe-inline': the app sets style={{...}} in a few components.
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https:",
  "font-src 'self' data:",
  `connect-src 'self'${supabaseOrigin ? ` ${supabaseOrigin}` : ""}`,
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "object-src 'none'",
  "form-action 'self'",
  "report-uri /api/csp-report",
].join("; ");

const securityHeaders = [
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()" },
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'; base-uri 'self'; object-src 'none'; form-action 'self'" },
  { key: "Content-Security-Policy-Report-Only", value: reportOnlyCsp },
];

const ENGLISH_SLUGS = (Object.values(ROUTES) as { es: string; en: string }[]).filter((r) => r.es !== "receta").map((r) => [r.es, r.en] as const);

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // The OG image route reads public/logo-og.png at runtime (it is dynamic per locale), so Vercel must bundle it.
  outputFileTracingIncludes: { "/[locale]/opengraph-image/[__metadata_id__]": ["./public/logo-og.png"] },
  // Locales: es (default) and en. Route folders under app/[locale] keep the Spanish names; the
  // English slugs are rewrites onto them (the Spanish slug under /en redirects to the English one).
  // Paths without a locale prefix go to /es; "/" itself picks by Accept-Language (app/route.ts).
  async redirects() {
    return [
      { source: "/opengraph-image", destination: "/es/opengraph-image/og", permanent: true },
      { source: "/:path((?!es(?:/|$)|en(?:/|$)|_next|api|auth|opengraph-image|favicon\\.ico|.*\\..*).+)", destination: "/es/:path", permanent: true },
      ...ENGLISH_SLUGS.map(([es, en]) => ({ source: `/en/${es}`, destination: `/en/${en}`, permanent: true })),
      { source: "/en/receta/:itemId", destination: "/en/recipe/:itemId", permanent: true },
    ];
  },
  async rewrites() {
    return [
      ...ENGLISH_SLUGS.map(([es, en]) => ({ source: `/en/${en}`, destination: `/en/${es}` })),
      { source: "/en/recipe/:itemId", destination: "/en/receta/:itemId" },
    ];
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default withNextIntl(nextConfig);
