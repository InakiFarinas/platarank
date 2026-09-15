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

export function formatAge(seconds: number | null): string {
  if (seconds === null) return "sin dato";
  const hours = seconds / 3600;
  if (hours < 1) return `hace ${Math.max(1, Math.round(seconds / 60))} min`;
  if (hours < 48) return `hace ${Math.round(hours)}h`;
  return `hace ${Math.round(hours / 24)}d`;
}

export function enchantLabel(enchant: number): string {
  return enchant === 0 ? "" : `.${enchant}`;
}

const QUALITY_NAMES = ["Normal", "Bueno", "Excepcional", "Excelente", "Obra maestra"];

export function qualityLabel(quality: number): string {
  return `Q${quality} ${QUALITY_NAMES[quality - 1] ?? ""}`.trim();
}
