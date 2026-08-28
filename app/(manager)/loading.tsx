import { Skeleton, TableSkeleton, PageHeaderSkeleton } from "@/components/ui/Skeleton";

/**
 * Scoped to the route group rather than the app root so the nav shell stays
 * mounted while a page's data resolves — navigating between manager screens
 * swaps only the content area instead of blanking the whole window.
 */
export default function ManagerLoading() {
  return (
    <div className="flex flex-col gap-8">
      <PageHeaderSkeleton />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-2.5">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-9 w-20" />
          </div>
        ))}
      </div>

      <TableSkeleton rows={8} columns={6} />
    </div>
  );
}
