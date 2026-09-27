import { ArrowRight } from "lucide-react";
import { MarqueeLogoScroller } from "@/components/ui/marquee-logo-scroller";
import { CTA_SECONDARY } from "@/lib/cta";
import { DISCORD_URL } from "@/lib/seo";
import { COMMUNITY_SPONSORS } from "@/lib/sponsors";

/** The communities that advertise on PlataRank, or the invitation to advertise while there are none.
 * Used by the home page and the calculator; the caller owns the surrounding section and width. */
export function CommunitySponsors() {
  if (COMMUNITY_SPONSORS.length === 0) {
    return (
      <div>
        <h2 className="font-display text-2xl uppercase tracking-tight sm:text-3xl">Publicitá tu comunidad</h2>
        <p className="mt-3 text-sm text-muted-foreground sm:text-base">
          Si tenés un gremio, un servidor de Discord o un canal de Albion Online, tu logo puede aparecer en esta página junto con un enlace a tu
          comunidad. Escribinos por Discord y lo coordinamos.
        </p>
        <a
          href={DISCORD_URL}
          target="_blank"
          rel="noopener noreferrer"
          className={`${CTA_SECONDARY} mt-6 inline-flex min-h-11 items-center gap-2 px-5 text-sm`}
        >
          Hablar por Discord
          <ArrowRight className="h-4 w-4" />
        </a>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
        <h2 className="font-display text-2xl uppercase tracking-tight sm:text-3xl">Comunidades que nos apoyan</h2>
        <p className="text-xs text-muted-foreground">Publicidad de comunidades de Albion Online</p>
      </div>
      <MarqueeLogoScroller logos={COMMUNITY_SPONSORS} className="mt-8" />
      <p className="mt-6 text-sm text-muted-foreground">
        ¿Tu comunidad quiere estar acá?{" "}
        <a href={DISCORD_URL} target="_blank" rel="noopener noreferrer" className="text-money underline underline-offset-2">
          Escribinos por Discord
        </a>
        .
      </p>
    </>
  );
}
