import type { MarqueeLogo } from "@/components/ui/marquee-logo-scroller";

/** Communities that advertise on PlataRank, shown in the home page's "Comunidades que nos apoyan"
 * section. Add one entry per community; `src` (a logo in `public/comunidades/`) is optional and the tile
 * shows the name until there is one. While the list is empty the section shows the invitation to advertise instead. */
export const COMMUNITY_SPONSORS: MarqueeLogo[] = [
  { name: "Avalon", href: "https://discord.gg/xHrRDbtgtn" },
  { name: "El panteón del rastreo", href: "https://discord.gg/jWmJHJvWut" },
];
