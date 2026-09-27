export default function En() {
  return (
    <>
      <h2>Data sources</h2>
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

      <h2>Price filtering</h2>
      <p>
        Community-reported prices can include fake listings. We discard a quote when it sits far above the rest: on ingestion, if a sell price of
        100,000 or more exceeds 20 times the median of the item&apos;s other quotes; on calculation, with 3 or more quotes, those below 0.4 or
        above 2.5 times the median are trimmed. Discarded quotes are shown in each row&apos;s detail.
      </p>

      <h2>Resource return</h2>
      <p>
        Return = 1 − 1 / (1 + bonus). The bonus adds 18% base, +15% if the city has the crafting specialty for that category (+40% for refining)
        and +59% with focus. Artifacts never get a return.
      </p>

      <h2>Station fee</h2>
      <p>
        Nutrition consumed = item value × 0.1125. Cost = (nutrition / 100) × station fee (500 by default, editable). Item value is the sum of the
        value of the non-artifact materials according to the game data.
      </p>

      <h2>Market taxes</h2>
      <p>A 4% sales tax with premium (8% without premium) plus a 2.5% setup fee is deducted. These percentages were checked against the game.</p>

      <h2>Gear and qualities</h2>
      <p>
        The sell price weights the five qualities using the game&apos;s base weights, counting only those with real liquidity (volume and days
        with sales). We do not model the effect of focus, food or the destiny board on quality, because that formula is not public.
      </p>

      <h2>Raised mounts</h2>
      <p>
        For mounts you can choose to raise the base animal instead of buying it fully grown. For horse and ox (T3 to T8) the young animal has a
        fixed price at the Farm Merchant (25,000 at T3, tripling per tier up to 6,075,000 at T8). For giant stag, moose, direwolf, swiftclaw, bear,
        swamp dragon and mammoth the young animal has no fixed price, so it is priced on the market like any other material. On top of that comes
        feed: the cheapest crop or meat of the day, for the number of units needed for it to grow (according to the game data). The Fire-Winged
        Draco and the Spring Rabbit are left out, since they have no cost we can calculate from real data.
      </p>

      <h2>Silver per day</h2>
      <p>Profit per unit × daily volume × assumed market share (10% by default). It is an estimate, not a guarantee.</p>

      <h2>Known limitations</h2>
      <ul>
        <li>The calculator does not yet model journals or masteries (the focus required is shown without mastery reduction).</li>
        <li>The Black Market accepts qualities equal to or higher than the one requested and we do not model that: we only count the exact quality.</li>
        <li>We do not model quality rerolls or journals.</li>
        <li>The data depends on players uploading it to the project; rarely traded items may have stale prices.</li>
      </ul>
    </>
  );
}
