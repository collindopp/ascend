import Link from "next/link";
import { getSetterRows } from "@/lib/analytics/setters";
import { parseRangeParam, DATE_RANGE_LABELS } from "@/lib/utils/date-range";
import { DateRangeFilter } from "@/components/manager/DateRangeFilter";
import { Table, TableHead, TableHeadCell, TableBody, TableFoot, TableRow, TableCell } from "@/components/ui/Table";
import { EmptyState } from "@/components/ui/EmptyState";
import { LinkButton } from "@/components/ui/LinkButton";
import { Avatar } from "@/components/ui/Avatar";
import { Sparkline } from "@/components/ui/Sparkline";
import { fetchSetterSparklines, EMPTY_SPARKLINE } from "@/lib/analytics/sparkline";
import { deriveMetrics, sumTotals } from "@/lib/metrics/core";
import { formatInt, formatPercent, formatRate, formatDurationCompact } from "@/lib/format/number";
import { dqRateTone, wrongNumberRateTone, toneTextClass } from "@/lib/format/tone";

export default async function SettersPage({ searchParams }: PageProps<"/manager/setters">) {
  const params = await searchParams;
  const { preset, range } = parseRangeParam(params);
  const [rows, sparklines] = await Promise.all([getSetterRows(range), fetchSetterSparklines()]);

  const exportParams = new URLSearchParams();
  if (params.range) exportParams.set("range", String(params.range));
  const exportHref = `/api/export/setters?${exportParams.toString()}`;

  // Rates on the totals row are derived from the summed counts, never averaged
  // across reps — see TableFoot.
  const totals = sumTotals(rows);
  const totalMetrics = deriveMetrics(totals);
  const totalTextAppointments = rows.reduce((sum, r) => sum + r.textAppointments, 0);
  const totalSessions = rows.reduce((sum, r) => sum + r.sessionsCount, 0);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-text-primary">Setters</h1>
          <p className="mt-1 text-sm text-text-tertiary">Individual performance — {DATE_RANGE_LABELS[preset]}.</p>
        </div>
        <div className="flex items-center gap-2">
          <LinkButton href={exportHref} size="sm" variant="secondary">
            Export CSV
          </LinkButton>
          <DateRangeFilter />
        </div>
      </div>

      {rows.length === 0 ? (
        <EmptyState title="No activity in this range" description="Try a wider date range." />
      ) : (
        <Table>
          <TableHead>
            <tr>
              <TableHeadCell>Setter</TableHeadCell>
              <TableHeadCell>7-Day Trend</TableHeadCell>
              <TableHeadCell numeric>Sessions</TableHeadCell>
              <TableHeadCell numeric>Active Time</TableHeadCell>
              <TableHeadCell numeric>Conv</TableHeadCell>
              <TableHeadCell numeric>Appts</TableHeadCell>
              <TableHeadCell numeric>Text Appts</TableHeadCell>
              <TableHeadCell numeric>Total Sets</TableHeadCell>
              <TableHeadCell numeric>Pick Ups</TableHeadCell>
              <TableHeadCell numeric>Not Int.</TableHeadCell>
              <TableHeadCell numeric>Follow Up</TableHeadCell>
              <TableHeadCell numeric>DQ</TableHeadCell>
              <TableHeadCell numeric>Wrong #</TableHeadCell>
              <TableHeadCell numeric>Set Rate</TableHeadCell>
              <TableHeadCell numeric>Not Int. Rate</TableHeadCell>
              <TableHeadCell numeric>DQ Rate</TableHeadCell>
              <TableHeadCell numeric>Wrong # Rate</TableHeadCell>
              <TableHeadCell numeric>Appts / Hr</TableHeadCell>
            </tr>
          </TableHead>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell>
                  <Link
                    href={`/manager/setters/${row.id}`}
                    className="flex items-center gap-2.5 font-medium text-text-primary hover:text-accent"
                  >
                    <Avatar name={row.name} size="sm" />
                    {row.name}
                  </Link>
                </TableCell>
                <TableCell>
                  <Sparkline values={sparklines.get(row.id) ?? EMPTY_SPARKLINE} />
                </TableCell>
                <TableCell numeric className="text-text-secondary">{formatInt(row.sessionsCount)}</TableCell>
                <TableCell numeric className="text-text-secondary">{formatDurationCompact(row.durationSeconds)}</TableCell>
                <TableCell numeric>{formatInt(row.conversations)}</TableCell>
                <TableCell numeric className="text-accent">{formatInt(row.appointments)}</TableCell>
                <TableCell numeric className="text-accent">{formatInt(row.textAppointments)}</TableCell>
                <TableCell numeric className="text-accent">{formatInt(row.appointments + row.textAppointments)}</TableCell>
                <TableCell numeric className="text-text-secondary">{formatInt(row.pickUps)}</TableCell>
                <TableCell numeric className="text-text-secondary">{formatInt(row.notInterested)}</TableCell>
                <TableCell numeric className="text-text-secondary">{formatInt(row.followUp)}</TableCell>
                <TableCell numeric className="text-text-secondary">{formatInt(row.dq)}</TableCell>
                <TableCell numeric className="text-text-secondary">{formatInt(row.wrongNumber)}</TableCell>
                <TableCell numeric>{formatPercent(row.metrics.setRateFromConversations)}</TableCell>
                <TableCell numeric className="text-text-secondary">{formatPercent(row.metrics.notInterestedRate)}</TableCell>
                <TableCell numeric className={toneTextClass(dqRateTone(row.metrics.dqRate))}>
                  {formatPercent(row.metrics.dqRate)}
                </TableCell>
                <TableCell numeric className={toneTextClass(wrongNumberRateTone(row.metrics.wrongNumberRate))}>
                  {formatPercent(row.metrics.wrongNumberRate)}
                </TableCell>
                <TableCell numeric>{formatRate(row.metrics.appointmentsPerHour)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFoot>
            <tr>
              <TableCell className="font-semibold text-text-primary">Team total</TableCell>
              <TableCell />
              <TableCell numeric>{formatInt(totalSessions)}</TableCell>
              <TableCell numeric>{formatDurationCompact(totals.durationSeconds)}</TableCell>
              <TableCell numeric>{formatInt(totals.conversations)}</TableCell>
              <TableCell numeric className="text-accent">{formatInt(totals.appointments)}</TableCell>
              <TableCell numeric className="text-accent">{formatInt(totalTextAppointments)}</TableCell>
              <TableCell numeric className="text-accent">{formatInt(totals.appointments + totalTextAppointments)}</TableCell>
              <TableCell numeric>{formatInt(totals.pickUps)}</TableCell>
              <TableCell numeric>{formatInt(totals.notInterested)}</TableCell>
              <TableCell numeric>{formatInt(totals.followUp)}</TableCell>
              <TableCell numeric>{formatInt(totals.dq)}</TableCell>
              <TableCell numeric>{formatInt(totals.wrongNumber)}</TableCell>
              <TableCell numeric>{formatPercent(totalMetrics.setRateFromConversations)}</TableCell>
              <TableCell numeric>{formatPercent(totalMetrics.notInterestedRate)}</TableCell>
              <TableCell numeric>{formatPercent(totalMetrics.dqRate)}</TableCell>
              <TableCell numeric>{formatPercent(totalMetrics.wrongNumberRate)}</TableCell>
              <TableCell numeric>{formatRate(totalMetrics.appointmentsPerHour)}</TableCell>
            </tr>
          </TableFoot>
        </Table>
      )}
    </div>
  );
}
