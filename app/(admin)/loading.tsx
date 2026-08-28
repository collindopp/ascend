import { TableSkeleton, PageHeaderSkeleton } from "@/components/ui/Skeleton";

/** See (manager)/loading.tsx — scoped here so the nav shell survives navigation. */
export default function AdminLoading() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeaderSkeleton />
      <TableSkeleton rows={9} columns={5} />
    </div>
  );
}
