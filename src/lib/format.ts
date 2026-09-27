import type { Locale } from "@/i18n/config";

/** Whole number with locale thousands separators (es-AR / en-US; the app's one integer format). */
export const formatInt = (n: number, locale: Locale = "es") =>
  Math.round(n).toLocaleString(locale === "en" ? "en-US" : "es-AR");
