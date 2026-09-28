import type { Locale } from "@/i18n/config";

export function formatSilver(value: number | null): string {
  if (value === null) return "--";
  const sign = value < 0 ? "-" : "";
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `${sign}${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${sign}${(abs / 1_000).toFixed(1)}k`;
  return `${sign}${Math.round(abs)}`;
}

export function formatPercent(value: number | null): string {
  if (value === null) return "--";
  return `${value >= 0 ? "+" : ""}${Math.round(value * 100)}%`;
}

const AGE_WORDS: Record<Locale, { none: string; ago: (n: string) => string }> = {
  es: { none: "sin dato", ago: (n) => `hace ${n}` },
  en: { none: "no data", ago: (n) => `${n} ago` },
  pt: { none: "sem dado", ago: (n) => `há ${n}` },
};

export function formatAge(seconds: number | null, locale: Locale = "es"): string {
  const w = AGE_WORDS[locale];
  if (seconds === null) return w.none;
  const hours = seconds / 3600;
  if (hours < 1) return w.ago(`${Math.max(1, Math.round(seconds / 60))} min`);
  if (hours < 48) return w.ago(`${Math.round(hours)}h`);
  return w.ago(`${Math.round(hours / 24)}d`);
}

export function enchantLabel(enchant: number): string {
  return enchant === 0 ? "" : `.${enchant}`;
}

const QUALITY_NAMES: Record<Locale, string[]> = {
  es: ["Normal", "Bueno", "Excepcional", "Excelente", "Obra maestra"],
  en: ["Normal", "Good", "Outstanding", "Excellent", "Masterpiece"],
  pt: ["Normal", "Bom", "Excepcional", "Excelente", "Obra-prima"],
};

export function qualityLabel(quality: number, locale: Locale = "es"): string {
  return `Q${quality} ${QUALITY_NAMES[locale][quality - 1] ?? ""}`.trim();
}
