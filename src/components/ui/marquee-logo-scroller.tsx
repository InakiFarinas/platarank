import { cn } from "@/lib/utils";

export type MarqueeLogo = {
  name: string;
  /** Where the logo links to: the community's own site or invite. */
  href: string;
  /** Path under /public. */
  src: string;
  width?: number;
  height?: number;
};

type Speed = "slow" | "normal" | "fast";

// Below this many logos the loop would repeat the same few tiles on a wide screen, so they sit
// still in a centered row instead.
const MIN_TO_SCROLL = 5;

function LogoTile({ logo, copy = false }: { logo: MarqueeLogo; copy?: boolean }) {
  return (
    <a
      href={logo.href}
      target="_blank"
      // `sponsored` marks the link as paid placement for search engines.
      rel="noopener noreferrer sponsored"
      aria-label={copy ? undefined : logo.name}
      tabIndex={copy ? -1 : undefined}
      className="flex h-20 w-40 shrink-0 items-center justify-center rounded-sm border border-border bg-card px-4 transition-colors hover:border-money/50 hover:bg-money/5"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={logo.src}
        alt=""
        width={logo.width ?? 160}
        height={logo.height ?? 64}
        loading="lazy"
        className="max-h-12 w-auto max-w-full object-contain"
      />
    </a>
  );
}

/**
 * Logos of the communities that advertise here. Scrolls when there are enough of them, pauses on
 * hover and keyboard focus, and under `prefers-reduced-motion` becomes a plain scrollable row.
 * The loop's keyframes live in globals.css (`.marquee-track`).
 */
export function MarqueeLogoScroller({ logos, speed = "normal", className }: { logos: MarqueeLogo[]; speed?: Speed; className?: string }) {
  if (logos.length === 0) return null;

  if (logos.length < MIN_TO_SCROLL) {
    return (
      <ul className={cn("flex flex-wrap items-center justify-center gap-4", className)}>
        {logos.map((logo) => (
          <li key={logo.href}>
            <LogoTile logo={logo} />
          </li>
        ))}
      </ul>
    );
  }

  const duration = { slow: "80s", normal: "40s", fast: "20s" }[speed];
  return (
    <div className={cn("marquee overflow-x-auto motion-safe:overflow-hidden", className)}>
      <ul className="marquee-track flex w-max items-center gap-4 pr-4" style={{ ["--marquee-duration" as string]: duration }}>
        {logos.map((logo) => (
          <li key={logo.href}>
            <LogoTile logo={logo} />
          </li>
        ))}
        {/* Second copy makes the loop seamless; hidden from assistive tech and from reduced-motion users. */}
        {logos.map((logo) => (
          <li key={`${logo.href}-copy`} aria-hidden="true" className="marquee-copy">
            <LogoTile logo={logo} copy />
          </li>
        ))}
      </ul>
    </div>
  );
}
