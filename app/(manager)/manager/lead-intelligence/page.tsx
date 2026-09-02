import Link from "next/link";
import { getLeadListRows } from "@/lib/analytics/lead-lists";
import { parseRangeParam, DATE_RANGE_LABELS } from "@/lib/utils/date-range";
import { DateRangeFilter } from "@/components/manager/DateRangeFilter";
import { Table, TableHead, TableHeadCell, TableBody, TableFoot, TableRow, TableCell } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { LinkButton } from "@/components/ui/LinkButton";
import { Sparkline } from "@/components/ui/Sparkline";
import { fetchLeadListSparklines, EMPTY_SPARKLINE } from "@/lib/analytics/sparkline";
import { deriveMetrics, sumTotals } from "@/lib/metrics/core";
import { formatInt, formatPercent } from "@/lib/format/number";
import { dqRateTone, wrongNumberRateTone, toneTextClass } from "@/lib/format/tone";

export default async function LeadIntelligencePage({ searchParams }: PageProps<"/manager/lead-intelligence">) {
  const params = await searchParams;
  const { preset, range } = parseRangeParam(params);
  const [rows, sparklines] = await Promise.all([getLeadListRows(range), fetchLeadListSparklines()]);

  const exportParams = new URLSearchParams();
  if (params.range) exportParams.set("range", String(params.range));
  const exportHref = `/api/export/lead-lists?${exportParams.toString()}`;

  // Derived from summed counts rather than averaged across lists — see TableFoot.
  const totals = sumTotals(rows);
  const totalMetrics = deriveMetrics(totals);
  const totalTextAppointments = rows.reduce((sum, r) => sum + r.textAppointments, 0);

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
              <TableHeadCell numeric>Rank</TableHeadCell>
              <TableHeadCell>Lead List</TableHeadCell>
              <TableHeadCell>7-Day Trend</TableHeadCell>
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
            </tr>
          </TableHead>
          <TableBody>
            {rows.map((row, i) => (
              <TableRow key={row.id}>
                <TableCell numeric className="text-text-tertiary">{row.rankEligible ? i + 1 : "—"}</TableCell>
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
                  <Sparkline values={sparklines.get(row.id) ?? EMPTY_SPARKLINE} />
                </TableCell>
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
              </TableRow>
            ))}
          </TableBody>
          <TableFoot>
            <tr>
              <TableCell />
              <TableCell className="font-semibold text-text-primary">All lists</TableCell>
              <TableCell />
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
            </tr>
          </TableFoot>
        </Table>
      )}
    </div>
  );
}
