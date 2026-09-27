import type { Locale } from "@/i18n/config";

/** Display name of a game item/material in the given locale. Falls back to Spanish when the English
 * name is missing (older generated data). */
export function itemName(item: { nameEs: string; nameEn?: string | null }, locale: Locale): string {
  return locale === "en" ? item.nameEn || item.nameEs : item.nameEs;
}
