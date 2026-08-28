import { Skeleton } from "@/components/ui/Skeleton";

/**
 * Setter screens are phone-first and card-shaped rather than tabular, so this
 * mirrors the lead-list picker instead of a table. See (manager)/loading.tsx
 * for why it's scoped to the route group.
 */
export default function SetterLoading() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-3.5 w-60" />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="flex flex-col gap-4 rounded-[var(--radius-lg)] border border-border bg-surface-1 p-5 shadow-[var(--shadow-card)]"
          >
            <div className="flex flex-col gap-2">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-3 w-28" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              {Array.from({ length: 3 }).map((_, j) => (
                <div key={j} className="flex flex-col gap-1.5">
                  <Skeleton className="h-2.5 w-14" />
                  <Skeleton className="h-4 w-12" />
                </div>
              ))}
            </div>
            <Skeleton className="h-10 w-full rounded-[var(--radius-md)]" />
          </div>
        ))}
      </div>
    </div>
  );
}
