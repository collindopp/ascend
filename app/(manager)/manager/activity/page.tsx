import Link from "next/link";
import { getActiveNow, getRepActivitySummary, getActivityFeed, EVENT_TYPE_LABELS } from "@/lib/analytics/activity";
import { getFilterOptions } from "@/lib/analytics/sessions-explorer";
import { getDailyTimeWorked, EXPECTED_HOURS_PER_DAY } from "@/lib/analytics/time-worked";
import { parseRangeParam, DATE_RANGE_LABELS } from "@/lib/utils/date-range";
import { DateRangeFilter } from "@/components/manager/DateRangeFilter";
import { ActivityFilters } from "@/components/manager/ActivityFilters";
import { ActiveNowPanel } from "@/components/manager/ActiveNowPanel";
import { DailyTimeWorkedGrid } from "@/components/manager/DailyTimeWorkedGrid";
import { Table, TableHead, TableHeadCell, TableBody, TableRow, TableCell } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { LinkButton } from "@/components/ui/LinkButton";
import { LocalDateTime } from "@/components/ui/LocalDateTime";
import { Avatar } from "@/components/ui/Avatar";
import { formatInt, formatDurationCompact, formatRate } from "@/lib/format/number";

const PAGE_SIZE = 30;

export default async function RepActivityPage({ searchParams }: PageProps<"/manager/activity">) {
  const params = await searchParams;
  const { preset, range } = parseRangeParam(params);
  const setterId = typeof params.setter === "string" ? params.setter : undefined;
  const page = Math.max(1, Number(Array.isArray(params.page) ? params.page[0] : params.page) || 1);

  const exportParams = new URLSearchParams();
  if (params.range) exportParams.set("range", String(params.range));
  if (setterId) exportParams.set("setter", setterId);
  const exportHref = `/api/export/activity?${exportParams.toString()}`;

  const [activeNow, summary, feed, { setters }, dailyTimeWorked] = await Promise.all([
    getActiveNow(),
    getRepActivitySummary(range),
    getActivityFeed({ range, setterId, page, pageSize: PAGE_SIZE }),
    getFilterOptions(),
    getDailyTimeWorked(),
  ]);

  const buildPageHref = (targetPage: number) => {
    const p = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (key === "page" || value === undefined) continue;
      p.set(key, Array.isArray(value) ? value[0] : value);
    }
    p.set("page", String(targetPage));
    return `/manager/activity?${p.toString()}`;
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-lg font-semibold text-text-primary">Rep Activity</h1>
        <p className="mt-1 text-sm text-text-tertiary">Live status and a full audit trail of what every rep is doing.</p>
      </div>

      <ActiveNowPanel initialRows={activeNow} />

      <div className="flex flex-col gap-3">
        <div>
          <h2 className="text-sm font-semibold text-text-primary">Daily Time Worked — Last 14 Days</h2>
          <p className="mt-1 text-xs text-text-tertiary">
            Active session time per day. Tint scales toward {EXPECTED_HOURS_PER_DAY}h; a red — is a day with zero logged
            activity.
          </p>
        </div>
        <DailyTimeWorkedGrid rows={dailyTimeWorked} />
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-text-primary">Summary — {DATE_RANGE_LABELS[preset]}</h2>
        {summary.length === 0 ? (
          <EmptyState title="No activity in this range" />
        ) : (
          <Table>
            <TableHead>
              <tr>
                <TableHeadCell>Rep</TableHeadCell>
                <TableHeadCell numeric>Sessions</TableHeadCell>
                <TableHeadCell numeric>Active Time</TableHeadCell>
                <TableHeadCell numeric>Taps</TableHeadCell>
                <TableHeadCell numeric>Text Appts</TableHeadCell>
                <TableHeadCell numeric>Corrections</TableHeadCell>
                <TableHeadCell numeric>Taps / Hour</TableHeadCell>
                <TableHeadCell>Last Active</TableHeadCell>
              </tr>
            </TableHead>
            <TableBody>
              {summary.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-medium text-text-primary">
                    <Link href={`/manager/setters/${row.id}`} className="flex items-center gap-2.5 hover:text-accent">
                      <Avatar name={row.name} size="sm" />
                      {row.name}
                    </Link>
                  </TableCell>
                  <TableCell numeric>{formatInt(row.sessionsCount)}</TableCell>
                  <TableCell numeric>{formatDurationCompact(row.durationSeconds)}</TableCell>
                  <TableCell numeric className="text-accent">{formatInt(row.taps)}</TableCell>
                  <TableCell numeric className="text-accent">{formatInt(row.textAppointments)}</TableCell>
                  <TableCell numeric className="text-text-secondary">{formatInt(row.undos)}</TableCell>
                  <TableCell numeric className="text-text-secondary">{formatRate(row.tapsPerHour)}</TableCell>
                  <TableCell className="text-text-tertiary">
                    {row.lastActiveAt ? (
                      <LocalDateTime
                        iso={row.lastActiveAt.toISOString()}
                        options={{ month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }}
                      />
                    ) : (
                      "—"
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-sm font-semibold text-text-primary">Activity Feed · {formatInt(feed.total)} events</h2>
          <div className="flex flex-wrap items-center gap-2">
            <ActivityFilters setters={setters} />
            <DateRangeFilter />
            <LinkButton href={exportHref} size="sm" variant="secondary">
              Export CSV
            </LinkButton>
          </div>
        </div>

        {feed.rows.length === 0 ? (
          <EmptyState title="No events found" description="Try a different date range or rep." />
        ) : (
          <>
            <Table>
              <TableHead>
                <tr>
                  <TableHeadCell>Time</TableHeadCell>
                  <TableHeadCell>Rep</TableHeadCell>
                  <TableHeadCell>Event</TableHeadCell>
                  <TableHeadCell>Lead List</TableHeadCell>
                </tr>
              </TableHead>
              <TableBody>
                {feed.rows.map((event) => (
                  <TableRow key={event.id}>
                    <TableCell className="text-text-tertiary">
                      <LocalDateTime
                        iso={event.createdAt.toISOString()}
                        options={{ month: "short", day: "numeric", hour: "numeric", minute: "2-digit", second: "2-digit" }}
                      />
                    </TableCell>
                    <TableCell className="font-medium text-text-primary">{event.setterName}</TableCell>
                    <TableCell>
                      <Badge
                        tone={
                          event.type === "UNDO" ? "warning" : event.type === "TEXT_APPOINTMENT" ? "positive" : "neutral"
                        }
                      >
                        {EVENT_TYPE_LABELS[event.type] ?? event.type}
                      </Badge>
                      {event.note && <span className="ml-2 text-xs text-text-tertiary">{event.note}</span>}
                    </TableCell>
                    <TableCell className="text-text-secondary">{event.leadListName}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {feed.pageCount > 1 && (
              <div className="flex items-center justify-between">
                <p className="text-xs text-text-tertiary">
                  Page {page} of {feed.pageCount}
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
                  {page >= feed.pageCount ? (
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
    </div>
  );
}
