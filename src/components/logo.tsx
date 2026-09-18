import Image from "next/image";

const SIZES = {
  sm: 28,
  md: 36,
  lg: 96,
} as const;

/** The site's actual crest artwork (public/logo.png) -- replaces the placeholder WaxSeal mark
 * everywhere it stood in for a "real" logo. Decorative by default (`alt=""`): every call site
 * pairs it with a visible "PlataRank" text label, so the image doesn't need to announce the name
 * itself -- pass `decorative={false}` for a standalone usage with no adjacent text. */
export function Logo({
  size = "md",
  decorative = true,
  className,
}: {
  size?: keyof typeof SIZES | number;
  decorative?: boolean;
  className?: string;
}) {
  const px = typeof size === "number" ? size : SIZES[size];
  return (
    <Image
      src="/logo.png"
      alt={decorative ? "" : "PlataRank"}
      width={px}
      height={px}
      className={className}
    />
  );
}
