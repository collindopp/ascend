import Link from "next/link";
import { getLeadListRows } from "@/lib/analytics/lead-lists";
import { parseRangeParam, DATE_RANGE_LABELS } from "@/lib/utils/date-range";
import { DateRangeFilter } from "@/components/manager/DateRangeFilter";
import { Table, TableHead, TableHeadCell, TableBody, TableRow, TableCell } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { LinkButton } from "@/components/ui/LinkButton";
import { Sparkline } from "@/components/ui/Sparkline";
import { formatInt, formatPercent } from "@/lib/format/number";
import { dqRateTone, wrongNumberRateTone, toneTextClass } from "@/lib/format/tone";

export default async function LeadIntelligencePage({ searchParams }: PageProps<"/manager/lead-intelligence">) {
  const params = await searchParams;
  const { preset, range } = parseRangeParam(params);
  const rows = await getLeadListRows(range);

  const exportParams = new URLSearchParams();
  if (params.range) exportParams.set("range", String(params.range));
  const exportHref = `/api/export/lead-lists?${exportParams.toString()}`;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-text-primary">Lead Intelligence</h1>
          <p className="mt-1 text-sm text-text-tertiary">
            Ranked by set rate — {DATE_RANGE_LABELS[preset]}. Lists with too few conversations to rank reliably are sorted by volume instead.
          </p>
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
              <TableHeadCell>Rank</TableHeadCell>
              <TableHeadCell>Lead List</TableHeadCell>
              <TableHeadCell>7-Day Trend</TableHeadCell>
              <TableHeadCell>Conversations</TableHeadCell>
              <TableHeadCell>Appointments</TableHeadCell>
              <TableHeadCell>Text Appts</TableHeadCell>
              <TableHeadCell>Set Rate</TableHeadCell>
              <TableHeadCell>DQ Rate</TableHeadCell>
              <TableHeadCell>Wrong # Rate</TableHeadCell>
            </tr>
          </TableHead>
          <TableBody>
            {rows.map((row, i) => (
              <TableRow key={row.id}>
                <TableCell className="font-mono text-text-tertiary">{row.rankEligible ? i + 1 : "—"}</TableCell>
                <TableCell>
                  <Link href={`/manager/lead-intelligence/${row.id}`} className="font-medium text-text-primary hover:text-accent">
                    {row.name}
                  </Link>
                  {!row.rankEligible && (
                    <Badge tone="neutral" className="ml-2">
                      Low sample
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  <Sparkline values={row.sparkline} />
                </TableCell>
                <TableCell className="font-mono tabular-nums">{formatInt(row.conversations)}</TableCell>
                <TableCell className="font-mono tabular-nums text-accent">{formatInt(row.appointments)}</TableCell>
                <TableCell className="font-mono tabular-nums text-text-secondary">{formatInt(row.textAppointments)}</TableCell>
                <TableCell className="font-mono tabular-nums">{formatPercent(row.metrics.setRateFromConversations)}</TableCell>
                <TableCell className={`font-mono tabular-nums ${toneTextClass(dqRateTone(row.metrics.dqRate))}`}>
                  {formatPercent(row.metrics.dqRate)}
                </TableCell>
                <TableCell className={`font-mono tabular-nums ${toneTextClass(wrongNumberRateTone(row.metrics.wrongNumberRate))}`}>
                  {formatPercent(row.metrics.wrongNumberRate)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
