/** The app's one money-colored CTA look, in filled and outline flavors. Size (height, padding,
 * text size) stays per-call since it varies by context -- these constants only own color, weight
 * and the hover/disabled interaction, so a palette or interaction change only needs editing here.
 * Lives outside any "use client" module so server components (the home page) can use it too. */
export const CTA_PRIMARY =
  "rounded-sm border border-money bg-money font-medium tracking-wide text-money-foreground transition-opacity duration-150 hover:opacity-90 disabled:opacity-50";
export const CTA_SECONDARY =
  "rounded-sm border border-money/50 bg-money/10 font-medium tracking-wide text-money transition-colors duration-150 hover:bg-money/20 disabled:opacity-50";
