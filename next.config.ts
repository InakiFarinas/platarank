import type { NextConfig } from "next";

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

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // Single-locale site: send any path without the /es prefix to it (replaces the old middleware).
  async redirects() {
    return [
      { source: "/", destination: "/es", permanent: true },
      { source: "/:path((?!es(?:/|$)|_next|api|auth|opengraph-image|favicon\\.ico|.*\\..*).+)", destination: "/es/:path", permanent: true },
    ];
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
