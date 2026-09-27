import type { MetadataRoute } from "next";

// Static manifest: the install prompt starts at the default (Spanish) locale.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "PlataRank",
    short_name: "PlataRank",
    description: "Ranking de crafteo de Albion Online por plata realizable por día.",
    start_url: "/es",
    display: "standalone",
    background_color: "#17110d",
    theme_color: "#17110d",
    lang: "es",
    icons: [{ src: "/icon.png", sizes: "192x192", type: "image/png" }],
  };
}
