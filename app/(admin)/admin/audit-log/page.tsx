import Link from "next/link";
import { getAuditLogPage } from "@/lib/admin/queries";
import { Table, TableHead, TableHeadCell, TableBody, TableRow, TableCell } from "@/components/ui/Table";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { LocalDateTime } from "@/components/ui/LocalDateTime";

const PAGE_SIZE = 30;

export default async function AuditLogPage({ searchParams }: PageProps<"/admin/audit-log">) {
  const params = await searchParams;
  const page = Math.max(1, Number(Array.isArray(params.page) ? params.page[0] : params.page) || 1);
  const { rows, total, pageCount } = await getAuditLogPage(page, PAGE_SIZE);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-lg font-semibold text-text-primary">Audit Log</h1>
        <p className="mt-1 text-sm text-text-tertiary">{total} events.</p>
      </div>

      {rows.length === 0 ? (
        <EmptyState title="No audit events yet" />
      ) : (
        <>
          <Table>
            <TableHead>
              <tr>
                <TableHeadCell>Time</TableHeadCell>
                <TableHeadCell>Actor</TableHeadCell>
                <TableHeadCell>Action</TableHeadCell>
                <TableHeadCell>Entity</TableHeadCell>
              </tr>
            </TableHead>
            <TableBody>
              {rows.map((event) => (
                <TableRow key={event.id}>
                  <TableCell className="text-text-tertiary">
                    <LocalDateTime iso={event.createdAt.toISOString()} />
                  </TableCell>
                  <TableCell className="text-text-secondary">{event.actor?.name ?? "System"}</TableCell>
                  <TableCell className="font-mono text-xs text-text-primary">{event.action}</TableCell>
                  <TableCell className="text-text-secondary">
                    {event.entityType}
                    {event.entityId ? ` · ${event.entityId.slice(0, 8)}` : ""}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {pageCount > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-xs text-text-tertiary">
                Page {page} of {pageCount}
              </p>
              <div className="flex gap-2">
                {page <= 1 ? (
                  <Button variant="secondary" size="sm" disabled>
                    Previous
                  </Button>
                ) : (
                  <Link href={`/admin/audit-log?page=${page - 1}`}>
                    <Button variant="secondary" size="sm">
                      Previous
                    </Button>
                  </Link>
                )}
                {page >= pageCount ? (
                  <Button variant="secondary" size="sm" disabled>
                    Next
                  </Button>
                ) : (
                  <Link href={`/admin/audit-log?page=${page + 1}`}>
                    <Button variant="secondary" size="sm">
                      Next
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
