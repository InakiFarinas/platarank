import type { ComponentType } from "react";
import type { Location } from "@/lib/aodp/cities";
import {
  BridgewatchEmblem,
  FortSterlingEmblem,
  LymhurstEmblem,
  MartlockEmblem,
  ThetfordEmblem,
  CaerleonEmblem,
  BrecilienEmblem,
  BlackMarketEmblem,
} from "@/components/icons/city-emblems";

export type CityTheme = {
  border: string;
  bg: string;
  text: string;
  Icon: ComponentType<{ className?: string }>;
};

/**
 * Per-city faction identity: deliberately breaks the One Coin Rule's single-accent restraint for
 * exactly this one control (the city selector, trigger + dropdown) -- see DESIGN.md's Faction
 * Banner Rule. Never applied to rows, buttons, or any other chrome.
 */
export const CITY_THEMES: Record<Location, CityTheme> = {
  Bridgewatch: { border: "border-amber-600/80", bg: "bg-amber-950/60", text: "text-amber-400", Icon: BridgewatchEmblem },
  "Fort Sterling": { border: "border-cyan-500/80", bg: "bg-cyan-950/60", text: "text-cyan-300", Icon: FortSterlingEmblem },
  Lymhurst: { border: "border-emerald-600/80", bg: "bg-emerald-950/60", text: "text-emerald-400", Icon: LymhurstEmblem },
  Martlock: { border: "border-blue-600/80", bg: "bg-blue-950/60", text: "text-blue-400", Icon: MartlockEmblem },
  Thetford: { border: "border-purple-600/80", bg: "bg-purple-950/60", text: "text-purple-400", Icon: ThetfordEmblem },
  Caerleon: { border: "border-red-700/80", bg: "bg-red-950/60", text: "text-red-500", Icon: CaerleonEmblem },
  Brecilien: { border: "border-fuchsia-500/80", bg: "bg-fuchsia-950/60", text: "text-fuchsia-300", Icon: BrecilienEmblem },
  "Black Market": { border: "border-yellow-700/80", bg: "bg-stone-900", text: "text-yellow-500", Icon: BlackMarketEmblem },
};
