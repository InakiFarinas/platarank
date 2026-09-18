// Black Market's emblem: still a flat, bold glyph (see DESIGN.md's Faction Banner Rule) since it
// has no real-world city banner in public/banners.png. The other six real cities render a slice
// of that banner sheet instead (via SpriteIcon); Brecilien renders no badge at all -- it isn't in
// the banner sheet either, and the user asked for no substitute logo there.

export function BlackMarketEmblem({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path fill="currentColor" d="M4 8h16l-1.5 4H5.5Z" />
      <rect x="5" y="12" width="14" height="7" rx="0.5" fill="currentColor" />
      <rect x="10" y="14" width="4" height="3" fill="var(--color-card)" />
    </svg>
  );
}
