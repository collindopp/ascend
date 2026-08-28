import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-shimmer rounded-[var(--radius-sm)] bg-surface-2", className)}
      aria-hidden
      {...props}
    />
  );
}

/**
 * Placeholder shaped like a populated table, so a page swaps skeleton→content
 * without the layout jumping. Column widths are staggered to suggest real
 * rows rather than a grid of identical bars.
 */
export function TableSkeleton({ rows = 8, columns = 6 }: { rows?: number; columns?: number }) {
  const widths = ["w-32", "w-20", "w-16", "w-24", "w-16", "w-20", "w-24", "w-16"];

  return (
    <div className="overflow-hidden rounded-[var(--radius-lg)] border border-border shadow-[var(--shadow-card)]">
      <div className="flex items-center gap-6 border-b border-border px-4 py-3">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} className={cn("h-3", widths[i % widths.length])} />
        ))}
      </div>
      <div className="divide-y divide-border-subtle">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="flex items-center gap-6 px-4 py-3.5">
            {Array.from({ length: columns }).map((_, c) => (
              <Skeleton key={c} className={cn("h-4", widths[(r + c) % widths.length])} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/** Header block every page opens with: title line plus its one-line description. */
export function PageHeaderSkeleton() {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-5 w-44" />
        <Skeleton className="h-3.5 w-64" />
      </div>
      <Skeleton className="h-9 w-72 rounded-[var(--radius-sm)]" />
    </div>
  );
}
