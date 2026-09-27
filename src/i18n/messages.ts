import type { Locale } from "./config";

/** One JSON file per namespace under src/messages/<locale>/. Both locales must have the same keys. */
export const NAMESPACES = ["common", "home", "stations", "rankingUi", "calculator", "artifacts", "legal"] as const;

export async function loadMessages(locale: Locale): Promise<Record<string, unknown>> {
  const entries = await Promise.all(
    NAMESPACES.map(async (ns) => [ns, (await import(`../messages/${locale}/${ns}.json`)).default] as const),
  );
  return Object.fromEntries(entries);
}
