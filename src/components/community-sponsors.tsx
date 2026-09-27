import { ArrowRight } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { MarqueeLogoScroller } from "@/components/ui/marquee-logo-scroller";
import { CTA_SECONDARY } from "@/lib/cta";
import { DISCORD_URL } from "@/lib/seo";
import { COMMUNITY_SPONSORS } from "@/lib/sponsors";

/** The communities that advertise on PlataRank, or the invitation to advertise while there are none.
 * Used by the home page and the calculator; the caller owns the surrounding section and width. */
export async function CommunitySponsors() {
  const t = await getTranslations("stations.sponsors");
  if (COMMUNITY_SPONSORS.length === 0) {
    return (
      <div>
        <h2 className="font-display text-2xl uppercase tracking-tight sm:text-3xl">{t("adTitle")}</h2>
        <p className="mt-3 text-sm text-muted-foreground sm:text-base">{t("adBody")}</p>
        <a
          href={DISCORD_URL}
          target="_blank"
          rel="noopener noreferrer"
          className={`${CTA_SECONDARY} mt-6 inline-flex min-h-11 items-center gap-2 px-5 text-sm`}
        >
          {t("adCta")}
          <ArrowRight className="h-4 w-4" />
        </a>
      </div>
    );
  }

  const logos = COMMUNITY_SPONSORS.map(({ descriptionKey, ...s }) => ({ ...s, description: t(descriptionKey) }));
  return (
    <>
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
        <h2 className="font-display text-2xl uppercase tracking-tight sm:text-3xl">{t("title")}</h2>
        <p className="text-xs text-muted-foreground">{t("label")}</p>
      </div>
      <MarqueeLogoScroller logos={logos} className="mt-8" />
      <p className="mt-6 text-sm text-muted-foreground">
        {t("wantIn")}{" "}
        <a href={DISCORD_URL} target="_blank" rel="noopener noreferrer" className="text-money underline underline-offset-2">
          {t("writeUs")}
        </a>
        .
      </p>
    </>
  );
}
