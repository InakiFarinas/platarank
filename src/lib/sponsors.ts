import type { MarqueeLogo } from "@/components/ui/marquee-logo-scroller";

/** Communities that advertise on PlataRank, shown in the home page's "Comunidades que nos apoyan"
 * section. Add one entry per community; `src` is an optional square icon in `public/comunidades/`. While the list is empty the section shows the invitation to advertise instead. */
export const COMMUNITY_SPONSORS: MarqueeLogo[] = [
  { name: "Avalon", href: "https://discord.gg/xHrRDbtgtn", src: "/comunidades/avalon.png" },
  { name: "El panteón del rastreo", href: "https://discord.gg/jWmJHJvWut", src: "/comunidades/panteon-del-rastreo.png" },
];
