import { Skeleton } from "@/components/ui/skeleton";

export function ResultsSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="mt-8 space-y-3" aria-hidden="true">
      <Skeleton className="h-5 w-40" />
      {Array.from({ length: rows }, (_, index) => (
        <Skeleton key={index} className="h-36 w-full rounded-xl" />
      ))}
    </div>
  );
}
