import type { ComponentType } from "react";
import type { Location } from "@/lib/aodp/cities";
import { BlackMarketEmblem } from "@/components/icons/city-emblems";

export type CityTheme = {
  border: string;
  bg: string;
  text: string;
  /** Standalone banner image in /public (410x962 standard), for cities with a real banner. */
  banner?: string;
  /** Fallback glyph for a city with no banner frame (only Black Market today). */
  Icon?: ComponentType<{ className?: string }>;
};

/**
 * Per-city faction identity: deliberately breaks the One Coin Rule's single-accent restraint for
 * exactly this one control (the city selector, trigger + dropdown) -- see DESIGN.md's Faction
 * Banner Rule. Never applied to rows, buttons, or any other chrome. Six real cities show a slice
 * of the official Albion city banner (one image per city in /public); Brecilien
 * isn't in that sheet and renders no badge at all rather than a substitute glyph.
 */
export const CITY_THEMES: Record<Location, CityTheme> = {
  Bridgewatch: { border: "border-amber-600/80", bg: "bg-amber-950/60", text: "text-amber-400", banner: "/bridgewatch.png" },
  Martlock: { border: "border-blue-600/80", bg: "bg-blue-950/60", text: "text-blue-400", banner: "/martlock.png" },
  Thetford: { border: "border-purple-600/80", bg: "bg-purple-950/60", text: "text-purple-400", banner: "/thetford.png" },
  Caerleon: { border: "border-red-700/80", bg: "bg-red-950/60", text: "text-red-500", banner: "/caerleon.png" },
  "Fort Sterling": { border: "border-cyan-500/80", bg: "bg-cyan-950/60", text: "text-cyan-300", banner: "/fort_sterling.png" },
  Lymhurst: { border: "border-emerald-600/80", bg: "bg-emerald-950/60", text: "text-emerald-400", banner: "/lymhurst.png" },
  Brecilien: { border: "border-fuchsia-500/80", bg: "bg-fuchsia-950/60", text: "text-fuchsia-300" },
  "Black Market": { border: "border-yellow-700/80", bg: "bg-stone-900", text: "text-yellow-500", Icon: BlackMarketEmblem },
};
