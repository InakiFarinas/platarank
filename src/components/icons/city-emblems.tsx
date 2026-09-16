// Faction-banner emblems: one flat, bold glyph per city, inspired by each city's name/geography
// (bridge arch, fort tower, forest leaf, mountain peak, bog rune, blood skull, fae spark, market
// coin) rather than literal fauna -- small badge sizes (~16-20px) need a bold silhouette, not a
// detailed illustration. Deliberately a second, distinct icon language from WaxSeal's thin
// two-stroke line work: these are solid `fill="currentColor"` shapes, sized for a colored badge.
// See DESIGN.md's Faction Banner Rule.

export function BridgewatchEmblem({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path fill="currentColor" d="M3 17h2v-4.5C5 9 8 6.5 12 6.5S19 9 19 12.5V17h2v2H3z" />
      <rect x="6" y="14" width="2" height="5" fill="currentColor" />
      <rect x="16" y="14" width="2" height="5" fill="currentColor" />
    </svg>
  );
}

export function FortSterlingEmblem({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path fill="currentColor" d="M5 10V6h2v2h2V6h2v2h2V6h2v2h2V6h2v4l-1 2v7H6v-7z" />
    </svg>
  );
}

export function LymhurstEmblem({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path fill="currentColor" d="M12 3c4.5 1.5 7 5 7 9a7 7 0 0 1-6 6.93V21h-2v-2.07A7 7 0 0 1 5 12c0-4 2.5-7.5 7-9Z" />
    </svg>
  );
}

export function MartlockEmblem({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path fill="currentColor" d="M12 4 20 19H4Zm0 4.5-3.7 6.9h2.1L12 11l1.6 4.4h2.1Z" />
    </svg>
  );
}

export function ThetfordEmblem({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path fill="currentColor" d="M12 3 17 12 12 21 7 12Z" />
    </svg>
  );
}

export function CaerleonEmblem({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        fill="currentColor"
        d="M12 3a5 5 0 0 1 5 5c0 2-1 3.2-1 4.2 0 .5.3.8.7 1.1l-1.4 1.4-1.3-1c-.6.5-1.3.8-2 .8s-1.4-.3-2-.8l-1.3 1-1.4-1.4c.4-.3.7-.6.7-1.1C7 11.2 6 10 6 8a5 5 0 0 1 6-5Zm-2 5.5a1 1 0 1 0 0 2 1 1 0 0 0 0-2Zm4 0a1 1 0 1 0 0 2 1 1 0 0 0 0-2Z"
      />
    </svg>
  );
}

export function BrecilienEmblem({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        fill="currentColor"
        d="M12 2c1 3 1 4.6 0 6-1-1.4-1-3-0-6Zm0 20c-1-3-1-4.6 0-6 1 1.4 1 3 0 6ZM2 12c3-1 4.6-1 6 0-1.4 1-3 1-6 0Zm20 0c-3 1-4.6 1-6 0 1.4-1 3-1 6 0ZM5 5c2.6 1.4 3.6 2.6 4 4-2 0-3.4-1.2-4-4Zm14 14c-2.6-1.4-3.6-2.6-4-4 2 0 3.4 1.2 4 4ZM5 19c.6-2.8 1.8-4 4-4-.4 1.4-1.4 2.6-4 4ZM19 5c-.6 2.8-1.8 4-4 4 .4-1.4 1.4-2.6 4-4Z"
      />
    </svg>
  );
}

export function BlackMarketEmblem({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path fill="currentColor" d="M4 8h16l-1.5 4H5.5Z" />
      <rect x="5" y="12" width="14" height="7" rx="0.5" fill="currentColor" />
      <rect x="10" y="14" width="4" height="3" fill="var(--color-card)" />
    </svg>
  );
}
