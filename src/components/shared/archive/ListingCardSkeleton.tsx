import { Skeleton } from "@/components/ui/skeleton";

// Placeholder shaped like ListingCard, shown while an archive page's
// client-side data fetch is in flight.
export function ListingCardSkeleton() {
  return (
    <div className="bg-card border border-outline-variant p-3 sm:p-4 rounded-sm shadow-sm flex gap-3 sm:gap-4">
      <Skeleton className="w-16 h-16 sm:w-24 sm:h-24 md:w-32 md:h-32 shrink-0 rounded" />
      <div className="flex-grow min-w-0 space-y-3">
        <div className="space-y-2">
          <Skeleton className="h-5 w-2/5" />
          <Skeleton className="h-3 w-1/5" />
        </div>
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-4/5" />
        <div className="flex gap-2 pt-1">
          <Skeleton className="h-8 w-8 rounded-md" />
          <Skeleton className="h-8 w-8 rounded-md" />
        </div>
      </div>
    </div>
  );
}
