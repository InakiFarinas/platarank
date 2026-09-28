import type { Locale } from "@/i18n/config";

/** Display name of a game item/material in the given locale, straight from the game's own
 * localization (ao-bin-dumps). Portuguese falls back to English, then Spanish, when missing (rows
 * synced before it existed); English falls back to Spanish. */
export function itemName(item: { nameEs: string; nameEn?: string | null; namePt?: string | null }, locale: Locale): string {
  if (locale === "pt") return item.namePt || item.nameEn || item.nameEs;
  if (locale === "en") return item.nameEn || item.nameEs;
  return item.nameEs;
}
