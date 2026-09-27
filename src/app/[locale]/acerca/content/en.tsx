import Link from "next/link";
import { localePath } from "@/i18n/config";
import { DISCORD_URL } from "@/lib/seo";

export default function En() {
  return (
    <>
      <p>
        PlataRank is a free tool by the Spanish-speaking Albion Online community. It ranks crafting recipes by the silver they earn per day
        (profit per unit × sales volume), so you can decide what to craft based on data instead of gut feeling.
      </p>
      <h2>Where the data comes from</h2>
      <ul>
        <li>Prices and volumes: Albion Online Data Project, fed by players, Americas server. Updated every hour.</li>
        <li>Recipes and item values: official dump of the game client.</li>
        <li>
          All formulas are explained in the <Link href={localePath("en", "methodology")}>methodology</Link>, including their limitations.
        </li>
      </ul>
      <h2>Contact</h2>
      <p>
        The fastest way to report a bug or suggest an improvement is the{" "}
        <a href={DISCORD_URL} target="_blank" rel="noopener noreferrer">
          community Discord
        </a>
        .
      </p>
      <h2>No affiliation</h2>
      <p>PlataRank is not affiliated with Sandbox Interactive or Albion Online. It is an unofficial tool provided for informational purposes.</p>
    </>
  );
}
