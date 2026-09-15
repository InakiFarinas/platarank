import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export function QualityBadge({
  score,
  citiesQuoted,
  brecilienCovered,
}: {
  score: number;
  citiesQuoted: number;
  brecilienCovered: boolean;
}) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={<span />}
        className="flex items-center gap-1.5"
        aria-label={`Calidad de dato: ${score} de 100`}
      >
        <div className="h-1.5 w-10 overflow-hidden rounded-full bg-muted">
          <div
            className={cn("h-full rounded-full", score >= 60 ? "bg-money" : "bg-muted-foreground/60")}
            style={{ width: `${Math.max(4, score)}%` }}
          />
        </div>
        <span className="font-mono text-[11px] tabular-nums text-muted-foreground">{score}</span>
      </TooltipTrigger>
      <TooltipContent className="max-w-56 text-xs">
        <p className="font-medium">Calidad del dato: {score}/100</p>
        <p className="mt-1 text-muted-foreground">
          {citiesQuoted} de 8 mercados cotizando.{" "}
          {brecilienCovered ? "Brecilien cubre este ítem." : "Brecilien no tiene cotización para este ítem."}
        </p>
      </TooltipContent>
    </Tooltip>
  );
}
