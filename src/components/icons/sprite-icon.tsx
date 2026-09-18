/** One frame of an equal-width horizontal sprite sheet, sliced via background-position instead
 * of pre-cropping the source image into separate files. */
export function SpriteIcon({
  src,
  index,
  count,
  className,
}: {
  src: string;
  index: number;
  count: number;
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={`block shrink-0 ${className ?? ""}`}
      style={{
        backgroundImage: `url(${src})`,
        backgroundSize: `${count * 100}% 100%`,
        backgroundPosition: `${(index / (count - 1)) * 100}% 0%`,
        backgroundRepeat: "no-repeat",
      }}
    />
  );
}
