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
  // No 'unsafe-eval' and no inline event-handler attributes (falls back to script-src, which has
  // neither) -- eval() and onclick="" stay blocked. script-src-elem is split out and does need
  // 'unsafe-inline': Next's App Router streams hydration data through inline `<script>` tags
  // (`self.__next_f.push(...)`), and this site's JSON-LD (src/components/json-ld.tsx) is inline
  // too, per-page and per-recipe content that a fixed hash list can't cover (thousands of recipe
  // pages). A nonce would fix that, but Next's nonce pattern requires opting every route into
  // per-request dynamic rendering, which would drop this app's `revalidate`/ISR caching and defeat
  // the whole egress-conscious architecture (see PRODUCT.md) for a report-only header. Not worth it.
  "script-src 'self'",
  "script-src-elem 'self' 'unsafe-inline'",
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

// Every non-Spanish locale whose slug differs from the Spanish folder name: [locale, es, slug].
const TRANSLATED_SLUGS = (["en", "pt"] as const).flatMap((l) =>
  (Object.values(ROUTES) as { es: string; en: string; pt: string }[])
    .filter((r) => r.es !== "receta" && r[l] !== r.es)
    .map((r) => [l, r.es, r[l]] as const),
);

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // The OG image route reads public/logo-og.png at runtime (it is dynamic per locale), so Vercel must bundle it.
  outputFileTracingIncludes: { "/[locale]/opengraph-image/[__metadata_id__]": ["./public/logo-og.png"] },
  // Locales: es (default), en and pt. Route folders under app/[locale] keep the Spanish names; the
  // English and Portuguese slugs are rewrites onto them (the Spanish slug under /en or /pt redirects
  // to that locale's own slug).
  // Paths without a locale prefix go to /es; "/" itself picks by Accept-Language (app/route.ts).
  async redirects() {
    return [
      { source: "/opengraph-image", destination: "/es/opengraph-image/og", permanent: true },
      // iOS asks for these fixed names when a page is added to the home screen; the icon lives at
      // /apple-icon.png (app/apple-icon.png).
      { source: "/apple-touch-icon.png", destination: "/apple-icon.png", permanent: true },
      { source: "/apple-touch-icon-precomposed.png", destination: "/apple-icon.png", permanent: true },
      // Crafting sessions were folded into saved plans (2026-09-27): old links land on the plans tab.
      { source: "/es/sesiones", destination: "/es/calculadora?tab=planes", permanent: false },
      { source: "/en/sessions", destination: "/en/calculator?tab=planes", permanent: false },
      { source: "/:path((?!es(?:/|$)|en(?:/|$)|pt(?:/|$)|_next|api|auth|opengraph-image|favicon\\.ico|.*\\..*).+)", destination: "/es/:path", permanent: true },
      ...TRANSLATED_SLUGS.map(([l, es, slug]) => ({ source: `/${l}/${es}`, destination: `/${l}/${slug}`, permanent: true })),
      { source: "/en/receta/:itemId", destination: "/en/recipe/:itemId", permanent: true },
      { source: "/pt/receta/:itemId", destination: "/pt/receita/:itemId", permanent: true },
    ];
  },
  async rewrites() {
    return [
      ...TRANSLATED_SLUGS.map(([l, es, slug]) => ({ source: `/${l}/${slug}`, destination: `/${l}/${es}` })),
      { source: "/en/recipe/:itemId", destination: "/en/receta/:itemId" },
      { source: "/pt/receita/:itemId", destination: "/pt/receta/:itemId" },
    ];
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default withNextIntl(nextConfig);
