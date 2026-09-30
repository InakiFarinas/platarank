const SECTIONS = [
  ["sources", "Data sources"],
  ["filtering", "Price filtering"],
  ["return", "Resource return"],
  ["hideouts", "Hideouts"],
  ["fee", "Station fee"],
  ["taxes", "Market taxes"],
  ["qualities", "Gear and qualities"],
  ["journals", "Laborer journals"],
  ["focus", "Focus and specialization"],
  ["mounts", "Raised mounts"],
  ["silver", "Silver per day"],
  ["limitations", "Known limitations"],
] as const;

export default function En() {
  return (
    <>
      <nav aria-label="Sections on this page" className="flex flex-wrap gap-x-3 gap-y-1 text-xs">
        {SECTIONS.map(([id, label], i) => (
          <span key={id}>
            <a href={`#${id}`}>{label}</a>
            {i < SECTIONS.length - 1 && <span className="text-muted-foreground"> ·</span>}
          </span>
        ))}
      </nav>

      <p className="rounded-md border border-dashed border-border bg-card/40 px-3 py-2.5 text-sm">
        This methodology also says what we <strong>don&apos;t</strong> know -- see{" "}
        <a href="#limitations">Known limitations</a> before trusting a number blindly.
      </p>

      <h2 id="sources">Data sources</h2>
      <ul>
        <li>
          <strong>Prices:</strong> Albion Online Data Project (Americas server), updated every hour. Royal cities use the lowest sell price; the
          Black Market (weapons and armor only) uses the highest buy order.
        </li>
        <li>
          <strong>Volume:</strong> daily average over the last 30 days, from the project&apos;s daily dump.
        </li>
        <li>
          <strong>Recipes:</strong> extracted from the official game client files (ao-bin-dumps).
        </li>
      </ul>

      <h2 id="filtering">Price filtering</h2>
      <p>
        Community-reported prices can include fake listings. We discard a quote when it sits far above the rest: on ingestion, if a sell price of
        100,000 or more exceeds 20 times the median of the item&apos;s other quotes; on calculation, with 3 or more quotes, those below 0.4 or
        above 2.5 times the median are trimmed. Discarded quotes are shown in each row&apos;s detail.
      </p>

      <h2 id="return">Resource return</h2>
      <p>
        <code>Return = 1 − 1 / (1 + bonus)</code>. The bonus adds 18% base, +15% if the city has the crafting specialty for that category (+40% for refining)
        and +59% with focus. Artifacts never get a return, and neither does anything the game&apos;s own recipe marks as non-returnable: a
        mount&apos;s grown animal or Avalonian tokens.
      </p>

      <h2 id="hideouts">Hideouts</h2>
      <p>In the calculator and the rankings you can craft in a hideout instead of a city. A hideout has no 18% base:</p>
      <ul>
        <li>
          Crafting gets <strong>Power Level&apos;s general bonus</strong> (0% at level 1 up to 26% at level 9).
        </li>
        <li>
          When the item is one of the hideout&apos;s specialties, it also gets the <strong>zone quality&apos;s bonus</strong> (1% at Q1 up to 26%
          at Q6) and <strong>Power Level&apos;s specialist bonus</strong> (up to 30%).
        </li>
        <li>
          Each biome&apos;s specialties are the same five as its royal city&apos;s (swamp = Thetford, forest = Lymhurst, steppe = Bridgewatch,
          highland = Martlock, mountain = Fort Sterling). On the Roads of Avalon every road has its own, so you mark it yourself in the
          calculator; the rankings don&apos;t add them.
        </li>
        <li>Refining in a hideout has a flat bonus, 15% in the black zone and 10% on roads (+10% on the road&apos;s resource), which Power Level doesn&apos;t change.</li>
      </ul>
      <p>
        The values come from the game dump (hideouts.xml and craftingmodifiers.xml) and match the official wiki and patch notes; that cooking and
        alchemy get Power Level&apos;s general bonus is our assumption, since in the cities the same crafting bonus covers them, but we
        haven&apos;t verified it in game.
      </p>

      <h2 id="fee">Station fee</h2>
      <p>
        <code>Nutrition consumed = item value × 0.1125</code>. <code>Cost = (nutrition / 100) × station fee</code> (500 by default, editable).
        Item value is the sum of the value of the non-artifact materials according to the game data.
      </p>

      <h2 id="taxes">Market taxes</h2>
      <p>A 4% sales tax with premium (8% without premium) plus a 2.5% setup fee is deducted. These percentages were checked against the game.</p>

      <h2 id="qualities">Gear and qualities</h2>
      <p>
        The sell price weights the five qualities using the game&apos;s base weights, counting only those with real liquidity (volume and days
        with sales). We do not model the effect of focus, food or the destiny board on quality, because that formula is not public.
      </p>

      <h2 id="journals">Laborer journals</h2>
      <p>Crafting gear fills laborer journals, one per item family:</p>
      <ul>
        <li>
          <strong>Blacksmith&apos;s:</strong> plate, swords, axes, maces, hammers, crossbows and war gloves.
        </li>
        <li>
          <strong>Fletcher&apos;s:</strong> leather, bows, daggers, spears, quarterstaffs, nature and shapeshifter staffs.
        </li>
        <li>
          <strong>Imbuer&apos;s:</strong> cloth and fire, frost, arcane, holy and cursed staffs.
        </li>
        <li>
          <strong>Tinker&apos;s:</strong> tools, capes, bags and gathering gear.
        </li>
      </ul>
      <p>
        The journal must match the item&apos;s tier. By default we add that profit: you buy the empty journal in the cheapest city, fill it and
        sell it full at the reference price, taxed like the item. A craft&apos;s fame is{" "}
        <code>the recipe&apos;s refined resources × the tier&apos;s fame per resource</code> (22.5 at T4, 90 at T5, 270 at T6, 645 at T7, 1,395
        at T8; doubled per enchantment) <code>× the item&apos;s own factor for artifact gear</code> (1.1 to 1.4). Artifacts add no fame, the
        premium bonus doesn&apos;t fill journals, and focus and quality don&apos;t change fame. Which item fills which journal and how much fame
        each one holds come from the game data dump. Refining, alchemy and cooking fill no journal.
      </p>

      <h2 id="focus">Focus and specialization</h2>
      <p>
        <code>A craft&apos;s focus = base focus × 0.5 ^ (efficiency / 10,000)</code>: every 10,000 focus cost efficiency halves it. Efficiency
        comes from your Destiny Board: each mastery level adds 30 to its whole category, each level of an item&apos;s specialization adds 250 to
        that item, and the category&apos;s other specializations add 11.25 to 30 per level (depending on the node; crystal specs about 2 to the
        whole tree). In refining each tier is a node: 250 to its own tier and 30 to every tier of that resource. The per-level values and which
        items they apply to come from the game data dump (Destiny Board), and the result matches what the game charges. The game&apos;s base
        focus is per unit produced: a 5-potion craft costs 5 times one potion&apos;s focus. The game rounds the order&apos;s total, not each
        craft. Mounts have no node that lowers focus.
      </p>

      <h2 id="mounts">Raised mounts</h2>
      <p>For mounts you can choose to raise the base animal instead of buying it fully grown:</p>
      <ul>
        <li>
          <strong>Horse and ox (T3 to T8):</strong> the young animal has a fixed price at the Farm Merchant (25,000 at T3, tripling per tier up
          to 6,075,000 at T8).
        </li>
        <li>
          <strong>Giant stag, moose, direwolf, swiftclaw, bear, swamp dragon and mammoth:</strong> the young animal has no fixed price, so it is
          priced on the market like any other material.
        </li>
        <li>On top of that comes feed: the cheapest crop or meat of the day, for the number of units needed for it to grow (according to the game data).</li>
        <li>
          Horse and ox, once grown, give you a new baby back with a 78 to 87% chance depending on tier, so the baby only counts for the part
          that doesn&apos;t come back (at T4, 75,000 × 21% ≈ 16,000); the other families give no babies back.
        </li>
      </ul>
      <p>
        Raising takes 44 h (T3) to 284 h (T8), and silver per day doesn&apos;t discount that wait. Caring for the animal with focus raises the
        offspring chance, but we don&apos;t model it since we haven&apos;t verified it in-game. The Fire-Winged Draco and the Spring Rabbit are
        left out, since they have no cost we can calculate from real data.
      </p>

      <h2 id="silver">Silver per day</h2>
      <p>
        <code>Profit per unit × daily volume × assumed market share</code> (10% by default). It is an estimate, not a guarantee.
      </p>

      <h2 id="limitations">Known limitations</h2>
      <ul>
        <li>The calculator computes focus with your specialization, but the rankings don&apos;t sort by silver per focus point yet.</li>
        <li>The Black Market accepts qualities equal to or higher than the one requested and we do not model that: we only count the exact quality.</li>
        <li>We do not model quality rerolls.</li>
        <li>Full journals&apos; sales volume doesn&apos;t cap silver per day: we assume they sell at the item&apos;s pace.</li>
        <li>The data depends on players uploading it to the project; rarely traded items may have stale prices.</li>
      </ul>
    </>
  );
}
