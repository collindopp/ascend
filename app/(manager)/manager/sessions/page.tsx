import Link from "next/link";
import { getSessionsList, getFilterOptions } from "@/lib/analytics/sessions-explorer";
import { parseRangeParam, DATE_RANGE_LABELS } from "@/lib/utils/date-range";
import { DateRangeFilter } from "@/components/manager/DateRangeFilter";
import { SessionFilters } from "@/components/manager/SessionFilters";
import { Table, TableHead, TableHeadCell, TableBody, TableRow, TableCell } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { formatInt, formatDurationCompact } from "@/lib/format/number";

const PAGE_SIZE = 25;

export default async function SessionsExplorerPage({ searchParams }: PageProps<"/manager/sessions">) {
  const params = await searchParams;
  const { preset, range } = parseRangeParam(params);
  const setterId = typeof params.setter === "string" ? params.setter : undefined;
  const leadListId = typeof params.leadList === "string" ? params.leadList : undefined;
  const page = Math.max(1, Number(Array.isArray(params.page) ? params.page[0] : params.page) || 1);

  const [{ rows, total, pageCount }, filterOptions] = await Promise.all([
    getSessionsList({ range, setterId, leadListId, page, pageSize: PAGE_SIZE }),
    getFilterOptions(),
  ]);

  const buildPageHref = (targetPage: number) => {
    const p = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (key === "page" || value === undefined) continue;
      p.set(key, Array.isArray(value) ? value[0] : value);
    }
    p.set("page", String(targetPage));
    return `/manager/sessions?${p.toString()}`;
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-text-primary">Session Explorer</h1>
          <p className="mt-1 text-sm text-text-tertiary">
            {DATE_RANGE_LABELS[preset]} · {formatInt(total)} sessions
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <SessionFilters setters={filterOptions.setters} leadLists={filterOptions.leadLists} />
          <DateRangeFilter />
        </div>
      </div>

      {rows.length === 0 ? (
        <EmptyState title="No sessions found" description="Try a different date range or filter." />
      ) : (
        <>
          <Table>
            <TableHead>
              <tr>
                <TableHeadCell>Setter</TableHeadCell>
                <TableHeadCell>Lead List</TableHeadCell>
                <TableHeadCell>Started</TableHeadCell>
                <TableHeadCell>Duration</TableHeadCell>
                <TableHeadCell>Conversations</TableHeadCell>
                <TableHeadCell>Appointments</TableHeadCell>
                <TableHeadCell>DQ</TableHeadCell>
                <TableHeadCell>Wrong #</TableHeadCell>
                <TableHeadCell>Status</TableHeadCell>
              </tr>
            </TableHead>
            <TableBody>
              {rows.map((session) => {
                const durationSeconds = Math.max(
                  0,
                  Math.round(((session.endedAt ?? new Date()).getTime() - session.startedAt.getTime()) / 1000),
                );
                return (
                  <TableRow key={session.id}>
                    <TableCell className="font-medium text-text-primary">{session.setter.name}</TableCell>
                    <TableCell>{session.leadList.name}</TableCell>
                    <TableCell className="text-text-tertiary">
                      {session.startedAt.toLocaleDateString("en-US", { month: "short", day: "numeric" })}{" "}
                      {session.startedAt.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                    </TableCell>
                    <TableCell className="font-mono tabular-nums">{formatDurationCompact(durationSeconds)}</TableCell>
                    <TableCell className="font-mono tabular-nums">{formatInt(session.conversations)}</TableCell>
                    <TableCell className="font-mono tabular-nums text-accent">{formatInt(session.appointments)}</TableCell>
                    <TableCell className="font-mono tabular-nums text-text-secondary">{formatInt(session.dq)}</TableCell>
                    <TableCell className="font-mono tabular-nums text-text-secondary">{formatInt(session.wrongNumber)}</TableCell>
                    <TableCell>
                      <Badge tone={session.status === "ACTIVE" ? "positive" : "neutral"}>{session.status}</Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
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
                  <Link href={buildPageHref(page - 1)}>
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
                  <Link href={buildPageHref(page + 1)}>
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
