import { Skeleton } from "@/components/ui/Skeleton";

/**
 * Root fallback for segments outside the three route groups (each of which
 * has its own loading.tsx that keeps the nav shell mounted). Kept minimal
 * because the routes it covers — the role redirect and login — resolve fast.
 */
export default function Loading() {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-8 md:px-6">
      <Skeleton className="h-6 w-40" />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
      <Skeleton className="h-64 w-full" />
    </div>
  );
}
