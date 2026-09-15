import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <main className="mx-auto max-w-5xl px-3 py-4 sm:px-6 sm:py-8">
      <div className="mb-4 sm:mb-6">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="mt-2 h-4 w-80 max-w-full" />
      </div>
      <div className="overflow-hidden rounded-md border border-border">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 border-b border-border px-3 py-3 last:border-b-0">
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-20" />
          </div>
        ))}
      </div>
    </main>
  );
}
