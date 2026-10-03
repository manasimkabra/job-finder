import { ResultsSkeleton } from "@/components/results-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

export default function HomeLoading() {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
      <Skeleton className="h-10 w-2/3 max-w-md" />
      <Skeleton className="mt-3 h-5 w-full max-w-xl" />
      <Skeleton className="mt-8 h-28 w-full rounded-xl" />
      <ResultsSkeleton />
    </div>
  );
}
