// Receives Content-Security-Policy-Report-Only violations (see next.config.ts). They only land in
// the runtime logs; nothing is stored. Drop this once the policy is promoted to enforced.
export async function POST(request: Request) {
  const raw = await request.text();
  if (raw.length <= 8_000) console.warn("[csp-report]", raw);
  return new Response(null, { status: 204 });
}
